import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function db(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_saved_outputs",
  title: "List saved study outputs",
  description:
    "List the signed-in user's saved AI study outputs (summaries, notes, flashcards, exam questions, etc.), most recent first. Optionally filter by tool or subject.",
  inputSchema: {
    tool: z
      .string()
      .optional()
      .describe("Filter by tool name (e.g. 'study-helper', 'pdf-summarizer', 'flashcard-generator', 'practice-exam', 'note-organizer')."),
    subject: z.string().optional().describe("Filter by subject tag."),
    limit: z.number().int().min(1).max(50).optional().describe("Max rows to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ tool, subject, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = db(ctx)
      .from("saved_outputs")
      .select("id, tool, subject, custom_title, created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (tool) q = q.eq("tool", tool);
    if (subject) q = q.eq("subject", subject);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { items: data ?? [] },
    };
  },
});
