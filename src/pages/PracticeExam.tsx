import { useState, useRef, useEffect } from "react";
import { ClipboardList, Upload, Sparkles, Clock, Hash, Square, CheckCircle2, XCircle, Eye, RotateCcw, Target, TrendingUp, TrendingDown, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShareResultButton from "@/components/ShareResultButton";
import TimeSavedIndicator from "@/components/TimeSavedIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { streamAI } from "@/lib/streaming";
import AIThinking from "@/components/AIThinking";
import MarkdownWithMath from "@/components/MarkdownWithMath";
import { usePremium } from "@/contexts/PremiumContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import * as pdfjs from "pdfjs-dist";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ExamMode = "cbt" | "fill" | "theory";
type InputSource = "text" | "pdf";
type ExamPhase = "setup" | "exam" | "results";

interface ParsedQuestion {
  question: string;
  answer: string;
  topic: string;
}

function extractTopic(text: string): { text: string; topic: string } {
  const m = text.match(/\[TOPIC:\s*([^\]]+)\]/i);
  if (!m) return { text: text.trim(), topic: "General" };
  return { text: text.replace(m[0], "").trim(), topic: m[1].trim() };
}

function parseQuestions(raw: string): ParsedQuestion[] {
  const parts = raw.split(/\*\*Q\d+[\.\)]?\*?\*?\s*/i).filter(Boolean);
  const questions: ParsedQuestion[] = [];
  for (const part of parts) {
    const splitIdx = part.indexOf("---ANSWER---");
    const rawQ = splitIdx === -1 ? part : part.slice(0, splitIdx);
    const rawA = splitIdx === -1 ? "" : part.slice(splitIdx + 12).trim();
    const { text, topic } = extractTopic(rawQ);
    questions.push({ question: text, answer: rawA, topic });
  }
  return questions;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface ResultAnalysis {
  score: number;
  total: number;
  percent: number;
  weak: string[];
  strong: string[];
  recommended: string;
}

function analyzeResults(questions: ParsedQuestion[], answers: Record<number, string>, mode: ExamMode): ResultAnalysis {
  const topicCounts: Record<string, { right: number; wrong: number }> = {};
  let score = 0;
  const total = questions.length;

  questions.forEach((q, i) => {
    const topic = q.topic || "General";
    if (!topicCounts[topic]) topicCounts[topic] = { right: 0, wrong: 0 };
    const userAns = (answers[i] || "").trim();

    let correct = false;
    if (mode === "cbt") {
      const correctLetter = q.answer.trim().charAt(0).toUpperCase();
      correct = userAns.toUpperCase() === correctLetter;
    } else if (mode === "fill") {
      const model = q.answer.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
      const ua = userAns.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
      correct = ua.length > 0 && (model.includes(ua) || ua.includes(model.split(/\s+/)[0] || ""));
    } else {
      correct = userAns.length >= 30;
    }

    if (correct) { score++; topicCounts[topic].right++; }
    else { topicCounts[topic].wrong++; }
  });

  const weak: string[] = [];
  const strong: string[] = [];
  Object.entries(topicCounts).forEach(([topic, { right, wrong }]) => {
    const t = right + wrong;
    const ratio = right / t;
    if (ratio < 0.5) weak.push(topic);
    else if (ratio >= 0.75) strong.push(topic);
  });

  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  let recommended = "Excellent work — try a harder set or new material next!";
  if (weak.length > 0) recommended = `Focus your next session on: ${weak.slice(0, 3).join(", ")}.`;
  else if (percent < 70) recommended = "Review the model answers and re-attempt this exam to lock in the concepts.";

  return { score, total, percent, weak, strong, recommended };
}

