import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, enforceLimit, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const limited = await enforceLimit(auth.id, "pdfs");
  if (limited) return limited;

  try {
    const { text, summaryLength, images } = await req.json();
    const hasText = text && text.trim();
    const hasImages = images && Array.isArray(images) && images.length > 0;

    if (!hasText && !hasImages) {
      return new Response(JSON.stringify({ error: "No text or images provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const lengthGuide: Record<string, string> = {
      short: "Provide a very concise summary in 5-8 bullet points maximum. Be extremely brief.",
      medium: "Provide a balanced summary in 10-15 bullet points. Include key details.",
      detailed: "Provide a comprehensive summary in 15-25 bullet points. Include supporting details, examples, and context.",
    };

    const guide = lengthGuide[summaryLength] || lengthGuide.medium;
    const isSlideMode = hasImages;

    const systemPrompt = isSlideMode
      ? `You are an expert academic summarizer analyzing presentation slides/scanned document pages. The student has uploaded image-based PDF pages.

Instructions:
- ${guide}
- Carefully read all text visible in the slide images
- Identify diagrams, charts, and visual elements and describe their meaning
- Structure the output as follows:

## Key Points
- Bullet points of the most important information from all slides

## Important Concepts
- List and briefly explain critical concepts, terms, or ideas shown in the slides

## Visual Elements
- Describe any important diagrams, charts, or visual aids and what they convey

## Summary
A short cohesive paragraph that ties the key points together.

Rules:
- Use clear, student-friendly language
- If slides have distinct sections/topics, organize accordingly
- Never mention that you are an AI
- Format using markdown`
      : `You are an expert academic summarizer. A student has uploaded a PDF document. Your job is to summarize the extracted text clearly and professionally.

Instructions:
- ${guide}
- Structure the output as follows:

## Key Points
- Bullet points of the most important information

## Important Concepts
- List and briefly explain critical concepts, terms, or ideas

## Summary
A short cohesive paragraph that ties the key points together.

Rules:
- Use clear, student-friendly language
- Preserve accuracy of the original content
- If the document has distinct sections, organize your summary accordingly
- Never mention that you are an AI or that this is a prompt
- Format using markdown`;

    // Build messages based on mode
    const userContent: any[] = [];

    if (isSlideMode) {
      userContent.push({ type: "text", text: `Please analyze and summarize these ${images.length} slide/page images from a PDF document:` });
      // Limit to 20 pages max to control costs
      const pageImages = images.slice(0, 20);
      for (const img of pageImages) {
        userContent.push({
          type: "image_url",
          image_url: { url: img },
        });
      }
      if (hasText) {
        userContent.push({ type: "text", text: `\n\nAdditional extracted text for context:\n${text.slice(0, 20000)}` });
      }
    } else {
      userContent.push({ type: "text", text: `Please summarize the following document text:\n\n${text.slice(0, 80000)}` });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: isSlideMode ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
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
