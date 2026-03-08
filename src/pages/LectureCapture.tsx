import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIThinking from "@/components/AIThinking";
import OutputActions from "@/components/OutputActions";
import { streamAI } from "@/lib/streaming";
import { saveOutput } from "@/lib/saved-outputs";
import { generatePdf } from "@/lib/pdf-generator";
import {
  GraduationCap, Loader2, FileDown, Upload, FileUp,
  BookOpen, Layers, HelpCircle, ListChecks, CheckCircle2,
} from "lucide-react";
import ReviewTimer from "@/components/lecture/ReviewTimer";
import { toast } from "@/hooks/use-toast";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type SectionKey = "summary" | "flashcards" | "quiz" | "revision";

const sectionMeta: Record<SectionKey, { icon: typeof BookOpen; label: string; thinkMsg: string }> = {
  summary: { icon: BookOpen, label: "Summary", thinkMsg: "Summarizing lecture…" },
  flashcards: { icon: Layers, label: "Flashcards", thinkMsg: "Creating flashcards…" },
  quiz: { icon: HelpCircle, label: "Quiz", thinkMsg: "Generating quiz…" },
  revision: { icon: ListChecks, label: "Revision Plan", thinkMsg: "Building revision plan…" },
};

const LectureCapture = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [title, setTitle] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState<SectionKey>("summary");
  const [generated, setGenerated] = useState(false);
  const [progressStage, setProgressStage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = async (pdfFile: File): Promise<string> => {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const parts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      parts.push(content.items.map((item: any) => item.str).join(" "));
    }
    return parts.join("\n\n");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF.", variant: "destructive" });
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      toast({ title: "Too large", description: "Max 20MB.", variant: "destructive" });
      return;
    }

    setFile(selected);
    setOutput("");
    setGenerated(false);
    setExtracting(true);
    setTitle(selected.name.replace(/\.pdf$/i, ""));

    try {
      const text = await extractTextFromPdf(selected);
      if (!text.trim()) {
        toast({ title: "No text", description: "PDF appears empty or image-only.", variant: "destructive" });
        setFile(null);
        return;
      }
      setExtractedText(text);
      toast({ title: "PDF loaded!", description: `${selected.name} ready to process.` });
    } catch {
      toast({ title: "Error", description: "Failed to read PDF.", variant: "destructive" });
      setFile(null);
    } finally {
      setExtracting(false);
    }
  };

  const handleProcess = async () => {
    if (!extractedText.trim()) return;
    setLoading(true);
    setOutput("");
    setGenerated(false);
    setProgressStage("Analyzing lecture content…");

    const stages = ["Summarizing notes…", "Creating flashcards…", "Generating quiz…", "Building revision plan…"];
    let stageIndex = 0;
    const stageInterval = setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, stages.length - 1);
      setProgressStage(stages[stageIndex]);
    }, 4000);

    let fullText = "";
    await streamAI({
      functionName: "lecture-capture",
      body: { text: extractedText, title: title || "Untitled" },
      onDelta: (text) => {
        fullText += text;
        setOutput(fullText);
      },
      onDone: () => {
        clearInterval(stageInterval);
        setLoading(false);
        setGenerated(true);
        setProgressStage("");
        saveOutput("lecture-capture", { fileName: file?.name, title }, fullText);
        toast({ title: "Lecture processed! ✅", description: "Summary, flashcards, quiz, and revision plan ready." });
      },
      onError: (err) => {
        clearInterval(stageInterval);
        setLoading(false);
        setProgressStage("");
        toast({ title: "Error", description: err, variant: "destructive" });
      },
    });
  };

  const getSection = (key: SectionKey): string => {
    if (!output) return "";
    const headers: Record<SectionKey, string> = {
      summary: "## Summary",
      flashcards: "## Flashcards",
      quiz: "## Practice Quiz",
      revision: "## Quick Revision Plan",
    };
    const order: SectionKey[] = ["summary", "flashcards", "quiz", "revision"];
    const idx = order.indexOf(key);
    const start = output.indexOf(headers[key]);
    if (start === -1) return key === "summary" ? output : "";

    const nextHeaders = order.slice(idx + 1).map(k => headers[k]);
    let end = output.length;
    for (const nh of nextHeaders) {
      const pos = output.indexOf(nh);
      if (pos > start) { end = pos; break; }
    }
    return output.slice(start, end).trim();
  };

  const handleDownloadPdf = () => {
    generatePdf({ title: title || "Lecture Notes", content: output, source: "custom" });
    toast({ title: "PDF downloaded!" });
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-success/10 rounded-lg p-2">
            <GraduationCap className="h-5 w-5 text-success" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">Lecture Capture</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload lecture slides or notes — get a summary, flashcards, quiz, and revision plan.
        </p>
      </div>

      {/* Upload */}
      <Card
        className="border-dashed border-2 cursor-pointer hover:border-success/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          {extracting ? (
            <>
              <Loader2 className="h-10 w-10 text-success animate-spin" />
              <p className="text-sm text-muted-foreground">Extracting text…</p>
            </>
          ) : file ? (
            <>
              <FileUp className="h-10 w-10 text-success" />
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · Tap to change</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Upload lecture PDF</p>
              <p className="text-xs text-muted-foreground">Slides, notes, or handouts · Max 20MB</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Title + Process */}
      {file && extractedText && !generated && (
        <Card className="animate-fade-in">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Title (optional)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lecture title…" />
            </div>
            <Button onClick={handleProcess} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
              {loading ? "Processing…" : "Process Lecture"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AI Thinking */}
      {loading && !output && <AIThinking message={progressStage || "Analyzing lecture"} />}

      {/* Progress stages while streaming */}
      {loading && output && progressStage && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-fade-in">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-success" />
          {progressStage}
        </div>
      )}

      {/* Output tabs */}
      {output && (
        <div className="space-y-3 animate-fade-in">
          {/* Actions bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-foreground">Results</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadPdf}>
                <FileDown className="h-4 w-4" /> PDF
              </Button>
              <OutputActions text={output} title={title || "Lecture Notes"} />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SectionKey)}>
            <TabsList className="grid grid-cols-4 w-full">
              {(Object.keys(sectionMeta) as SectionKey[]).map((key) => {
                const { icon: Icon, label } = sectionMeta[key];
                return (
                  <TabsTrigger key={key} value={key} className="gap-1 text-xs">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {(Object.keys(sectionMeta) as SectionKey[]).map((key) => (
              <TabsContent key={key} value={key}>
                <Card>
                  <CardContent className="p-4">
                    <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                      {getSection(key) || (loading ? "Generating…" : "This section will appear when processing completes.")}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default LectureCapture;
