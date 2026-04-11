import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import AIThinking from "@/components/AIThinking";
import OutputActions from "@/components/OutputActions";
import ShareResultButton from "@/components/ShareResultButton";
import TimeSavedIndicator from "@/components/TimeSavedIndicator";
import MarkdownWithMath from "@/components/MarkdownWithMath";
import { streamAI } from "@/lib/streaming";
import { getCachedSummary, setCachedSummary } from "@/lib/pdf-cache";
import { saveOutput } from "@/lib/saved-outputs";
import { usePremium } from "@/contexts/PremiumContext";
import { useUsageLimitCheck } from "@/components/UsageLimitToast";
import { generatePdf } from "@/lib/pdf-generator";
import { FileUp, Loader2, FileDown, Upload, ImageIcon, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PdfStudyActions from "@/components/pdf/PdfStudyActions";
import SlidePreviewCarousel from "@/components/pdf/SlidePreviewCarousel";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const summaryOptions = [
  { value: "short", label: "Short", desc: "5-8 bullets" },
  { value: "medium", label: "Medium", desc: "10-15 bullets" },
  { value: "detailed", label: "Detailed", desc: "15-25 bullets" },
];

/** Render a single PDF page to a base64 JPEG data URL */
async function renderPageToImage(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const scale = 1.5; // balance quality vs size
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.7);
}

