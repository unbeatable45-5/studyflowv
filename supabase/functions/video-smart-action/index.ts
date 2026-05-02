import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Action = "summarize_video" | "key_notes" | "video_questions";

const PROMPTS: Record<Action, string> = {
  summarize_video: `You are an expert tutor. Based on the YouTube video's title, channel, and description, produce a concise study summary of what this video likely covers. Use markdown bullets. Be honest about uncertainty if the description is sparse.`,
  key_notes: `You are a study notes generator. From the video title and description, generate 8-12 high-quality bullet-point study notes that a student would write while watching. Group under short subheadings if useful. Use markdown.`,
  video_questions: `You are an exam coach. Generate 6 practice questions (mix MCQ with 4 options + correct answer marked, and 2 short-answer) on the topic of this video. Use markdown with numbering and an answer key at the bottom.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, video } = await req.json();
    if (!action || !PROMPTS[action as Action]) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!video || !video.title) {
      return new Response(JSON.stringify({ error: "Missing video" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userText = `Video title: ${video.title}\nChannel: ${video.channel ?? "Unknown"}\nDescription: ${(video.description ?? "").slice(0, 4000)}\nURL: ${video.url ?? ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: PROMPTS[action as Action] },
          { role: "user", content: userText },
        ],
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("video-smart-action error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
