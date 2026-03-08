import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { calculateNextReview, qualityFromResult } from "@/lib/spaced-repetition";
import { toast } from "@/hooks/use-toast";
import {
  Brain, CheckCircle2, XCircle, Trophy, RotateCcw,
  Loader2, Clock, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";

interface ReviewCard {
  id: string;
  card_front: string;
  card_back: string;
  topic: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
}

const SpacedReview = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<(boolean | null)[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("flashcard_reviews" as any)
      .select("id, card_front, card_back, topic, ease_factor, interval_days, repetitions")
      .eq("user_id", user.id)
      .lte("next_review_at", new Date().toISOString())
      .order("next_review_at", { ascending: true })
      .limit(20)
      .then(({ data, error }) => {
        if (error) {
          toast({ title: "Error loading reviews", variant: "destructive" });
        }
        const reviewCards = (data ?? []) as unknown as ReviewCard[];
        setCards(reviewCards);
        setResults(new Array(reviewCards.length).fill(null));
        setLoading(false);
      });
  }, [user]);

  const markResult = async (correct: boolean) => {
    const card = cards[currentIndex];
    const quality = qualityFromResult(correct);
    const result = calculateNextReview(quality, {
      easeFactor: card.ease_factor,
      intervalDays: card.interval_days,
      repetitions: card.repetitions,
    });

    const nextReview = addDays(new Date(), result.intervalDays);

    await supabase
      .from("flashcard_reviews" as any)
      .update({
        ease_factor: result.easeFactor,
        interval_days: result.intervalDays,
        repetitions: result.repetitions,
        next_review_at: nextReview.toISOString(),
        last_reviewed_at: new Date().toISOString(),
      } as any)
      .eq("id", card.id);

    const newResults = [...results];
    newResults[currentIndex] = correct;
    setResults(newResults);

    if (currentIndex < cards.length - 1) {
      setTimeout(() => {
        setFlipped(false);
        setCurrentIndex((i) => i + 1);
      }, 300);
    } else {
      setFinished(true);
    }
  };

  const correctCount = results.filter((r) => r === true).length;
  const answeredCount = results.filter((r) => r !== null).length;
  const scorePercent = cards.length > 0 ? Math.round((correctCount / cards.length) * 100) : 0;

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-2">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold">Spaced Review</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Review cards at optimal intervals for long-term retention.
        </p>
      </div>

      {cards.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-display font-semibold">No cards due!</h2>
            <p className="text-sm text-muted-foreground">
              Generate flashcards first, then they'll appear here for spaced review.
            </p>
            <Button variant="outline" asChild>
              <a href="/flashcards">Go to Flashcards</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {finished && cards.length > 0 && (
        <Card className="animate-fade-in border-2 border-primary/20">
          <CardContent className="p-6 text-center space-y-4">
            <Trophy className="h-12 w-12 mx-auto text-warning" />
            <h2 className="text-2xl font-display font-bold">Review Complete!</h2>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-primary">{scorePercent}%</p>
              <p className="text-sm text-muted-foreground">
                {correctCount} of {cards.length} correct
              </p>
              <Progress value={scorePercent} className="h-3" />
            </div>
            <p className="text-sm text-muted-foreground">
              {scorePercent === 100
                ? "Perfect recall! 🧠"
                : scorePercent >= 70
                ? "Great memory! Cards you missed will appear sooner."
                : "Keep reviewing — spaced repetition will help!"}
            </p>
          </CardContent>
        </Card>
      )}

      {cards.length > 0 && !finished && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {cards[currentIndex].topic}
            </span>
          </div>

          <Progress value={(answeredCount / cards.length) * 100} className="h-2" />

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
              <Card
                className="absolute inset-0 flex items-center justify-center p-6 border-2 border-primary/20 bg-card"
                style={{ backfaceVisibility: "hidden" }}
              >
                <CardContent className="text-center p-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Question</p>
                  <p className="text-lg font-medium text-foreground">{cards[currentIndex].card_front}</p>
                  <p className="text-xs text-muted-foreground mt-4">Tap to reveal</p>
                </CardContent>
              </Card>

              <Card
                className="absolute inset-0 flex items-center justify-center p-6 border-2 border-success/20 bg-card [transform:rotateY(180deg)]"
                style={{ backfaceVisibility: "hidden" }}
              >
                <CardContent className="text-center p-0">
                  <p className="text-xs uppercase tracking-wider text-success mb-3">Answer</p>
                  <p className="text-lg font-medium text-foreground">{cards[currentIndex].card_back}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {flipped && results[currentIndex] === null && (
            <div className="flex gap-3 justify-center animate-fade-in">
              <Button
                variant="outline"
                onClick={() => markResult(false)}
                className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4" /> Again
              </Button>
              <Button
                onClick={() => markResult(true)}
                className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground"
              >
                <CheckCircle2 className="h-4 w-4" /> Got it
              </Button>
            </div>
          )}

          <div className="flex justify-center gap-1.5 flex-wrap">
            {cards.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  i === currentIndex
                    ? "bg-primary"
                    : results[i] === true
                    ? "bg-success"
                    : results[i] === false
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

export default SpacedReview;
