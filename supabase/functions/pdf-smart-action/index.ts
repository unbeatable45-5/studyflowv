import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, corsHeaders } from "../_shared/auth.ts";

type Action = "summarize_page" | "generate_questions" | "explain" | "ask" | "make_flashcards";

const MATH_RULE = `When the content contains math, physics, chemistry or any formula, write it in LaTeX: use $...$ for inline math and $$...$$ for display equations (e.g. $a^2 + b^2 = c^2$, $$\\frac{d}{dx}\\sin x = \\cos x$$). Do NOT use Unicode math symbols when LaTeX is clearer. This keeps formulas renderable and copyable.`;

const PROMPTS: Record<Action, string> = {
  summarize_page: `You are an expert tutor. Summarize the provided page/section in clear bullet points. Focus on key concepts, definitions, and important details. Use markdown. Be concise (5-10 bullets) and student-friendly. ${MATH_RULE}`,
  generate_questions: `You are an exam coach writing realistic exam questions from the provided content. Generate 5 high-quality questions that mirror real exam style: scenario/application-based where possible, varied difficulty (mix recall, application, analysis), covering distinct topics. Mix multiple-choice (4 options, mark correct one) and 1-2 short-answer. Format as markdown with clear numbering and a brief answer key at the bottom. ${MATH_RULE}`,
  explain: `You are a patient tutor. Explain the provided concept/section in simple, clear language a student can understand. Use analogies where helpful. Use markdown. Keep it focused (around 150-250 words). ${MATH_RULE}`,
  ask: `You are a helpful study tutor. Answer the user's question using the provided context. If the context does not contain the answer, say so briefly and provide your best general answer. Use markdown. ${MATH_RULE}`,
  make_flashcards: `You are a flashcard creator. Turn the provided content into 6-10 high-quality study flashcards. Format as markdown with each card as: **Q:** question on one line, **A:** answer on the next line, separated by a blank line. Keep questions concise and answers clear. ${MATH_RULE}`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

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
    } else if (action === "make_flashcards") {
      userText = `Turn this content into flashcards:\n\n${trimmed}`;
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
