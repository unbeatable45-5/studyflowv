import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AIThinking from "@/components/AIThinking";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import OutputActions from "@/components/OutputActions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { saveOutput } from "@/lib/saved-outputs";
import { toast } from "@/hooks/use-toast";
import {
  Layers, Loader2, RotateCcw, ChevronLeft, ChevronRight,
  Shuffle, Play, CheckCircle2, XCircle, Trophy, ArrowLeft, Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Flashcard {
  front: string;
  back: string;
}

type Mode = "browse" | "quiz";
type QuizResult = "correct" | "wrong" | null;

const FlashcardGenerator = () => {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState([6]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Quiz state
  const [mode, setMode] = useState<Mode>("browse");
  const [quizCards, setQuizCards] = useState<Flashcard[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setCards([]);
    setCurrentIndex(0);
    setFlipped(false);
    setMode("browse");
    setQuizFinished(false);

    try {
      const { data, error } = await supabase.functions.invoke("flashcard-generator", {
        body: { topic: topic.trim(), count: count[0] },
      });
      if (error) throw error;
      if (data?.flashcards) {
        setCards(data.flashcards);
        const text = data.flashcards
          .map((c: Flashcard, i: number) => `Card ${i + 1}:\nQ: ${c.front}\nA: ${c.back}`)
          .join("\n\n");
        saveOutput("study-helper", { topic, type: "flashcards" }, text);
      } else {
        toast({ title: "Error", description: "Failed to generate flashcards", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const shuffleCards = useCallback(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setFlipped(false);
    toast({ title: "Cards shuffled! 🔀" });
  }, [cards]);

  const startQuiz = useCallback(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setQuizCards(shuffled);
    setResults(new Array(shuffled.length).fill(null));
    setCurrentIndex(0);
    setFlipped(false);
    setQuizFinished(false);
    setMode("quiz");
  }, [cards]);

  const exitQuiz = () => {
    setMode("browse");
    setCurrentIndex(0);
    setFlipped(false);
    setQuizFinished(false);
  };

  const markResult = (result: "correct" | "wrong") => {
    const newResults = [...results];
    newResults[currentIndex] = result;
    setResults(newResults);

    if (currentIndex < quizCards.length - 1) {
      setTimeout(() => {
        setFlipped(false);
        setCurrentIndex((i) => i + 1);
      }, 300);
    } else {
      setQuizFinished(true);
    }
  };

  const correctCount = results.filter((r) => r === "correct").length;
  const answeredCount = results.filter((r) => r !== null).length;
  const activeCards = mode === "quiz" ? quizCards : cards;
  const scorePercent = quizCards.length > 0 ? Math.round((correctCount / quizCards.length) * 100) : 0;

  const prev = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i > 0 ? i - 1 : activeCards.length - 1));
  };
  const next = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i < activeCards.length - 1 ? i + 1 : 0));
  };

  const allText = cards
    .map((c, i) => `Card ${i + 1}:\nQ: ${c.front}\nA: ${c.back}`)
    .join("\n\n");

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-accent rounded-lg p-2">
            <Layers className="h-5 w-5 text-accent-foreground" />
          </div>
          <h1 className="text-xl font-display font-bold">Flashcard Generator</h1>
        </div>
        <p className="text-sm text-muted-foreground">Enter a topic to create study flashcards.</p>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          placeholder="e.g. Cell Biology, French Revolution..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={handleGenerate} disabled={loading || !topic.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
        </Button>
      </div>

      {/* Card count */}
      <div className="space-y-2">
        <Label className="text-sm">Number of cards: {count[0]}</Label>
        <Slider value={count} onValueChange={setCount} min={3} max={12} step={1} />
      </div>

      {loading && cards.length === 0 && <AIThinking message="Creating flashcards" />}

      {/* Quiz finished screen */}
      {mode === "quiz" && quizFinished && (
        <Card className="animate-fade-in border-2 border-primary/20">
          <CardContent className="p-6 text-center space-y-4">
            <Trophy className="h-12 w-12 mx-auto text-warning" />
            <h2 className="text-2xl font-display font-bold">Quiz Complete!</h2>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-primary">{scorePercent}%</p>
              <p className="text-sm text-muted-foreground">
                {correctCount} of {quizCards.length} correct
              </p>
              <Progress value={scorePercent} className="h-3" />
            </div>
            <p className="text-sm text-muted-foreground">
              {scorePercent === 100
                ? "Perfect score! 🎉"
                : scorePercent >= 70
                ? "Great job! Keep practicing! 💪"
                : "Keep studying, you'll get there! 📚"}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Button onClick={startQuiz} className="gap-1.5">
                <RotateCcw className="h-4 w-4" /> Retry Quiz
              </Button>
              <Button variant="outline" onClick={exitQuiz} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Browse Cards
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flashcard viewer */}
      {activeCards.length > 0 && !(mode === "quiz" && quizFinished) && (
        <div className="space-y-4 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {mode === "quiz" ? (
                <span className="text-sm font-medium text-primary">
                  Quiz: {answeredCount}/{quizCards.length}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Card {currentIndex + 1} of {activeCards.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {mode === "browse" && (
                <>
                  <Button variant="ghost" size="sm" onClick={shuffleCards} className="gap-1 text-xs">
                    <Shuffle className="h-3.5 w-3.5" /> Shuffle
                  </Button>
                  <Button variant="default" size="sm" onClick={startQuiz} className="gap-1 text-xs">
                    <Play className="h-3.5 w-3.5" /> Quiz
                  </Button>
                </>
              )}
              {mode === "quiz" && (
                <Button variant="ghost" size="sm" onClick={exitQuiz} className="gap-1 text-xs">
                  <ArrowLeft className="h-3.5 w-3.5" /> Exit Quiz
                </Button>
              )}
              <OutputActions text={allText} title={`Flashcards: ${topic}`} />
            </div>
          </div>

          {/* Quiz progress bar */}
          {mode === "quiz" && (
            <Progress value={(answeredCount / quizCards.length) * 100} className="h-2" />
          )}

          {/* Card */}
          <div
            className="relative cursor-pointer"
            onClick={() => setFlipped(!flipped)}
            style={{ perspective: "1000px" }}
          >
            <div
              className={cn(
                "relative w-full min-h-[200px] transition-transform duration-500",
                flipped && "[transform:rotateY(180deg)]"
              )}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front */}
              <Card
                className={cn(
                  "absolute inset-0 flex items-center justify-center p-6 border-2 bg-card",
                  mode === "quiz" && results[currentIndex] === "correct" && "border-success/40",
                  mode === "quiz" && results[currentIndex] === "wrong" && "border-destructive/40",
                  !(mode === "quiz" && results[currentIndex]) && "border-primary/20"
                )}
                style={{ backfaceVisibility: "hidden" }}
              >
                <CardContent className="text-center p-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Question</p>
                  <p className="text-lg font-medium text-foreground">{activeCards[currentIndex].front}</p>
                  <p className="text-xs text-muted-foreground mt-4">Tap to reveal answer</p>
                </CardContent>
              </Card>

              {/* Back */}
              <Card
                className="absolute inset-0 flex items-center justify-center p-6 border-2 border-success/20 bg-card [transform:rotateY(180deg)]"
                style={{ backfaceVisibility: "hidden" }}
              >
                <CardContent className="text-center p-0">
                  <p className="text-xs uppercase tracking-wider text-success mb-3">Answer</p>
                  <p className="text-lg font-medium text-foreground">{activeCards[currentIndex].back}</p>
                  {mode === "browse" && (
                    <p className="text-xs text-muted-foreground mt-4">Tap to flip back</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quiz scoring buttons */}
          {mode === "quiz" && flipped && results[currentIndex] === null && (
            <div className="flex gap-3 justify-center animate-fade-in">
              <Button
                variant="outline"
                onClick={(e) => { e.stopPropagation(); markResult("wrong"); }}
                className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4" /> Got it wrong
              </Button>
              <Button
                onClick={(e) => { e.stopPropagation(); markResult("correct"); }}
                className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground"
              >
                <CheckCircle2 className="h-4 w-4" /> Got it right
              </Button>
            </div>
          )}

          {/* Navigation (browse mode only) */}
          {mode === "browse" && (
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" onClick={prev}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setFlipped(false)}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={next}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Card dots */}
          <div className="flex justify-center gap-1.5 flex-wrap">
            {activeCards.map((_, i) => (
              <button
                key={i}
                onClick={() => { if (mode === "browse") { setCurrentIndex(i); setFlipped(false); } }}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  i === currentIndex
                    ? "bg-primary"
                    : mode === "quiz" && results[i] === "correct"
                    ? "bg-success"
                    : mode === "quiz" && results[i] === "wrong"
                    ? "bg-destructive"
                    : "bg-border"
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardGenerator;
