import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUBJECTS = [
  "Mathematics", "Biology", "Chemistry", "Physics", "Computer Science",
  "History", "Geography", "English", "Literature", "Economics",
  "Business Studies", "Psychology", "Philosophy", "Art", "Music",
  "Foreign Languages", "Law", "Medicine", "Engineering", "General Studies",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, tool } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ subject: "General Studies" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Classify the following study content into exactly ONE subject from this list: ${SUBJECTS.join(", ")}. Respond with ONLY the subject name, nothing else.`,
          },
          { role: "user", content: text.slice(0, 2000) },
        ],
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ subject: "General Studies" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    const subject = SUBJECTS.find((s) => raw.toLowerCase().includes(s.toLowerCase())) || "General Studies";

    return new Response(JSON.stringify({ subject }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ subject: "General Studies" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
