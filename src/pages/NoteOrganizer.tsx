import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { saveOutput } from "@/lib/saved-outputs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import OutputActions from "@/components/OutputActions";
import { streamAI } from "@/lib/streaming";
import { FileText, Loader2, FileDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const NoteOrganizer = () => {
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

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

      {loading && !output && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      )}

      {output && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Organized Notes</CardTitle>
              <OutputActions text={output} title="Organized Notes" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
              {output}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NoteOrganizer;
