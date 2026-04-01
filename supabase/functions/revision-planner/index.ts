import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { courses, hoursPerDay } = await req.json();
    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      return new Response(JSON.stringify({ error: "At least one course is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const courseList = courses.map((c: { name: string; examDate: string }) =>
      `- ${c.name} (Exam: ${c.examDate})`
    ).join("\n");

    const today = new Date().toISOString().split("T")[0];

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
            content: `You are a study planner for university/secondary school students. Today is ${today}.

Create a SPECIFIC, ACTIONABLE day-by-day revision plan. NO generic advice.

RULES:
- Prioritize courses by exam proximity (nearest exam = more early focus)
- For "Unknown" exam dates, allocate consistent daily review
- Each day MUST follow this cycle pattern:
  **Day 1 (Learn):** Read chapter/topic summary, write key notes, highlight formulas
  **Day 2 (Practice):** Do practice questions, create flashcards, active recall
  **Day 3 (Test):** Take a timed quiz/CBT, review mistakes, revise weak areas
  Then repeat the cycle for next topic.

- Include specific topic names, chapter references where possible
- Allocate exact time blocks (e.g., "9:00-10:30 AM: Biology - Cell Division (Learn)")
- Include short breaks every 90 minutes
- Maximum ${hoursPerDay} hours of study per day

OUTPUT FORMAT (use markdown):

## 📅 Week 1 Study Plan

### Day 1 (Monday) — LEARN
| Time | Course | Activity | Details |
|------|--------|----------|---------|
| 9:00-10:30 | Course Name | Learn | Read Chapter X, summarize key points |
| 10:45-12:00 | Course Name | Learn | Study topic Y, write notes |

### Day 2 (Tuesday) — PRACTICE
| Time | Course | Activity | Details |
|------|--------|----------|---------|
| 9:00-10:30 | Course Name | Practice | Solve past questions Ch.X, create 10 flashcards |

### Day 3 (Wednesday) — TEST
| Time | Course | Activity | Details |
|------|--------|----------|---------|
| 9:00-10:30 | Course Name | Test | Timed CBT quiz (15 min), review wrong answers |

(Continue for 7 days, then outline Week 2)

## ⚡ Quick Tips
(2-3 specific, actionable study tips)

## 📊 Priority Order
(Rank courses by urgency with exam dates)`,
          },
          {
            role: "user",
            content: `Create a detailed study plan for these courses with ${hoursPerDay} hours/day:\n\n${courseList}`,
          },
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
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
