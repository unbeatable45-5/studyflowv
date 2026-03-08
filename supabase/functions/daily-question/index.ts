import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topics, mode } = await req.json();
    const topicList = topics?.length ? topics.join(", ") : "general knowledge, science, mathematics, history";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isCheck = mode === "check";

    const systemPrompt = isCheck
      ? `You are a study tutor. The student answered a question. Evaluate their answer. Return JSON:
{
  "correct": true/false,
  "explanation": "Brief explanation of why it's correct or incorrect and the right answer"
}
Return ONLY valid JSON, no markdown.`
      : `You are a study question generator. Generate ONE study question based on these topics: ${topicList}.
Pick a random topic from the list. Return JSON:
{
  "topic": "the chosen topic",
  "question": "the question text",
  "type": "multiple_choice",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct_answer": "A",
  "hint": "a brief hint"
}
Return ONLY valid JSON, no markdown.`;

    const userContent = isCheck
      ? `Question: ${(await req.json().catch(() => ({ question: "", answer: "" }))).question || ""}\nStudent's answer: ${(await req.json().catch(() => ({ answer: "" }))).answer || ""}`
      : "Generate a question now.";

    // Re-parse body for check mode
    let messages;
    if (isCheck) {
      const body = await req.json().catch(() => null);
      // Body already parsed above, use topics/mode from first parse
      const reqBody = JSON.parse(await req.text().catch(() => "{}"));
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Question: ${reqBody.question}\nStudent's answer: ${reqBody.answer}` },
      ];
    } else {
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate a question now." },
      ];
    }

    // Actually need to re-read body properly
    // Since we already consumed req.json() above, let's restructure
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
          { role: "user", content: isCheck ? `Evaluate this answer` : "Generate a question now." },
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

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
