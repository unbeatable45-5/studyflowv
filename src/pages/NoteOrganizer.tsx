import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { saveOutput } from "@/lib/saved-outputs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AIThinking from "@/components/AIThinking";
import OutputActions from "@/components/OutputActions";
import MarkdownWithMath from "@/components/MarkdownWithMath";
import ShareResultButton from "@/components/ShareResultButton";
import TimeSavedIndicator from "@/components/TimeSavedIndicator";
import { streamAI } from "@/lib/streaming";
import { FileText, Loader2, FileDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const NoteOrganizer = () => {
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleOrganize = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    setOutput("");

    let fullText = "";
    await streamAI({
      functionName: "note-organizer",
      body: { notes: notes.trim() },
      onDelta: (text) => {
        fullText += text;
        setOutput(fullText);
      },
      onDone: () => {
        setLoading(false);
        saveOutput("note-organizer", { preview: notes.slice(0, 100) }, fullText);
      },
      onError: (err) => {
        setLoading(false);
        toast({ title: "Error", description: err, variant: "destructive" });
      },
    });
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-success/10 rounded-lg p-2">
            <FileText className="h-5 w-5 text-success" />
          </div>
          <h1 className="text-xl font-display font-bold">Mini Note Organizer</h1>
        </div>
        <p className="text-sm text-muted-foreground">Paste your messy notes and get an organized summary.</p>
      </div>

      <Textarea
        placeholder="Paste your notes here..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={loading}
        className="min-h-[160px]"
      />

      <Button onClick={handleOrganize} disabled={loading || !notes.trim()} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Organize Notes
      </Button>

      {loading && !output && <AIThinking message="Organizing your notes" />}

      {output && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Organized Notes</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => navigate(`/pdf-export?source=note-organizer&title=${encodeURIComponent("Organized Notes")}&content=${encodeURIComponent(output)}`)}
                >
                  <FileDown className="h-4 w-4" /> PDF
                </Button>
                <OutputActions text={output} title="Organized Notes" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <MarkdownWithMath className="prose prose-sm max-w-none text-foreground dark:prose-invert break-words overflow-hidden">
              {output}
            </MarkdownWithMath>
            {!loading && (
              <>
                <TimeSavedIndicator wordCount={output.split(/\s+/).length} type="summary" />
                <ShareResultButton text={output} title="Organized Notes" />
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NoteOrganizer;
