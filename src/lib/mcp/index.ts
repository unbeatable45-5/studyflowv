import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listSavedOutputs from "./tools/list-saved-outputs";
import getSavedOutput from "./tools/get-saved-output";
import listExamSessions from "./tools/list-exam-sessions";
import saveNote from "./tools/save-note";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "studyflow-mcp",
  title: "StudyFlow",
  version: "0.1.0",
  instructions:
    "Access the signed-in student's StudyFlow library and exam history. Use `list_saved_outputs` to browse saved summaries, notes, flashcards, and generated exams, `get_saved_output` to read one in full, `list_exam_sessions` to review recent practice exam scores and weak topics, and `save_note` to add a new note to the Library.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listSavedOutputs, getSavedOutput, listExamSessions, saveNote],
});