const PracticeExam = () => {
  const { toast } = useToast();
  const { isPremium, promptUpgrade } = usePremium();
  const { user } = useAuth();

  const [inputSource, setInputSource] = useState<InputSource>("text");
  const [content, setContent] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [mode, setMode] = useState<ExamMode>("cbt");
  const [numQuestions, setNumQuestions] = useState(10);
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<ExamPhase>("setup");
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [analysis, setAnalysis] = useState<ResultAnalysis | null>(null);


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
    if (!content.trim() || loading) {
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

  const handleSubmit = async () => {
    setTimerRunning(false);
    setShowAnswers(true);
    const result = analyzeResults(questions, userAnswers, mode);
    setAnalysis(result);
    setPhase("results");

    // Persist to Supabase
    if (user) {
      try {
        await supabase.from("exam_sessions").insert({
          user_id: user.id,
          mode,
          score: result.score,
          total_questions: result.total,
          topics_weak: result.weak,
          topics_strong: result.strong,
          recommended_focus: result.recommended,
          time_used_seconds: timerMinutes * 60 - timeLeft,
        });
      } catch (e) {
        console.error("Failed to save exam session", e);
      }
    }

    if (!isPremium) {
      setTimeout(() => promptUpgrade(), 2000);
    }
  };

  const handleRestart = () => {
    setPhase("setup");
    setQuestions([]);
    setUserAnswers({});
    setShowAnswers(false);
    setTimerRunning(false);
    setAnalysis(null);
  };


  const answeredCount = Object.keys(userAnswers).filter((k) => userAnswers[Number(k)]?.trim()).length;

  if (phase === "setup") {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-4 pb-24">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="rounded-xl p-2 bg-primary/10"><ClipboardList className="h-5 w-5 text-primary" /></div>
            <h1 className="text-xl font-display font-bold text-foreground">Practice Exam</h1>
          </div>
          <p className="text-sm text-muted-foreground">Paste content and practice with timed questions.</p>
        </div>

        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-base">Study Material</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="flex gap-2">
              <Button size="sm" variant={inputSource === "text" ? "default" : "outline"} onClick={() => setInputSource("text")} className="text-xs">Paste Text</Button>
              <Button size="sm" variant={inputSource === "pdf" ? "default" : "outline"} onClick={() => setInputSource("pdf")} className="text-xs">Upload PDF</Button>
            </div>
            {inputSource === "text" ? (
              <Textarea placeholder="Paste your notes, past questions, or study material here..." value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[140px]" />
            ) : (
              <div className="space-y-2">
                <input ref={fileRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />{pdfFileName || "Choose PDF file"}
                </Button>
                {content && inputSource === "pdf" && (
                  <p className="text-xs text-muted-foreground">✅ Extracted {content.split(/\s+/).length} words</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-base">Question Mode</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "cbt" as ExamMode, label: "CBT (MCQ)", desc: "Multiple choice" },
                { key: "fill" as ExamMode, label: "Fill-in", desc: "Fill the blank" },
                { key: "theory" as ExamMode, label: "Theory", desc: "Written answers" },
              ]).map(({ key, label, desc }) => (
                <button key={key} onClick={() => setMode(key)} className={cn(
                  "rounded-xl border p-3 text-center transition-all",
                  mode === key ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/50"
                )}>
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-[10px] mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-base">Settings</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
              <label className="text-sm text-foreground flex-1">Questions</label>
              <Input type="number" min={1} max={50} value={numQuestions} onChange={(e) => setNumQuestions(Math.max(1, Math.min(50, Number(e.target.value))))} className="w-20 text-center" />
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <label className="text-sm text-foreground flex-1">Timer (minutes)</label>
              <Input type="number" min={1} max={180} value={timerMinutes} onChange={(e) => setTimerMinutes(Math.max(1, Math.min(180, Number(e.target.value))))} className="w-20 text-center" />
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

  const q = questions[currentQ];

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-primary/10"><ClipboardList className="h-5 w-5 text-primary" /></div>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">{phase === "results" ? "Results" : "Practice Exam"}</h1>
            <p className="text-xs text-muted-foreground">{mode === "cbt" ? "CBT" : mode === "fill" ? "Fill-in" : "Theory"} • {questions.length} questions</p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-mono font-bold",
          timeLeft <= 60 && timerRunning ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted text-foreground"
        )}>
          <Clock className="h-3.5 w-3.5" />{formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrentQ(i)} className={cn(
            "w-8 h-8 rounded-lg text-xs font-semibold transition-all",
            i === currentQ ? "bg-primary text-primary-foreground" :
            userAnswers[i]?.trim() ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>{i + 1}</button>
        ))}
      </div>

      {q && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <MarkdownWithMath className="prose prose-sm max-w-none dark:prose-invert">
              {`**Question ${currentQ + 1}**\n\n${q.question}`}
            </MarkdownWithMath>

            {mode === "cbt" ? (
              <div className="grid gap-2">
                {["A", "B", "C", "D"].map((letter) => {
                  const selected = userAnswers[currentQ] === letter;
                  const isCorrect = showAnswers && q.answer.trim().startsWith(letter);
                  const isWrong = showAnswers && selected && !q.answer.trim().startsWith(letter);
                  return (
                    <button key={letter} onClick={() => !showAnswers && setUserAnswers((prev) => ({ ...prev, [currentQ]: letter }))} disabled={showAnswers}
                      className={cn(
                        "w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-all",
                        !showAnswers && !selected && "border-border bg-card hover:border-primary/50",
                        !showAnswers && selected && "border-primary bg-primary/10",
                        isCorrect && "border-success bg-success/10 text-success",
                        isWrong && "border-destructive bg-destructive/10 text-destructive",
                        showAnswers && !isCorrect && !isWrong && "opacity-50"
                      )}>
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

            {showAnswers && q.answer && (
              <div className="rounded-lg px-3 py-2.5 bg-success/10 border border-success/20 animate-fade-in">
                <div className="flex items-center gap-2 font-medium text-sm mb-1 text-success">
                  <Eye className="h-4 w-4" /> Model Answer
                </div>
                <MarkdownWithMath className="prose prose-sm max-w-none dark:prose-invert">
                  {q.answer}
                </MarkdownWithMath>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" disabled={currentQ === 0} onClick={() => setCurrentQ((p) => p - 1)}>Previous</Button>
        {currentQ < questions.length - 1 ? (
          <Button className="flex-1" onClick={() => setCurrentQ((p) => p + 1)}>Next</Button>
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

      {showAnswers && analysis && (
        <Card className="border-primary/30 animate-fade-in">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" /> Your Results
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* Score */}
            <div className="text-center space-y-2">
              <p className="text-4xl font-bold text-foreground">
                {analysis.score}<span className="text-2xl text-muted-foreground">/{analysis.total}</span>
              </p>
              <p className="text-sm font-semibold text-primary">{analysis.percent}% score</p>
              <Progress value={analysis.percent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Time used: {formatTime(timerMinutes * 60 - timeLeft)}
                {mode === "theory" && " • Theory mode counts attempts ≥ 30 chars as completed"}
              </p>
            </div>

            {/* Strong topics */}
            {analysis.strong.length > 0 && (
              <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-success mb-2">
                  <TrendingUp className="h-4 w-4" /> Strong topics
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.strong.map((t) => (
                    <Badge key={t} variant="outline" className="border-success/40 text-success bg-success/10">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Weak topics */}
            {analysis.weak.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-destructive mb-2">
                  <TrendingDown className="h-4 w-4" /> Topics to review
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.weak.map((t) => (
                    <Badge key={t} variant="outline" className="border-destructive/40 text-destructive bg-destructive/10">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1">
                <Target className="h-4 w-4" /> Recommended focus
              </div>
              <p className="text-sm text-foreground">{analysis.recommended}</p>
            </div>

            <TimeSavedIndicator wordCount={content.split(/\s+/).length} type="exam" />
            <ShareResultButton
              text={`🎯 I scored ${analysis.score}/${analysis.total} (${analysis.percent}%) on my ${mode === "cbt" ? "CBT" : mode === "fill" ? "Fill-in" : "Theory"} practice exam!${analysis.weak.length ? `\n📚 Reviewing: ${analysis.weak.slice(0, 3).join(", ")}` : ""}\n\nTurn your notes into practice exams instantly with StudyFlow!`}
              title="My Practice Exam Result"
            />
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default PracticeExam;
