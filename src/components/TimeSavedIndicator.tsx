import { Zap } from "lucide-react";

interface TimeSavedIndicatorProps {
  wordCount: number;
  type?: "summary" | "flashcards" | "quiz" | "exam";
}

const TimeSavedIndicator = ({ wordCount, type = "summary" }: TimeSavedIndicatorProps) => {
  // Rough estimates: reading ~250 wpm, summarizing takes 3-4x reading time
  const readMinutes = Math.ceil(wordCount / 250);
  const multiplier = type === "summary" ? 3 : type === "flashcards" ? 4 : type === "exam" ? 5 : 2;
  const savedMinutes = Math.max(5, readMinutes * multiplier);

  const display = savedMinutes >= 60
    ? `${(savedMinutes / 60).toFixed(1)} hours`
    : `${savedMinutes} minutes`;

  return (
    <div className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/5 border border-primary/10 rounded-lg px-3 py-1.5">
      <Zap className="h-3.5 w-3.5" />
      <span>⚡ This saved you ~{display} of study time</span>
    </div>
  );
};

export default TimeSavedIndicator;
