import { useState, useRef, useEffect, useCallback } from "react";
import { ClipboardList, Upload, Sparkles, Clock, Hash, Play, Square, CheckCircle2, XCircle, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { streamAI } from "@/lib/streaming";
import AIThinking from "@/components/AIThinking";
import ReactMarkdown from "react-markdown";
import * as pdfjs from "pdfjs-dist";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ExamMode = "cbt" | "fill" | "theory";
type InputSource = "text" | "pdf";
type ExamPhase = "setup" | "exam" | "results";

interface ParsedQuestion {
  question: string;
  answer: string;
}

function parseQuestions(raw: string): ParsedQuestion[] {
  const parts = raw.split(/\*\*Q\d+[\.\)]?\*?\*?\s*/i).filter(Boolean);
  const questions: ParsedQuestion[] = [];

  for (const part of parts) {
    const splitIdx = part.indexOf("---ANSWER---");
    if (splitIdx === -1) {
      // Try to find answer another way
      questions.push({ question: part.trim(), answer: "" });
      continue;
    }
    questions.push({
      question: part.slice(0, splitIdx).trim(),
      answer: part.slice(splitIdx + 12).trim(),
    });
  }

  return questions;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const PracticeExam = () => {
  const { toast } = useToast();

  // Setup state
  const [inputSource, setInputSource] = useState<InputSource>("text");
  const [content, setContent] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [mode, setMode] = useState<ExamMode>("cbt");
  const [numQuestions, setNumQuestions] = useState(10);
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Exam state
  const [phase, setPhase] = useState<ExamPhase>("setup");
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Timer
  useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          toast({ title: "⏰ Time's up!", description: "Your exam time has ended." });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft, toast]);

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
        const c = await page.getTextContent();
        text += c.items.map((item: any) => item.str).join(" ") + "\n\n";
      }
      setContent(text.trim());
    } catch {
      toast({ title: "Error", description: "Could not read PDF", variant: "destructive" });
    }
  };

  const generate = async () => {
    if (!content.trim()) {
      toast({ title: "Missing input", description: "Paste text or upload a PDF first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    let raw = "";

    await streamAI({
      functionName: "practice-exam",
      body: { content, mode, numQuestions },
      onDelta: (text) => { raw += text; },
      onDone: () => {
        const parsed = parseQuestions(raw);
        if (parsed.length === 0) {
          toast({ title: "Error", description: "Could not generate questions. Try different content.", variant: "destructive" });
          setLoading(false);
          return;
        }
        setQuestions(parsed);
        setUserAnswers({});
        setCurrentQ(0);
        setShowAnswers(false);
        setTimeLeft(timerMinutes * 60);
        setTimerRunning(true);
        setPhase("exam");
        setLoading(false);
      },
      onError: (err) => {
        setLoading(false);
        toast({ title: "Error", description: err, variant: "destructive" });
      },
    });
  };

  const handleSubmit = () => {
    setTimerRunning(false);
    setShowAnswers(true);
    setPhase("results");
  };

  const handleRestart = () => {
    setPhase("setup");
    setQuestions([]);
    setUserAnswers({});
    setShowAnswers(false);
    setTimerRunning(false);
  };

  const answeredCount = Object.keys(userAnswers).filter((k) => userAnswers[Number(k)]?.trim()).length;

  // ──── Setup Phase ────
  if (phase === "setup") {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-4 pb-24">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="rounded-xl p-2 bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">Practice Exam</h1>
          </div>
          <p className="text-sm text-muted-foreground">Paste content and practice with timed questions.</p>
        </div>

        {/* Input Source */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Study Material</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="flex gap-2">
              <Button size="sm" variant={inputSource === "text" ? "default" : "outline"} onClick={() => setInputSource("text")} className="text-xs">
                Paste Text
              </Button>
              <Button size="sm" variant={inputSource === "pdf" ? "default" : "outline"} onClick={() => setInputSource("pdf")} className="text-xs">
                Upload PDF
              </Button>
            </div>

            {inputSource === "text" ? (
              <Textarea
                placeholder="Paste your notes, past questions, or study material here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[140px]"
              />
            ) : (
              <div className="space-y-2">
                <input ref={fileRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  {pdfFileName || "Choose PDF file"}
                </Button>
                {content && inputSource === "pdf" && (
                  <p className="text-xs text-muted-foreground">✅ Extracted {content.split(/\s+/).length} words</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question Mode */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Question Mode</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "cbt" as ExamMode, label: "CBT (MCQ)", desc: "Multiple choice" },
                { key: "fill" as ExamMode, label: "Fill-in", desc: "Fill the blank" },
                { key: "theory" as ExamMode, label: "Theory", desc: "Written answers" },
              ]).map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={cn(
                    "rounded-xl border p-3 text-center transition-all",
                    mode === key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-[10px] mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
              <label className="text-sm text-foreground flex-1">Questions</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, Math.min(50, Number(e.target.value))))}
                className="w-20 text-center"
              />
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <label className="text-sm text-foreground flex-1">Timer (minutes)</label>
              <Input
                type="number"
                min={1}
                max={180}
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(Math.max(1, Math.min(180, Number(e.target.value))))}
                className="w-20 text-center"
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={generate} disabled={loading} className="w-full">
          <Sparkles className="h-4 w-4 mr-2" />
          {loading ? "Generating Questions..." : "Start Practice Exam"}
        </Button>
        {loading && <AIThinking message="Generating your practice questions" />}
      </div>
    );
  }

  // ──── Exam / Results Phase ────
  const q = questions[currentQ];

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-primary/10">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">
              {phase === "results" ? "Results" : "Practice Exam"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {mode === "cbt" ? "CBT" : mode === "fill" ? "Fill-in" : "Theory"} • {questions.length} questions
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-mono font-bold",
          timeLeft <= 60 && timerRunning ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted text-foreground"
        )}>
          <Clock className="h-3.5 w-3.5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question Navigation */}
      <div className="flex gap-1.5 flex-wrap">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            className={cn(
              "w-8 h-8 rounded-lg text-xs font-semibold transition-all",
              i === currentQ ? "bg-primary text-primary-foreground" :
              userAnswers[i]?.trim() ? "bg-primary/20 text-primary" :
              "bg-muted text-muted-foreground"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Current Question */}
      {q && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{`**Question ${currentQ + 1}**\n\n${q.question}`}</ReactMarkdown>
            </div>

            {/* Answer Input */}
            {mode === "cbt" ? (
              <div className="grid gap-2">
                {["A", "B", "C", "D"].map((letter) => {
                  const selected = userAnswers[currentQ] === letter;
                  const isCorrect = showAnswers && q.answer.trim().startsWith(letter);
                  const isWrong = showAnswers && selected && !q.answer.trim().startsWith(letter);

                  return (
                    <button
                      key={letter}
                      onClick={() => !showAnswers && setUserAnswers((prev) => ({ ...prev, [currentQ]: letter }))}
                      disabled={showAnswers}
                      className={cn(
                        "w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-all",
                        !showAnswers && !selected && "border-border bg-card hover:border-primary/50",
                        !showAnswers && selected && "border-primary bg-primary/10",
                        isCorrect && "border-success bg-success/10 text-success",
                        isWrong && "border-destructive bg-destructive/10 text-destructive",
                        showAnswers && !isCorrect && !isWrong && "opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isCorrect && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                        {isWrong && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                        <span>{letter})</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <Textarea
                placeholder={mode === "fill" ? "Type your answer..." : "Write your answer here..."}
                value={userAnswers[currentQ] || ""}
                onChange={(e) => setUserAnswers((prev) => ({ ...prev, [currentQ]: e.target.value }))}
                disabled={showAnswers}
                className={cn("min-h-[80px]", mode === "theory" && "min-h-[120px]")}
              />
            )}

            {/* Show answer in results */}
            {showAnswers && q.answer && (
              <div className="rounded-lg px-3 py-2.5 bg-success/10 border border-success/20 animate-fade-in">
                <div className="flex items-center gap-2 font-medium text-sm mb-1 text-success">
                  <Eye className="h-4 w-4" /> Model Answer
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{q.answer}</ReactMarkdown>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={currentQ === 0}
          onClick={() => setCurrentQ((p) => p - 1)}
        >
          Previous
        </Button>
        {currentQ < questions.length - 1 ? (
          <Button className="flex-1" onClick={() => setCurrentQ((p) => p + 1)}>
            Next
          </Button>
        ) : !showAnswers ? (
          <Button className="flex-1" variant="default" onClick={handleSubmit}>
            <Square className="h-4 w-4 mr-2" /> Submit ({answeredCount}/{questions.length})
          </Button>
        ) : (
          <Button className="flex-1" variant="default" onClick={handleRestart}>
            <RotateCcw className="h-4 w-4 mr-2" /> New Exam
          </Button>
        )}
      </div>

      {/* Summary in results */}
      {showAnswers && (
        <Card className="border-primary/30">
          <CardContent className="p-4 text-center space-y-1">
            <p className="text-2xl font-bold text-foreground">{answeredCount}/{questions.length}</p>
            <p className="text-sm text-muted-foreground">Questions answered</p>
            <p className="text-xs text-muted-foreground">
              Time used: {formatTime(timerMinutes * 60 - timeLeft)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PracticeExam;
