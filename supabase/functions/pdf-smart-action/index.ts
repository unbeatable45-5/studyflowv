import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Action = "summarize_page" | "generate_questions" | "explain" | "ask";

const PROMPTS: Record<Action, string> = {
  summarize_page: `You are an expert tutor. Summarize the provided page/section in clear bullet points. Focus on key concepts, definitions, and important details. Use markdown. Be concise (5-10 bullets) and student-friendly.`,
  generate_questions: `You are an exam coach. Generate 5 high-quality practice questions from the provided content. Mix multiple-choice (with 4 options and the correct answer marked) and 1-2 short-answer questions. Format as markdown with clear numbering. Include a brief answer key at the bottom.`,
  explain: `You are a patient tutor. Explain the provided concept/section in simple, clear language a student can understand. Use analogies where helpful. Use markdown. Keep it focused (around 150-250 words).`,
  ask: `You are a helpful study tutor. Answer the user's question using the provided context. If the context does not contain the answer, say so briefly and provide your best general answer. Use markdown.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, content, question } = await req.json();

    if (!action || !PROMPTS[action as Action]) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!content || typeof content !== "string" || !content.trim()) {
      return new Response(JSON.stringify({ error: "No content provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = PROMPTS[action as Action];
    const trimmed = content.slice(0, 40000);

    let userText = "";
    if (action === "ask") {
      userText = `Context from the document:\n\n${trimmed}\n\nUser question: ${question || "Explain the above."}`;
    } else if (action === "explain") {
      userText = `Explain the following content:\n\n${trimmed}`;
    } else if (action === "generate_questions") {
      userText = `Generate practice questions from this content:\n\n${trimmed}`;
    } else {
      userText = `Summarize this page/section:\n\n${trimmed}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("pdf-smart-action error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
