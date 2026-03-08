import { supabase } from "@/integrations/supabase/client";

export async function saveOutput(tool: string, inputData: Record<string, unknown>, outputText: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("saved_outputs").insert({
    user_id: user.id,
    tool,
    input_data: inputData,
    output_text: outputText,
  });
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
