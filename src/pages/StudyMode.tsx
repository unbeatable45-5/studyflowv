import { useState, useRef } from "react";
import { BookOpen, Upload, Sparkles, FileDown, Save, ChevronDown, ChevronUp } from "lucide-react";
import AIThinking from "@/components/AIThinking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { streamAI } from "@/lib/streaming";
import { saveOutput } from "@/lib/saved-outputs";
import { generatePdf } from "@/lib/pdf-generator";
import ReactMarkdown from "react-markdown";
import * as pdfjs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const sectionHeaders = ["Topic Summary", "Flashcards", "Practice Quiz", "Quick Revision Plan"] as const;
type SectionKey = typeof sectionHeaders[number];

function parseSections(text: string): Record<SectionKey, string> {
  const result: Record<SectionKey, string> = {
    "Topic Summary": "",
    "Flashcards": "",
    "Practice Quiz": "",
    "Quick Revision Plan": "",
  };

  for (let i = 0; i < sectionHeaders.length; i++) {
    const header = sectionHeaders[i];
    const pattern = new RegExp(`## ${header}`, "i");
    const startMatch = text.search(pattern);
    if (startMatch === -1) continue;

    const contentStart = text.indexOf("\n", startMatch);
    if (contentStart === -1) continue;

    let endPos = text.length;
    for (let j = i + 1; j < sectionHeaders.length; j++) {
      const nextPattern = new RegExp(`## ${sectionHeaders[j]}`, "i");
      const nextMatch = text.search(nextPattern);
      if (nextMatch !== -1 && nextMatch > startMatch) {
        endPos = nextMatch;
        break;
      }
    }

    result[header] = text.slice(contentStart, endPos).trim();
  }

  return result;
}

const StudyMode = () => {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [inputMode, setInputMode] = useState<"topic" | "notes" | "pdf">("topic");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [expandedInput, setExpandedInput] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFileName(file.name);

    try {
      const buf = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buf }).promise;
      let text = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n\n";
      }
      setNotes(text.trim());
      setInputMode("pdf");
    } catch {
      toast({ title: "Error", description: "Could not read PDF", variant: "destructive" });
    }
  };

  const generate = async () => {
    const input = inputMode === "topic" ? topic : notes;
    if (!input.trim()) {
      toast({ title: "Missing input", description: "Enter a topic or paste notes first.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setOutput("");
    setSaved(false);
    setExpandedInput(false);

    const body = inputMode === "topic" ? { topic: input } : { notes: input };

    await streamAI({
      functionName: "study-mode",
      body,
      onDelta: (text) => setOutput((prev) => prev + text),
      onDone: () => setLoading(false),
      onError: (err) => {
        setLoading(false);
        toast({ title: "Error", description: err, variant: "destructive" });
      },
    });
  };

  const handleSave = async () => {
    if (!output) return;
    const label = inputMode === "topic" ? topic : pdfFileName || "Notes";
    await saveOutput("study-mode", { topic: label, inputMode }, output);
    setSaved(true);
    toast({ title: "Saved!", description: "Session saved to Study Organizer." });
  };

  const handleDownload = () => {
    if (!output) return;
    const label = inputMode === "topic" ? topic : pdfFileName || "Study Session";
    generatePdf({ title: label, content: output, source: "custom" });
  };

  const sections = parseSections(output);
  const hasOutput = output.length > 0;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4 pb-24">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">Study Mode</h1>
        </div>
        <p className="text-sm text-muted-foreground">Generate a complete study session instantly.</p>
      </div>

      {/* Collapsible Input */}
      <Card>
        <CardHeader
          className="p-4 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => setExpandedInput(!expandedInput)}
        >
          <CardTitle className="text-base">
            {hasOutput && !expandedInput
              ? `📝 ${inputMode === "topic" ? topic : pdfFileName || "Notes"}`
              : "What do you want to study?"}
          </CardTitle>
          {hasOutput && (expandedInput ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />)}
        </CardHeader>
        {expandedInput && (
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            <div className="flex gap-2">
              {(["topic", "notes", "pdf"] as const).map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={inputMode === mode ? "default" : "outline"}
                  onClick={() => setInputMode(mode)}
                  className="text-xs capitalize"
                >
                  {mode === "pdf" ? "Upload PDF" : mode}
                </Button>
              ))}
            </div>

            {inputMode === "topic" && (
              <Input
                placeholder="e.g. Photosynthesis, World War II, Linear Algebra..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            )}

            {inputMode === "notes" && (
              <Textarea
                placeholder="Paste your notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px]"
              />
            )}

            {inputMode === "pdf" && (
              <div className="space-y-2">
                <input ref={fileRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  {pdfFileName || "Choose PDF file"}
                </Button>
                {notes && inputMode === "pdf" && (
                  <p className="text-xs text-muted-foreground">✅ Extracted {notes.split(/\s+/).length} words</p>
                )}
              </div>
            )}

            <Button onClick={generate} disabled={loading} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              {loading ? "Generating..." : "Generate Study Session"}
            </Button>
            {loading && !hasOutput && (
              <AIThinking message="Generating study session" />
            )}
          </CardContent>
        )}
      </Card>

      {/* Output */}
      {hasOutput && (
        <>
          <Tabs defaultValue="Topic Summary" className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-auto">
              {sectionHeaders.map((h) => (
                <TabsTrigger key={h} value={h} className="text-[11px] px-1 py-2 leading-tight">
                  {h === "Topic Summary" ? "Summary" : h === "Quick Revision Plan" ? "Plan" : h === "Practice Quiz" ? "Quiz" : h}
                </TabsTrigger>
              ))}
            </TabsList>
            {sectionHeaders.map((h) => (
              <TabsContent key={h} value={h}>
                <Card>
                  <CardContent className="p-4 prose prose-sm max-w-none dark:prose-invert">
                    {sections[h] ? (
                      <ReactMarkdown>{sections[h]}</ReactMarkdown>
                    ) : loading ? (
                      <p className="text-muted-foreground text-sm animate-pulse">Generating {h.toLowerCase()}...</p>
                    ) : (
                      <p className="text-muted-foreground text-sm">No content yet.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Actions */}
          {!loading && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleSave} disabled={saved}>
                <Save className="h-4 w-4 mr-2" />
                {saved ? "Saved ✓" : "Save Session"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleDownload}>
                <FileDown className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudyMode;
