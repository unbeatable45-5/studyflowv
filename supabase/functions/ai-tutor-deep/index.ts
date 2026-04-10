import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try OpenRouter first, fall back to Lovable AI Gateway
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const useOpenRouter = !!OPENROUTER_API_KEY;
    const apiUrl = useOpenRouter
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://ai.gateway.lovable.dev/v1/chat/completions";
    const apiKey = useOpenRouter ? OPENROUTER_API_KEY : LOVABLE_API_KEY;
    const model = useOpenRouter ? "deepseek/deepseek-r1" : "google/gemini-2.5-pro";

    if (!apiKey) throw new Error("No API key configured for Deep Think");

    const systemPrompt = `You are StudyFlow Deep Think AI Tutor — an advanced, thorough study assistant that provides exceptionally detailed and well-reasoned answers.

Your approach:
- Think step-by-step through complex problems
- Provide comprehensive, in-depth explanations
- Cover multiple angles and perspectives
- Include detailed examples, proofs, and derivations where relevant
- Connect concepts to broader themes and real-world applications
- Anticipate follow-up questions and address them proactively

Your capabilities:
- Deep analysis of any academic topic
- Multi-step problem solving with full working shown
- Detailed comparisons and critical analysis
- Comprehensive study guides with mnemonics and memory techniques
- Thorough exam preparation with edge cases

Guidelines:
- Use markdown formatting: **bold** for key terms, bullet points, ## headers, code blocks where relevant
- Be thorough but organized — use clear section headers
- Show all working and reasoning steps
- If a topic has nuances or common misconceptions, address them
- Always be accurate — if unsure, say so honestly`;

    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    };

    // Add reasoning for Lovable AI Gateway models that support it
    if (!useOpenRouter) {
      body.reasoning = { effort: "high" };
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    if (useOpenRouter) {
      headers["HTTP-Referer"] = "https://studyflowv.lovable.app";
      headers["X-Title"] = "StudyFlow";
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please try again later." }), {
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
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
