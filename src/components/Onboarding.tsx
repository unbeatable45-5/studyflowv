import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, FileUp, Library, Brain, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const slides = [
  {
    icon: BookOpen,
    title: "AI Study Tools",
    description: "Generate summaries, flashcards, quizzes, and revision plans instantly with AI. Just enter a topic or upload your notes.",
    color: "text-primary",
    bg: "from-primary/10 to-primary/20",
    iconBg: "bg-primary/15",
  },
  {
    icon: FileUp,
    title: "Smart PDF Tools",
    description: "Upload lecture slides or PDFs to get instant AI summaries. Export your study materials as polished PDFs anytime.",
    color: "text-success",
    bg: "from-success/10 to-success/20",
    iconBg: "bg-success/15",
  },
  {
    icon: Brain,
    title: "Practice Exams",
    description: "Take AI-generated CBT exams on any topic. Get instant scores, performance analysis, and share your results.",
    color: "text-destructive",
    bg: "from-destructive/10 to-destructive/20",
    iconBg: "bg-destructive/15",
  },
  {
    icon: Library,
    title: "Smart Study Library",
    description: "All your study outputs are auto-saved and organized by subject. Track your streak, progress, and review anytime.",
    color: "text-warning",
    bg: "from-warning/10 to-warning/20",
    iconBg: "bg-warning/15",
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

  const prev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const slide = slides[current];
  const Icon = slide.icon;
  const progress = ((current + 1) / slides.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-between px-6 py-8 safe-area-top safe-area-bottom">
      {/* Top bar */}
      <div className="w-full max-w-sm flex items-center justify-between">
        <Progress value={progress} className="flex-1 h-1.5 mr-4" />
        <button
          onClick={onComplete}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="max-w-sm w-full flex flex-col items-center text-center gap-6 flex-1 justify-center">
        <div className={cn("rounded-3xl p-8 bg-gradient-to-br transition-all duration-500", slide.bg)}>
          <div className={cn("rounded-2xl p-5", slide.iconBg, slide.color)}>
            <Icon className="h-14 w-14" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Step {current + 1} of {slides.length}
          </p>
          <h2 className="text-2xl font-display font-bold text-foreground">{slide.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{slide.description}</p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="max-w-sm w-full space-y-3">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === current ? "w-8 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {current > 0 && (
            <Button variant="outline" onClick={prev} size="lg" className="px-6">
              Back
            </Button>
          )}
          <Button onClick={next} className="flex-1 gap-2" size="lg">
            {current < slides.length - 1 ? (
              <>Continue <ArrowRight className="h-4 w-4" /></>
            ) : (
              "Get Started 🚀"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
