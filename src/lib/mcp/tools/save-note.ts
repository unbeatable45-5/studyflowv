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
  name: "save_note",
  title: "Save a study note",
  description:
    "Save a note or summary into the signed-in user's StudyFlow Library so it appears alongside other study outputs.",
  inputSchema: {
    title: z.string().min(1).describe("Short title for the note."),
    content: z.string().min(1).describe("Markdown content of the note."),
    subject: z.string().optional().describe("Optional subject tag."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, content, subject }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await db(ctx)
      .from("saved_outputs")
      .insert({
        user_id: ctx.getUserId(),
        tool: "mcp-note",
        custom_title: title,
        subject: subject ?? null,
        output_text: content,
        input_data: { source: "mcp" },
      })
      .select("id, created_at")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Saved note ${data?.id}` }],
      structuredContent: data as Record<string, unknown>,
    };
  },
});
