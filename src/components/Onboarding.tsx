import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, FileUp, Library, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    icon: BookOpen,
    title: "AI Study Tools",
    description: "Generate summaries, flashcards, quizzes, and revision plans instantly with AI. Just enter a topic or upload your notes.",
    color: "bg-primary/10 text-primary",
    bg: "from-primary/5 to-primary/10",
  },
  {
    icon: FileUp,
    title: "PDF Tools",
    description: "Upload lecture slides or PDFs to get instant AI summaries. Export your study materials as polished PDFs anytime.",
    color: "bg-success/10 text-success",
    bg: "from-success/5 to-success/10",
  },
  {
    icon: Library,
    title: "Smart Study Library",
    description: "All your study outputs are auto-saved and organized by subject. Track your progress and review anytime.",
    color: "bg-warning/10 text-warning",
    bg: "from-warning/5 to-warning/10",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      onComplete();
    }
  };

  const slide = slides[current];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6 animate-fade-in">
      {/* Skip */}
      <button
        onClick={onComplete}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-2"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="max-w-sm w-full flex flex-col items-center text-center gap-8">
        {/* Icon */}
        <div className={cn("rounded-3xl p-6 bg-gradient-to-br", slide.bg)}>
          <div className={cn("rounded-2xl p-5", slide.color)}>
            <Icon className="h-12 w-12" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h2 className="text-2xl font-display font-bold text-foreground">{slide.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{slide.description}</p>
        </div>

        {/* Dots */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === current ? "w-6 bg-primary" : "w-2 bg-border"
              )}
            />
          ))}
        </div>

        {/* Button */}
        <Button onClick={next} className="w-full gap-2" size="lg">
          {current < slides.length - 1 ? (
            <>Continue <ArrowRight className="h-4 w-4" /></>
          ) : (
            "Get Started 🚀"
          )}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
