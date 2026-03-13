import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, mode, numQuestions } = await req.json();

    if (!content || !mode || !numQuestions) {
      return new Response(JSON.stringify({ error: "content, mode, and numQuestions are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let modeInstructions = "";

    if (mode === "cbt") {
      modeInstructions = `Generate exactly ${numQuestions} multiple-choice questions (CBT style). Format each as:

**Q1. [question]**
A) [option]
B) [option]
C) [option]
D) [option]

---ANSWER--- A) [correct option with brief explanation]

Number them sequentially. The ---ANSWER--- marker separates each question's answer.`;
    } else if (mode === "fill") {
      modeInstructions = `Generate exactly ${numQuestions} fill-in-the-blank questions. Format each as:

**Q1.** [sentence with ______ for the blank]

---ANSWER--- [correct answer with brief explanation]

Number them sequentially.`;
    } else {
      modeInstructions = `Generate exactly ${numQuestions} theory/essay questions that require written answers. Format each as:

**Q1.** [question]

---ANSWER--- [model answer - concise but thorough, 2-4 sentences]

Number them sequentially.`;
    }

    const systemPrompt = `You are an expert exam question generator. Given study material, generate practice questions.

${modeInstructions}

IMPORTANT RULES:
- Base questions ONLY on the provided content
- Make questions progressively harder
- Cover different aspects of the material
- Keep answers accurate and educational
- Use the exact format specified above with ---ANSWER--- markers`;

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
          { role: "user", content: `Generate practice questions from this material:\n\n${content.slice(0, 15000)}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
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
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
