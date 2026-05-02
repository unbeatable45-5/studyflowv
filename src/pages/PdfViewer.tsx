import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import {
  Upload, Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  FileUp, Sparkles, MessageSquareQuote, BookOpen, ListChecks, X, Send, Layers, Youtube, ExternalLink,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import MarkdownWithMath from "@/components/MarkdownWithMath";
import AIThinking from "@/components/AIThinking";
import { streamAI } from "@/lib/streaming";
import { usePremium } from "@/contexts/PremiumContext";
import { useUsageLimitCheck } from "@/components/UsageLimitToast";
import { saveOutput } from "@/lib/saved-outputs";
import { supabase } from "@/integrations/supabase/client";
import { makeAiCacheKey, getCachedAi, setCachedAi } from "@/lib/ai-action-cache";
import { Crown } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type SmartAction = "summarize_page" | "generate_questions" | "explain" | "ask" | "make_flashcards";
type VideoAction = "summarize_video" | "key_notes" | "video_questions";

const ACTION_LABELS: Record<SmartAction, string> = {
  summarize_page: "Summarize Page",
  generate_questions: "Generate Questions",
  explain: "Explain This",
  ask: "Ask AI",
  make_flashcards: "Turn Into Flashcards",
};

const VIDEO_ACTION_LABELS: Record<VideoAction, string> = {
  summarize_video: "Summarize Video",
  key_notes: "Extract Key Notes",
  video_questions: "Generate Questions",
};

interface YTVideo {
  videoId: string;
  title: string;
  description: string;
  channel: string;
  thumbnail: string;
  url: string;
}

function buildVideoQueries(text: string): { label: string; query: string; tag: string }[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  // Take first ~80 chars as topic seed
  const seed = cleaned.slice(0, 100);
  // Pick top capitalised/keyword-y words for label
  const words = cleaned.split(/[^A-Za-z]+/).filter((w) => w.length > 4);
  const top = Array.from(new Set(words)).slice(0, 4).join(" ") || seed.slice(0, 40);
  return [
    { label: `${top} — explained`, query: `${top} explained tutorial`, tag: "Explains this concept" },
    { label: `${top} — exam walkthrough`, query: `${top} exam questions walkthrough`, tag: "Exam-focused walkthrough" },
    { label: `${top} — crash course`, query: `${top} crash course`, tag: "Quick overview" },
    { label: `${top} — examples`, query: `${top} worked examples`, tag: "Worked examples" },
    { label: `${top} — review`, query: `${top} revision summary`, tag: "Revision summary" },
  ];
}

const PdfViewer = () => {
  const { isPremium } = usePremium();
  const { checkAndPrompt } = useUsageLimitCheck();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [pageTexts, setPageTexts] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);

  const [selectedText, setSelectedText] = useState("");
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiAction, setAiAction] = useState<SmartAction | null>(null);
  const [aiOutput, setAiOutput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [askInput, setAskInput] = useState("");
  const [askContext, setAskContext] = useState("");
  const [videosOpen, setVideosOpen] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF.", variant: "destructive" });
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 20MB.", variant: "destructive" });
      return;
    }
    setFile(selected);
    setExtracting(true);
    setPageTexts([]);
    setCurrentPage(1);
    try {
      const buf = await selected.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buf }).promise;
      setPdf(doc);
      setNumPages(doc.numPages);

      // Extract text per page in background for AI actions
      const texts: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const c = await page.getTextContent();
        texts.push(c.items.map((it: any) => it.str).join(" "));
      }
      setPageTexts(texts);
      const totalChars = texts.reduce((sum, t) => sum + t.length, 0);
      const isImageBased = totalChars < doc.numPages * 40;
      if (isImageBased) {
        toast({
          title: "Image-based PDF detected",
          description: "Text extraction is limited. Use Smart Slide Mode (Pro) on the Slides → Exam page for OCR.",
        });
      } else {
        toast({ title: "PDF loaded", description: `${doc.numPages} pages ready` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to read PDF.", variant: "destructive" });
      setFile(null);
      setPdf(null);
    } finally {
      setExtracting(false);
    }
  };

  // Render pages whenever pdf or scale changes
  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    (async () => {
      for (let i = 1; i <= pdf.numPages; i++) {
        if (cancelled) return;
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const container = pageRefs.current.get(i);
        if (!container) continue;
        const canvas = container.querySelector("canvas") as HTMLCanvasElement | null;
        if (!canvas) continue;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
    })();
    return () => { cancelled = true; };
  }, [pdf, scale]);

  // Track current page on scroll
  useEffect(() => {
    if (!containerRef.current || !numPages) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const num = Number((visible[0].target as HTMLElement).dataset.pageNum);
          if (num) setCurrentPage(num);
        }
      },
      { root: containerRef.current, threshold: [0.3, 0.6] }
    );
    pageRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [numPages, pdf]);

  // Selection popover
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? "";
      if (!text || text.length < 5) {
        setSelectedText("");
        setPopoverPos(null);
        return;
      }
      const range = sel!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      // Only if selection inside our container
      if (!containerRef.current?.contains(range.commonAncestorContainer)) {
        setSelectedText("");
        setPopoverPos(null);
        return;
      }
      setSelectedText(text);
      setPopoverPos({ x: rect.left + rect.width / 2, y: rect.top });
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const scrollToPage = (n: number) => {
    const el = pageRefs.current.get(n);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const runAction = useCallback(
    (action: SmartAction, content: string, question?: string) => {
      if (!content.trim()) {
        toast({ title: "No content", description: "Could not read this section.", variant: "destructive" });
        return;
      }
      if (!checkAndPrompt("pdfs", "AI study actions")) return;

      setAiAction(action);
      setAiOpen(true);
      setAiOutput("");
      setAiLoading(true);

      let full = "";
      streamAI({
        functionName: "pdf-smart-action",
        body: { action, content, question },
        onDelta: (t) => { full += t; setAiOutput(full); },
        onDone: () => {
          setAiLoading(false);
          saveOutput("pdf-summarizer", { tool: "smart-viewer", action, fileName: file?.name }, full);
        },
        onError: (err) => {
          setAiLoading(false);
          toast({ title: "Error", description: err, variant: "destructive" });
        },
      });
    },
    [checkAndPrompt, file?.name]
  );

  const handleSummarizePage = () => {
    const text = pageTexts[currentPage - 1] ?? "";
    runAction("summarize_page", text);
  };

  const handleSelectionAction = (action: SmartAction) => {
    if (!selectedText) return;
    if (action === "ask") {
      setAskContext(selectedText);
      setAskInput("");
      setAiAction("ask");
      setAiOpen(true);
      setAiOutput("");
      setSelectedText("");
      setPopoverPos(null);
      window.getSelection()?.removeAllRanges();
      return;
    }
    runAction(action, selectedText);
    setSelectedText("");
    setPopoverPos(null);
    window.getSelection()?.removeAllRanges();
  };

  const submitAsk = () => {
    if (!askInput.trim()) return;
    const ctx = askContext.trim() || pageTexts[currentPage - 1] || "";
    runAction("ask", ctx, askInput.trim());
  };

  // No PDF: upload screen
  if (!file || !pdf) {
    return (
      <div className="px-3 sm:px-4 py-4 sm:py-6 max-w-lg mx-auto space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-lg p-2">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-base sm:text-xl font-display font-bold">Smart Study Viewer</h1>
          </div>
          <p className="text-[11px] sm:text-sm text-muted-foreground">
            Open PDFs inside StudyFlow. Highlight text, ask AI, generate questions on demand.
          </p>
        </div>

        <Card
          className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors active:scale-[0.98]"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
            {extracting ? (
              <>
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground">Loading PDF…</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">Tap to open a PDF</p>
                <p className="text-[10px] text-muted-foreground">Max 20MB • AI runs only on your action</p>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2 pt-2">
          {[
            { icon: Sparkles, label: "Summarize Page" },
            { icon: ListChecks, label: "Generate Questions" },
            { icon: BookOpen, label: "Explain Section" },
            { icon: MessageSquareQuote, label: "Ask AI on selection" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-lg border border-border/60 bg-muted/30 p-3 flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-[11px] font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)] relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-1 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setFile(null); setPdf(null); }}>
            <X className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium truncate max-w-[120px] sm:max-w-[240px]">{file.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => scrollToPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs tabular-nums px-1">{currentPage}/{numPages}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))} disabled={currentPage >= numPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(2)))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-[10px] tabular-nums w-9 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale((s) => Math.min(2.5, +(s + 0.2).toFixed(2)))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Pages */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-muted/30 px-2 py-3">
        <div className="flex flex-col items-center gap-3">
          {Array.from({ length: numPages }).map((_, i) => {
            const n = i + 1;
            return (
              <div
                key={n}
                ref={(el) => { if (el) pageRefs.current.set(n, el); else pageRefs.current.delete(n); }}
                data-page-num={n}
                className="bg-background shadow-sm rounded-md overflow-hidden border border-border/50 max-w-full"
              >
                <canvas className="block max-w-full" />
                {/* Selectable text strip — highlight to ask AI */}
                {pageTexts[i] && (
                  <div className="px-3 py-2 border-t border-dashed border-border/60 bg-muted/40">
                    <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-1">
                      Page {n} text · highlight to ask AI
                    </p>
                    <p className="text-[11px] leading-relaxed select-text text-foreground/80 max-w-[800px] whitespace-pre-wrap">
                      {pageTexts[i]}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating action buttons */}
      <div className="absolute right-3 bottom-20 sm:bottom-6 z-30 flex flex-col gap-2 items-end">
        <Button
          size="sm"
          className="rounded-full shadow-lg gap-1.5 h-10 px-4"
          onClick={handleSummarizePage}
        >
          <Sparkles className="h-4 w-4" /> Summarize page
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full shadow-lg gap-1.5 h-9 px-3 bg-background"
          onClick={() => runAction("generate_questions", pageTexts[currentPage - 1] ?? "")}
        >
          <ListChecks className="h-3.5 w-3.5" /> Questions
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full shadow-lg gap-1.5 h-9 px-3 bg-background"
          onClick={() => runAction("make_flashcards", pageTexts[currentPage - 1] ?? "")}
        >
          <Layers className="h-3.5 w-3.5" /> Flashcards
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full shadow-lg gap-1.5 h-9 px-3 bg-background"
          onClick={() => setVideosOpen(true)}
        >
          <Youtube className="h-3.5 w-3.5 text-destructive" /> Videos
        </Button>
      </div>

      {/* Selection popover */}
      {selectedText && popoverPos && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-1 flex items-center gap-1 -translate-x-1/2 -translate-y-[110%]"
          style={{ left: popoverPos.x, top: popoverPos.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Button size="sm" variant="ghost" className="h-8 px-2 gap-1 text-xs" onClick={() => handleSelectionAction("ask")}>
            <MessageSquareQuote className="h-3.5 w-3.5" /> Ask
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 gap-1 text-xs" onClick={() => handleSelectionAction("explain")}>
            <BookOpen className="h-3.5 w-3.5" /> Explain
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 gap-1 text-xs" onClick={() => handleSelectionAction("summarize_page")}>
            <Sparkles className="h-3.5 w-3.5" /> Summary
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 gap-1 text-xs" onClick={() => handleSelectionAction("make_flashcards")}>
            <Layers className="h-3.5 w-3.5" /> Cards
          </Button>
        </div>
      )}

      {/* Related Videos drawer */}
      <Sheet open={videosOpen} onOpenChange={setVideosOpen}>
        <SheetContent side="bottom" className="h-[70dvh] flex flex-col p-0">
          <SheetHeader className="px-4 py-3 border-b border-border">
            <SheetTitle className="text-base flex items-center gap-2">
              <Youtube className="h-4 w-4 text-destructive" /> Related Videos
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 px-4 py-3">
            <p className="text-[11px] text-muted-foreground mb-3">
              Curated YouTube searches based on this page. Tap to watch.
            </p>
            <div className="space-y-2">
              {buildVideoQueries(pageTexts[currentPage - 1] ?? "").map((q) => (
                <a
                  key={q.label}
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q.query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="h-12 w-16 rounded bg-destructive/10 flex items-center justify-center shrink-0">
                    <Youtube className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{q.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{q.tag}</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </a>
              ))}
              {!pageTexts[currentPage - 1] && (
                <p className="text-xs text-muted-foreground">No text detected on this page.</p>
              )}
            </div>
            {!isPremium && (
              <div className="mt-4 rounded-lg border border-dashed border-border p-3">
                <p className="text-xs font-semibold mb-1">⭐ Pro: Summarize Video & Extract Notes</p>
                <p className="text-[11px] text-muted-foreground">Upgrade to summarize videos, extract key notes, and generate questions from them.</p>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* AI result drawer */}
      <Sheet open={aiOpen} onOpenChange={setAiOpen}>
        <SheetContent side="bottom" className="h-[80dvh] flex flex-col p-0">
          <SheetHeader className="px-4 py-3 border-b border-border">
            <SheetTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {aiAction ? ACTION_LABELS[aiAction] : "AI"}
              {!isPremium && <span className="ml-auto text-[10px] font-normal text-muted-foreground">Free tier</span>}
            </SheetTitle>
          </SheetHeader>

          {aiAction === "ask" && !aiOutput && !aiLoading && (
            <div className="px-4 py-3 border-b border-border space-y-2">
              {askContext && (
                <div className="rounded-md bg-muted p-2 text-[11px] text-muted-foreground line-clamp-3">
                  "{askContext}"
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  value={askInput}
                  onChange={(e) => setAskInput(e.target.value)}
                  placeholder="Ask anything about this section…"
                  onKeyDown={(e) => { if (e.key === "Enter") submitAsk(); }}
                  className="text-sm h-9"
                />
                <Button size="sm" className="h-9 gap-1" onClick={submitAsk} disabled={!askInput.trim()}>
                  <Send className="h-3.5 w-3.5" /> Ask
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 px-4 py-3">
            {aiLoading && !aiOutput ? (
              <AIThinking message="Thinking…" />
            ) : aiOutput ? (
              <MarkdownWithMath className="prose prose-sm max-w-none dark:prose-invert prose-p:text-sm prose-headings:text-base">
                {aiOutput}
              </MarkdownWithMath>
            ) : aiAction === "ask" ? (
              <p className="text-xs text-muted-foreground">Type a question above to ask the AI about the selected text or current page.</p>
            ) : null}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PdfViewer;
