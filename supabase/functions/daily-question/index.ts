import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, enforceLimit, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const { topics, mode, question, answer } = body;
    const topicList = topics?.length ? topics.join(", ") : "general knowledge, science, mathematics, history";

    if (mode !== "check") {
      const limited = await enforceLimit(auth.id, "daily_questions");
      if (limited) return limited;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt: string;
    let userContent: string;

    if (mode === "check") {
      systemPrompt = `You are a study tutor. Evaluate the student's answer. Return ONLY valid JSON with no markdown fences:
{"correct": true_or_false, "explanation": "Brief explanation of why correct/incorrect and the right answer"}`;
      userContent = `Question: ${question}\nStudent's answer: ${answer}`;
    } else {
      systemPrompt = `You are a study question generator. Generate ONE study question from these topics: ${topicList}.
Return ONLY valid JSON with no markdown fences:
{"topic": "chosen topic", "question": "question text", "type": "multiple_choice", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct_answer": "A", "hint": "a brief hint"}`;
      userContent = "Generate a study question now.";
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
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
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

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the content
    let parsed;
    try {
      // Remove possible markdown fences
      const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
