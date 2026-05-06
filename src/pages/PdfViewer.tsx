import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import {
  Upload, Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Sparkles, MessageSquareQuote, BookOpen, ListChecks, X, Send, Layers,
  ChevronDown, ChevronUp, FileText,
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
import { saveLastPdf, loadLastPdf, clearLastPdf } from "@/lib/pdf-persist";
import { Crown } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type SmartAction = "summarize_page" | "generate_questions" | "explain" | "ask" | "make_flashcards";

const ACTION_LABELS: Record<SmartAction, string> = {
  summarize_page: "Summarize Page",
  generate_questions: "Generate Questions",
  explain: "Explain This",
  ask: "Ask AI",
  make_flashcards: "Turn Into Flashcards",
};

const PdfViewer = () => {
  const { isPremium } = usePremium();
  const { checkAndPrompt } = useUsageLimitCheck();
  const location = useLocation();
  const navigate = useNavigate();
  const reopenState = (location.state ?? null) as null | {
    fileName?: string;
    page?: number;
    action?: SmartAction;
    openVideos?: boolean;
  };
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
  const [aiFromCache, setAiFromCache] = useState(false);
  const [askInput, setAskInput] = useState("");
  const [askContext, setAskContext] = useState("");
  const [showExtractedFor, setShowExtractedFor] = useState<Set<number>>(new Set());
  const [toolbarPinned, setToolbarPinned] = useState(false);

  const loadPdfFile = useCallback(async (selected: File, opts?: { silent?: boolean; persist?: boolean }) => {
    setFile(selected);
    setExtracting(true);
    setPageTexts([]);
    setCurrentPage(1);
    try {
      const buf = await selected.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buf }).promise;
      setPdf(doc);
      setNumPages(doc.numPages);

      const texts: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const c = await page.getTextContent();
        texts.push(c.items.map((it: any) => it.str).join(" "));
      }
      setPageTexts(texts);
      const totalChars = texts.reduce((sum, t) => sum + t.length, 0);
      const isImageBased = totalChars < doc.numPages * 40;
      if (!opts?.silent) {
        if (isImageBased) {
          toast({
            title: "Image-based PDF detected",
            description: "Text extraction is limited. Use Smart Slide Mode (Pro) on the Slides → Exam page for OCR.",
          });
        } else {
          toast({ title: "PDF loaded", description: `${doc.numPages} pages ready` });
        }
      }
      if (opts?.persist !== false) {
        saveLastPdf(selected);
      }
      
    } catch {
      toast({ title: "Error", description: "Failed to read PDF.", variant: "destructive" });
      setFile(null);
      setPdf(null);
    } finally {
      setExtracting(false);
    }
  }, []);

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
    await loadPdfFile(selected);
  };

  // Restore last PDF from IndexedDB on mount (so users don't re-upload after refresh)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (file) return;
      const restored = await loadLastPdf();
      if (cancelled || !restored) return;
      await loadPdfFile(restored, { silent: true, persist: false });
      toast({ title: "Resumed last PDF", description: restored.name });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Auto-dismiss pinned toolbar on scroll (keeps view clean)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !toolbarPinned) return;
    let lastY = el.scrollTop;
    const onScroll = () => {
      if (Math.abs(el.scrollTop - lastY) > 40) {
        setToolbarPinned(false);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [toolbarPinned]);

  // Reopen handling: try cached PDF first; only prompt re-upload if name doesn't match.
  useEffect(() => {
    if (!reopenState?.fileName) return;
    let cancelled = false;
    (async () => {
      // If we already have the right file loaded, the page-jump effect will handle it.
      if (file && file.name === reopenState.fileName) return;
      // Try restoring from IndexedDB
      const cached = await loadLastPdf();
      if (cancelled) return;
      if (cached && cached.name === reopenState.fileName) {
        await loadPdfFile(cached, { silent: true, persist: false });
        toast({ title: "Reopened", description: `${cached.name} — jumping to page ${reopenState.page ?? 1}` });
        return;
      }
      // Fallback: prompt user to re-select the file
      if (!file) {
        toast({
          title: "Reopen study session",
          description: `Re-upload "${reopenState.fileName}" to jump back to page ${reopenState.page ?? 1}.`,
        });
        fileInputRef.current?.click();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reopenState]);

  // After PDF loads, if a target page was requested, scroll there and trigger action
  useEffect(() => {
    if (!pdf || !reopenState?.page) return;
    const target = Math.min(Math.max(1, reopenState.page), pdf.numPages);
    const t = setTimeout(() => {
      const el = pageRefs.current.get(target);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(target);
      // (video panel removed)
      // Clear navigation state so it doesn't re-fire
      navigate(location.pathname, { replace: true, state: null });
    }, 500);
    return () => clearTimeout(t);
  }, [pdf, reopenState, navigate, location.pathname]);


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

      const cacheKey = makeAiCacheKey({
        scope: `pdf::${file?.name ?? "doc"}`,
        action,
        content,
        question,
      });
      const cached = getCachedAi(cacheKey);
      if (cached) {
        setAiAction(action);
        setAiOpen(true);
        setAiOutput(cached);
        setAiLoading(false);
        setAiFromCache(true);
        return;
      }

      if (!checkAndPrompt("pdfs", "AI study actions")) return;

      setAiAction(action);
      setAiOpen(true);
      setAiOutput("");
      setAiLoading(true);
      setAiFromCache(false);

      let full = "";
      streamAI({
        functionName: "pdf-smart-action",
        body: { action, content, question },
        onDelta: (t) => { full += t; setAiOutput(full); },
        onDone: () => {
          setAiLoading(false);
          setCachedAi(cacheKey, full);
          saveOutput("pdf-summarizer", { tool: "smart-viewer", action, fileName: file?.name, page: currentPage }, full);
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

  // ----- Video features -----
  const buildPrimaryQuery = (text: string) => {
    const words = text.replace(/\s+/g, " ").split(/[^A-Za-z]+/).filter((w) => w.length > 4);
    return Array.from(new Set(words)).slice(0, 5).join(" ").trim() || text.slice(0, 80);
  };

  const loadVideos = useCallback(async () => {
    const text = pageTexts[currentPage - 1] ?? "";
    if (!text.trim()) {
      setYtVideos([]);
      setYtError("No text detected on this page.");
      return;
    }
    const query = buildPrimaryQuery(text);
    const cacheKey = `yt::${file?.name ?? "doc"}::${currentPage}::${query}`;
    const cached = getCachedAi(cacheKey);
    if (cached) {
      try { setYtVideos(JSON.parse(cached)); setYtError(null); return; } catch { /* refetch */ }
    }
    setYtLoading(true);
    setYtError(null);
    try {
      const { data, error } = await supabase.functions.invoke("youtube-search", {
        body: { query, maxResults: 6 },
      });
      if (error) throw error;
      const videos: YTVideo[] = data?.videos ?? [];
      setYtVideos(videos);
      setCachedAi(cacheKey, JSON.stringify(videos));
    } catch (e) {
      setYtError(e instanceof Error ? e.message : "Failed to load videos");
    } finally {
      setYtLoading(false);
    }
  }, [pageTexts, currentPage, file?.name]);

  useEffect(() => {
    if (videosOpen) loadVideos();
  }, [videosOpen, loadVideos]);

  const runVideoAction = useCallback(
    (action: VideoAction, video: YTVideo) => {
      if (!isPremium) {
        toast({ title: "Pro feature", description: "Upgrade to summarize videos and extract notes.", variant: "destructive" });
        return;
      }
      const cacheKey = makeAiCacheKey({
        scope: `yt::${video.videoId}`,
        action,
        content: `${video.title}\n${video.description}`,
      });
      const cached = getCachedAi(cacheKey);
      if (cached) {
        setAiAction(action);
        setAiOpen(true);
        setAiOutput(cached);
        setAiLoading(false);
        setAiFromCache(true);
        return;
      }

      setAiAction(action);
      setAiOpen(true);
      setAiOutput("");
      setAiLoading(true);
      setAiFromCache(false);

      let full = "";
      streamAI({
        functionName: "video-smart-action",
        body: { action, video },
        onDelta: (t) => { full += t; setAiOutput(full); },
        onDone: () => {
          setAiLoading(false);
          setCachedAi(cacheKey, full);
          saveOutput("pdf-summarizer", { tool: "video", action, videoId: video.videoId, title: video.title, url: video.url }, full);
        },
        onError: (err) => {
          setAiLoading(false);
          toast({ title: "Error", description: err, variant: "destructive" });
        },
      });
    },
    [isPremium]
  );

  const saveVideosToLibrary = async () => {
    if (!ytVideos.length) {
      toast({ title: "Nothing to save", description: "Load some videos first.", variant: "destructive" });
      return;
    }
    const text = pageTexts[currentPage - 1] ?? "";
    const topic = buildPrimaryQuery(text).slice(0, 80);
    const md = [
      `# Related videos for ${file?.name ?? "document"} — page ${currentPage}`,
      ``,
      `**Topic:** ${topic || "—"}`,
      ``,
      ...ytVideos.map((v) => `- [${v.title}](${v.url}) — ${v.channel}`),
    ].join("\n");
    try {
      await saveOutput(
        "pdf-summarizer",
        { tool: "related-videos", topic, page: currentPage, fileName: file?.name, videos: ytVideos },
        md,
      );
      toast({ title: "Saved to Library", description: `${ytVideos.length} videos saved as a study entry.` });
    } catch {
      toast({ title: "Error", description: "Could not save to Library.", variant: "destructive" });
    }
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
      <div ref={containerRef} className="flex-1 overflow-auto bg-muted/30 px-2 py-3 pb-20">
        <div className="flex flex-col items-center gap-3">
          {Array.from({ length: numPages }).map((_, i) => {
            const n = i + 1;
            const showText = showExtractedFor.has(n);
            return (
              <div
                key={n}
                ref={(el) => { if (el) pageRefs.current.set(n, el); else pageRefs.current.delete(n); }}
                data-page-num={n}
                className="bg-background shadow-sm rounded-md overflow-hidden border border-border/50 max-w-full w-full sm:w-auto"
              >
                <canvas className="block max-w-full mx-auto" />
                {pageTexts[i] && (
                  <div className="border-t border-dashed border-border/60">
                    <button
                      className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground hover:bg-muted/40 transition-colors"
                      onClick={() => setShowExtractedFor((prev) => {
                        const next = new Set(prev);
                        next.has(n) ? next.delete(n) : next.add(n);
                        return next;
                      })}
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3 w-3" />
                        {showText ? "Hide" : "View"} extracted text · page {n}
                      </span>
                      {showText ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {showText && (
                      <div className="px-3 pb-3 bg-muted/30">
                        <p className="text-[11px] leading-relaxed select-text text-foreground/80 max-w-[800px] whitespace-pre-wrap">
                          {pageTexts[i]}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact contextual bottom toolbar */}
      {(selectedText || toolbarPinned) && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 z-30 flex items-center gap-1 bg-popover/95 backdrop-blur border border-border rounded-full shadow-lg px-1.5 py-1 animate-in fade-in slide-in-from-bottom-2">
          <Button
            size="sm" variant="ghost" className="h-8 px-2.5 gap-1 text-xs rounded-full"
            onClick={() => selectedText ? handleSelectionAction("summarize_page") : handleSummarizePage()}
          >
            <Sparkles className="h-3.5 w-3.5" /> Summary
          </Button>
          <Button
            size="sm" variant="ghost" className="h-8 px-2.5 gap-1 text-xs rounded-full"
            onClick={() => selectedText ? handleSelectionAction("generate_questions") : runAction("generate_questions", pageTexts[currentPage - 1] ?? "")}
          >
            <ListChecks className="h-3.5 w-3.5" /> Quiz
          </Button>
          <Button
            size="sm" variant="ghost" className="h-8 px-2.5 gap-1 text-xs rounded-full"
            onClick={() => selectedText ? handleSelectionAction("explain") : runAction("explain", pageTexts[currentPage - 1] ?? "")}
          >
            <MessageSquareQuote className="h-3.5 w-3.5" /> Explain
          </Button>
          <Button
            size="sm" variant="ghost" className="h-8 px-2.5 gap-1 text-xs rounded-full"
            onClick={() => selectedText ? handleSelectionAction("make_flashcards") : runAction("make_flashcards", pageTexts[currentPage - 1] ?? "")}
          >
            <Layers className="h-3.5 w-3.5" /> Flashcards
          </Button>
          <div className="w-px h-5 bg-border mx-0.5" />
          <Button
            size="sm" variant="ghost" className="h-8 px-2.5 gap-1 text-xs rounded-full"
            onClick={() => setVideosOpen(true)}
          >
            <Youtube className="h-3.5 w-3.5 text-destructive" /> Videos
          </Button>
          {!selectedText && (
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full" onClick={() => setToolbarPinned(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Single floating action button to open toolbar when no selection */}
      {!selectedText && !toolbarPinned && !aiOpen && !videosOpen && (
        <Button
          size="sm"
          className="absolute right-4 bottom-4 z-30 rounded-full shadow-lg gap-1.5 h-11 px-4"
          onClick={() => setToolbarPinned(true)}
        >
          <Sparkles className="h-4 w-4" /> AI tools
        </Button>
      )}

      {/* Selection mini-popover above selection (kept for quick Ask) */}
      {selectedText && popoverPos && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-full shadow-lg px-1 py-0.5 flex items-center -translate-x-1/2 -translate-y-[120%]"
          style={{ left: popoverPos.x, top: popoverPos.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-[11px] rounded-full" onClick={() => handleSelectionAction("ask")}>
            <MessageSquareQuote className="h-3 w-3" /> Ask AI
          </Button>
        </div>
      )}

      {/* Related Videos drawer */}
      <Sheet open={videosOpen} onOpenChange={setVideosOpen}>
        <SheetContent side="bottom" className="h-[80dvh] flex flex-col p-0">
          <SheetHeader className="px-4 py-3 border-b border-border">
            <SheetTitle className="text-base flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-destructive" /> Related Videos
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[11px] gap-1"
                onClick={saveVideosToLibrary}
                disabled={!ytVideos.length}
              >
                <BookOpen className="h-3 w-3" /> Save to Library
              </Button>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 px-4 py-3">
            <p className="text-[11px] text-muted-foreground mb-3">
              YouTube videos for page {currentPage}{file ? ` of ${file.name}` : ""}.
            </p>
            {ytLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading videos…
              </div>
            )}
            {ytError && !ytLoading && (
              <p className="text-xs text-destructive">{ytError}</p>
            )}
            <div className="space-y-3">
              {ytVideos.map((v) => (
                <div key={v.videoId} className="rounded-lg border border-border bg-card overflow-hidden">
                  <a href={v.url} target="_blank" rel="noopener noreferrer" className="flex gap-3 p-3 hover:bg-muted/50 transition-colors">
                    {v.thumbnail ? (
                      <img src={v.thumbnail} alt="" className="h-16 w-24 object-cover rounded shrink-0" loading="lazy" />
                    ) : (
                      <div className="h-16 w-24 rounded bg-destructive/10 flex items-center justify-center shrink-0">
                        <Youtube className="h-5 w-5 text-destructive" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{v.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{v.channel}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                  </a>
                  <div className="flex items-center gap-1 px-3 pb-2 flex-wrap">
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 px-2 text-[11px] gap-1"
                      onClick={() => runVideoAction("summarize_video", v)}
                    >
                      {!isPremium && <Crown className="h-3 w-3 text-warning" />}
                      <Sparkles className="h-3 w-3" /> Summarize
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 px-2 text-[11px] gap-1"
                      onClick={() => runVideoAction("key_notes", v)}
                    >
                      {!isPremium && <Crown className="h-3 w-3 text-warning" />}
                      <BookOpen className="h-3 w-3" /> Key notes
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 px-2 text-[11px] gap-1"
                      onClick={() => runVideoAction("video_questions", v)}
                    >
                      {!isPremium && <Crown className="h-3 w-3 text-warning" />}
                      <ListChecks className="h-3 w-3" /> Questions
                    </Button>
                  </div>
                </div>
              ))}
              {!ytLoading && !ytError && ytVideos.length === 0 && (
                <p className="text-xs text-muted-foreground">No videos found.</p>
              )}
            </div>
            {!isPremium && (
              <div className="mt-4 rounded-lg border border-dashed border-warning/40 p-3 bg-warning/5">
                <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                  <Crown className="h-3 w-3 text-warning" /> Pro: Summarize, key notes & questions from videos
                </p>
                <p className="text-[11px] text-muted-foreground">Upgrade to unlock AI actions on YouTube results.</p>
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
              {aiAction
                ? (ACTION_LABELS as Record<string, string>)[aiAction] ?? (VIDEO_ACTION_LABELS as Record<string, string>)[aiAction] ?? "AI"
                : "AI"}
              {aiFromCache && (
                <span className="ml-auto text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">cached</span>
              )}
              {!isPremium && !aiFromCache && <span className="ml-auto text-[10px] font-normal text-muted-foreground">Free tier</span>}
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
              <>
                <MarkdownWithMath className="prose prose-sm max-w-none dark:prose-invert prose-p:text-sm prose-headings:text-base">
                  {aiOutput}
                </MarkdownWithMath>
                {!aiLoading && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => { setAiOpen(false); setVideosOpen(true); }}
                    >
                      <Youtube className="h-3.5 w-3.5 text-destructive" /> See related videos
                    </Button>
                  </div>
                )}
              </>
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
