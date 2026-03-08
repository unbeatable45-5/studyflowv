import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import AIThinking from "@/components/AIThinking";
import OutputActions from "@/components/OutputActions";
import { streamAI } from "@/lib/streaming";
import { saveOutput } from "@/lib/saved-outputs";
import { generatePdf } from "@/lib/pdf-generator";
import { FileUp, Loader2, FileDown, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const summaryOptions = [
  { value: "short", label: "Short", desc: "5-8 key bullet points" },
  { value: "medium", label: "Medium", desc: "10-15 detailed bullets" },
  { value: "detailed", label: "Detailed", desc: "Comprehensive 15-25 bullets" },
];

const PdfSummarizer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [summaryLength, setSummaryLength] = useState("medium");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [title, setTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = async (pdfFile: File): Promise<string> => {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    const textParts: string[] = [];

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(" ");
      textParts.push(pageText);
    }

    return textParts.join("\n\n");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }

    if (selected.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 20MB.", variant: "destructive" });
      return;
    }

    setFile(selected);
    setOutput("");
    setExtracting(true);
    setTitle(selected.name.replace(/\.pdf$/i, ""));

    try {
      const text = await extractTextFromPdf(selected);
      if (!text.trim()) {
        toast({ title: "No text found", description: "This PDF appears to contain only images or is empty.", variant: "destructive" });
        setFile(null);
        setExtracting(false);
        return;
      }
      setExtractedText(text);
      toast({ title: "PDF loaded", description: `Extracted text from ${selected.name}` });
    } catch {
      toast({ title: "Error", description: "Failed to read PDF. The file may be corrupted.", variant: "destructive" });
      setFile(null);
    } finally {
      setExtracting(false);
    }
  };

  const handleSummarize = async () => {
    if (!extractedText.trim()) return;
    setLoading(true);
    setOutput("");

    let fullText = "";
    await streamAI({
      functionName: "pdf-summarizer",
      body: { text: extractedText, summaryLength },
      onDelta: (text) => {
        fullText += text;
        setOutput(fullText);
      },
      onDone: () => {
        setLoading(false);
        saveOutput("pdf-summarizer", { fileName: file?.name, summaryLength }, fullText);
      },
      onError: (err) => {
        setLoading(false);
        toast({ title: "Error", description: err, variant: "destructive" });
      },
    });
  };

  const handleDownloadPdf = () => {
    generatePdf({
      title: title || "PDF Summary",
      content: output,
      source: "custom",
    });
    toast({ title: "PDF downloaded!" });
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-2">
            <FileUp className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">PDF Summarizer</h1>
        </div>
        <p className="text-sm text-muted-foreground">Upload a PDF and get an AI-powered summary instantly.</p>
      </div>

      {/* Upload Area */}
      <Card
        className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors"
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
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Extracting text…</p>
            </>
          ) : file ? (
            <>
              <FileUp className="h-10 w-10 text-primary" />
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · Tap to change</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Tap to upload a PDF</p>
              <p className="text-xs text-muted-foreground">Max 20MB</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Options */}
      {file && extractedText && (
        <Card className="animate-fade-in">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Title (optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summary title…"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Summary Length</Label>
              <RadioGroup value={summaryLength} onValueChange={setSummaryLength} className="grid grid-cols-3 gap-2">
                {summaryOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 cursor-pointer transition-colors ${
                      summaryLength === opt.value
                        ? "border-primary bg-accent"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <RadioGroupItem value={opt.value} className="sr-only" />
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">{opt.desc}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <Button
              onClick={handleSummarize}
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "Summarizing…" : "Summarize PDF"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {loading && !output && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {/* Output */}
      {output && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Summary</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleDownloadPdf}
                >
                  <FileDown className="h-4 w-4" /> PDF
                </Button>
                <OutputActions text={output} title={title || "PDF Summary"} />
              </div>
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

export default PdfSummarizer;
