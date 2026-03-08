import { supabase } from "@/integrations/supabase/client";

export async function saveOutput(tool: string, inputData: Record<string, unknown>, outputText: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase.from("saved_outputs").insert([{
    user_id: user.id,
    tool,
    input_data: inputData as any,
    output_text: outputText,
  }]).select("id").single();

  // Fire-and-forget subject detection
  if (data?.id) {
    detectAndUpdateSubject(data.id, outputText).catch(() => {});
  }
}

async function detectAndUpdateSubject(outputId: string, text: string) {
  try {
    const { data, error } = await supabase.functions.invoke("detect-subject", {
      body: { text: text.slice(0, 2000) },
    });
    if (!error && data?.subject) {
      await supabase
        .from("saved_outputs")
        .update({ subject: data.subject } as any)
        .eq("id", outputId);
    }
  } catch {
    // Silently fail — subject detection is optional
  }
}

export async function getRecentOutputs(tool?: string, limit = 5) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("saved_outputs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (tool) query = query.eq("tool", tool);

  const { data } = await query;
  return data ?? [];
}
