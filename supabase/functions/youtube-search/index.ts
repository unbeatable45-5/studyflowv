import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, maxResults = 6 } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY not configured");

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", String(Math.min(Math.max(maxResults, 1), 10)));
    url.searchParams.set("q", query);
    url.searchParams.set("safeSearch", "moderate");
    url.searchParams.set("relevanceLanguage", "en");
    url.searchParams.set("key", YOUTUBE_API_KEY);

    const r = await fetch(url.toString());
    if (!r.ok) {
      const t = await r.text();
      console.error("YouTube error:", r.status, t);
      return new Response(JSON.stringify({ error: "YouTube API error", detail: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await r.json();
    const videos = (data.items ?? []).map((it: any) => ({
      videoId: it.id?.videoId,
      title: it.snippet?.title,
      description: it.snippet?.description,
      channel: it.snippet?.channelTitle,
      thumbnail: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url,
      publishedAt: it.snippet?.publishedAt,
      url: `https://www.youtube.com/watch?v=${it.id?.videoId}`,
    })).filter((v: any) => v.videoId);

    return new Response(JSON.stringify({ videos }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("youtube-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
