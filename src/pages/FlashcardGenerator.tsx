import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import OutputActions from "@/components/OutputActions";
import { supabase } from "@/integrations/supabase/client";
import { saveOutput } from "@/lib/saved-outputs";
import { toast } from "@/hooks/use-toast";
import { Layers, Loader2, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Flashcard {
  front: string;
  back: string;
}

const FlashcardGenerator = () => {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState([6]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setCards([]);
    setCurrentIndex(0);
    setFlipped(false);

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
      const msg = e?.message || "Something went wrong";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const prev = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i > 0 ? i - 1 : cards.length - 1));
  };
  const next = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i < cards.length - 1 ? i + 1 : 0));
  };

  const allText = cards
    .map((c, i) => `Card ${i + 1}:\nQ: ${c.front}\nA: ${c.back}`)
    .join("\n\n");

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-purple-500/10 rounded-lg p-2">
            <Layers className="h-5 w-5 text-purple-500" />
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

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}

      {/* Flashcard viewer */}
      {cards.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <OutputActions text={allText} title={`Flashcards: ${topic}`} />
          </div>

          {/* Card */}
          <div
            className="relative cursor-pointer perspective-1000"
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
                className="absolute inset-0 flex items-center justify-center p-6 border-2 border-primary/20 bg-card"
                style={{ backfaceVisibility: "hidden" }}
              >
                <CardContent className="text-center p-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Question</p>
                  <p className="text-lg font-medium text-foreground">{cards[currentIndex].front}</p>
                  <p className="text-xs text-muted-foreground mt-4">Tap to flip</p>
                </CardContent>
              </Card>

              {/* Back */}
              <Card
                className="absolute inset-0 flex items-center justify-center p-6 border-2 border-success/20 bg-card [transform:rotateY(180deg)]"
                style={{ backfaceVisibility: "hidden" }}
              >
                <CardContent className="text-center p-0">
                  <p className="text-xs uppercase tracking-wider text-success mb-3">Answer</p>
                  <p className="text-lg font-medium text-foreground">{cards[currentIndex].back}</p>
                  <p className="text-xs text-muted-foreground mt-4">Tap to flip back</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Navigation */}
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

          {/* Card dots */}
          <div className="flex justify-center gap-1.5">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentIndex(i); setFlipped(false); }}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  i === currentIndex ? "bg-primary" : "bg-border"
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