const PdfSummarizer = () => {
  const { isPremium, promptUpgrade } = usePremium();
  const { checkAndPrompt } = useUsageLimitCheck();
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [summaryLength, setSummaryLength] = useState("medium");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [title, setTitle] = useState("");
  const [isImagePdf, setIsImagePdf] = useState(false);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("Generating summary");
  const [extractProgress, setExtractProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = useCallback(async (pdfFile: File) => {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    const textParts: string[] = [];
    let totalChars = 0;

    setExtractProgress(`Reading ${totalPages} pages…`);

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      textParts.push(pageText);
      totalChars += pageText.replace(/\s/g, "").length;
    }

    const avgCharsPerPage = totalChars / totalPages;
    const isImage = avgCharsPerPage < 50;

    // For image-based PDFs, render pages to images for vision AI
    let images: string[] = [];
    if (isImage) {
      setExtractProgress("Rendering slides for Smart Slide Mode…");
      const maxPages = Math.min(totalPages, 20);
      for (let i = 1; i <= maxPages; i++) {
        setExtractProgress(`Rendering slide ${i}/${maxPages}…`);
        const dataUrl = await renderPageToImage(pdf, i);
        images.push(dataUrl);
      }
    }

    return { text: textParts.join("\n\n"), isImage, images };
  }, []);

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
    setIsImagePdf(false);
    setPageImages([]);
    setTitle(selected.name.replace(/\.pdf$/i, ""));
    try {
      const { text, isImage, images } = await extractTextFromPdf(selected);
      setIsImagePdf(isImage);

      if (isImage) {
        if (!isPremium) {
          toast({
            title: "Image-based PDF detected",
            description: "This PDF contains images/slides. Upgrade to Pro for Smart Slide Mode.",
            variant: "destructive",
          });
          setFile(null);
          setExtracting(false);
          promptUpgrade();
          return;
        }
        setPageImages(images);
        toast({
          title: "📸 Smart Slide Mode",
          description: `${images.length} slides rendered for AI vision analysis.`,
        });
      }

      if (!text.trim() && !isImage) {
        toast({ title: "No text found", description: "This PDF appears to be empty.", variant: "destructive" });
        setFile(null);
        setExtracting(false);
        return;
      }
      setExtractedText(text);
      toast({ title: "PDF loaded", description: `Extracted from ${selected.name}` });
    } catch {
      toast({ title: "Error", description: "Failed to read PDF. The file may be corrupted.", variant: "destructive" });
      setFile(null);
    } finally {
      setExtracting(false);
      setExtractProgress("");
    }
  };

  const handleSummarize = async () => {
    if (loading) return;
    if (!extractedText.trim() && pageImages.length === 0) return;
    if (!checkAndPrompt("pdfs", "PDF summaries")) return;

    setLoading(true);
    setOutput("");

    // Check cache first (skip for image PDFs since images aren't hashed)
    if (!isImagePdf && extractedText.trim()) {
      const cached = await getCachedSummary(extractedText, summaryLength, isImagePdf);
      if (cached) {
        setOutput(cached);
        setLoading(false);
        toast({ title: "⚡ Loaded from cache", description: "Showing previously generated summary." });
        saveOutput("pdf-summarizer", { fileName: file?.name, summaryLength, isImagePdf, cached: true }, cached);
        return;
      }
    }

    setLoadingMessage(isImagePdf ? "Analyzing slides with AI vision…" : "Generating summary");
    let fullText = "";

    const body: Record<string, unknown> = { summaryLength };
    if (extractedText.trim()) body.text = extractedText;
    if (isImagePdf && pageImages.length > 0) body.images = pageImages;

    await streamAI({
      functionName: "pdf-summarizer",
      body,
      onDelta: (text) => { fullText += text; setOutput(fullText); },
      onDone: async () => {
        setLoading(false);
        saveOutput("pdf-summarizer", { fileName: file?.name, summaryLength, isImagePdf }, fullText);
        if (!isImagePdf && extractedText.trim()) {
          await setCachedSummary(extractedText, summaryLength, isImagePdf, fullText);
        }
      },
      onError: (err) => { setLoading(false); toast({ title: "Error", description: err, variant: "destructive" }); },
    });
  };

  const handleDownloadPdf = () => {
    generatePdf({ title: title || "PDF Summary", content: output, source: "custom", isPremium });
    toast({ title: "PDF downloaded!" });
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const wordCount = output.split(/\s+/).length;

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6 max-w-lg mx-auto space-y-4 sm:space-y-5">
      <div className="space-y-0.5 sm:space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-1.5 sm:p-2 shrink-0">
            <FileUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h1 className="text-base sm:text-xl font-display font-bold text-foreground">PDF Summarizer</h1>
        </div>
        <p className="text-[11px] sm:text-sm text-muted-foreground">Upload a PDF and get an AI-powered summary.</p>
      </div>

      <Card className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors active:scale-[0.98]">
        <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8 gap-2 sm:gap-3" onClick={handleUploadClick}>
          <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} />
          {extracting ? (
            <>
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary animate-spin" />
              <p className="text-xs sm:text-sm text-muted-foreground">{extractProgress || "Extracting text…"}</p>
            </>
          ) : file ? (
            <>
              {isImagePdf ? (
                <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 text-warning" />
              ) : (
                <FileUp className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              )}
              <p className="text-xs sm:text-sm font-medium text-foreground text-center px-4 break-all line-clamp-2">{file.name}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · Tap to change</p>
              {isImagePdf && (
                <span className="text-[10px] font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                  📸 Smart Slide Mode · {pageImages.length} slides
                </span>
              )}
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
              <p className="text-xs sm:text-sm font-medium text-foreground">Tap to upload a PDF</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Max 20MB · Text or image-based</p>
            </>
          )}
        </CardContent>
      </Card>

      {file && (extractedText || pageImages.length > 0) && (
        <Card className="animate-fade-in">
          <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">Title (optional)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summary title…" className="text-sm h-9 sm:h-10" />
            </div>

            {isImagePdf && (
              <div className="bg-warning/5 border border-warning/20 rounded-lg p-2.5 flex items-start gap-2">
                <ImageIcon className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-foreground">Smart Slide Mode Active</p>
                  <p className="text-[10px] text-muted-foreground">
                    {pageImages.length} slides will be analyzed using AI vision for accurate extraction of text, diagrams, and charts.
                  </p>
                </div>
              </div>
            )}

            {isImagePdf && pageImages.length > 0 && (
              <SlidePreviewCarousel images={pageImages} />
            )}

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">Summary Length</Label>
              <RadioGroup value={summaryLength} onValueChange={setSummaryLength} className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {summaryOptions.map((opt) => (
                  <label key={opt.value} className={`flex flex-col items-center gap-0.5 sm:gap-1 rounded-lg border p-2 sm:p-3 cursor-pointer transition-colors ${summaryLength === opt.value ? "border-primary bg-accent" : "border-border hover:border-primary/30"}`}>
                    <RadioGroupItem value={opt.value} className="sr-only" />
                    <span className="text-xs sm:text-sm font-medium text-foreground">{opt.label}</span>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground text-center leading-tight">{opt.desc}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <Button onClick={handleSummarize} disabled={loading} className="w-full h-10 sm:h-11 text-sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "Summarizing…" : isImagePdf ? "Analyze Slides" : "Summarize PDF"}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && !output && <AIThinking message={loadingMessage} />}

      {output && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base sm:text-lg truncate">
                {isImagePdf ? "📸 Slide Analysis" : "Summary"}
              </CardTitle>
              <div className="flex items-center gap-1 shrink-0 flex-wrap">
                <Button variant="outline" size="sm" className="gap-1 h-8 px-2 sm:px-3 text-xs" onClick={handleDownloadPdf}>
                  <FileDown className="h-3.5 w-3.5" /> PDF
                </Button>
                <OutputActions text={output} title={title || "PDF Summary"} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 space-y-3">
            <MarkdownWithMath className="prose prose-sm max-w-none text-foreground dark:prose-invert prose-p:text-xs sm:prose-p:text-sm prose-headings:text-sm sm:prose-headings:text-base break-words overflow-hidden">
              {output}
            </MarkdownWithMath>
            {!loading && (
              <>
                <TimeSavedIndicator wordCount={wordCount} type="summary" />
                <PdfStudyActions
                  extractedText={extractedText}
                  summaryOutput={output}
                  fileName={file?.name}
                  isImagePdf={isImagePdf}
                />
                <ShareResultButton text={output} title={title || "PDF Summary"} />
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PdfSummarizer;
