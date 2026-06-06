import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  try {
    const { topic, notes } = await req.json();
    const input = notes || topic;
    if (!input) {
      return new Response(JSON.stringify({ error: "Topic or notes required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert study session generator. Given a topic or notes, create a COMPLETE study session with ALL four sections below. Use the EXACT section headers shown.

## Topic Summary
Provide a clear 3-5 sentence explanation followed by bullet points of key ideas. Bold important terms.

## Flashcards
Generate exactly 6 flashcards in this format:
**Q1:** [question]
**A1:** [answer]

**Q2:** [question]
**A2:** [answer]
(continue for all 6)

## Practice Quiz
Generate exactly 5 multiple choice questions:
**1. [question]**
A) [option]
B) [option]
C) [option]
D) [option]
**Answer: [letter]) [explanation]**

(continue for all 5)

## Quick Revision Plan
Provide a numbered 5-step study plan, each step 1-2 sentences. Make it actionable and time-boxed.

Keep language student-friendly. Be accurate and thorough.`,
          },
          { role: "user", content: `Create a complete study session for:\n\n${input}` },
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
