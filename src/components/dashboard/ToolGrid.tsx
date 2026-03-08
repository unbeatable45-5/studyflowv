import { Link } from "react-router-dom";
import { Lightbulb, CalendarDays, Layers, FileDown, Bell, Timer, GraduationCap, ArrowRight, Brain, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { usePremium, PremiumFeature } from "@/contexts/PremiumContext";

interface Tool {
  to: string;
  icon: typeof Lightbulb;
  title: string;
  color: string;
  premiumFeature?: PremiumFeature;
}

const tools: Tool[] = [
  { to: "/study", icon: Lightbulb, title: "Quick Study", color: "bg-primary/10 text-primary" },
  { to: "/planner", icon: CalendarDays, title: "Revision Planner", color: "bg-warning/10 text-warning" },
  { to: "/flashcards", icon: Layers, title: "Flashcards", color: "bg-accent text-accent-foreground" },
  { to: "/spaced-review", icon: Brain, title: "Spaced Review", color: "bg-success/10 text-success", premiumFeature: "spaced_repetition" },
  { to: "/lecture-capture", icon: GraduationCap, title: "Lecture Capture", color: "bg-success/10 text-success" },
  { to: "/pdf-export", icon: FileDown, title: "PDF Export", color: "bg-destructive/10 text-destructive" },
  { to: "/reminders", icon: Bell, title: "Reminders", color: "bg-destructive/10 text-destructive" },
  { to: "/pomodoro", icon: Timer, title: "Pomodoro", color: "bg-primary/10 text-primary" },
];

const ToolGrid = () => {
  const { canAccess, promptUpgrade } = usePremium();

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">More Tools</h2>
      <div className="grid grid-cols-4 gap-3">
        {tools.map(({ to, icon: Icon, title, color, premiumFeature }) => {
          const locked = premiumFeature && !canAccess(premiumFeature);
          
          if (locked) {
            return (
              <button key={to} onClick={promptUpgrade} className="text-left">
                <div className="relative flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/60 hover:border-warning/30 transition-all duration-200 opacity-70">
                  <div className="absolute top-1.5 right-1.5">
                    <Lock className="h-3 w-3 text-warning" />
                  </div>
                  <div className={`rounded-xl p-2.5 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-medium text-foreground text-center leading-tight">{title}</span>
                </div>
              </button>
            );
          }
          
          return (
            <Link key={to} to={to}>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/60 hover:shadow-md hover:border-primary/30 transition-all duration-200">
                <div className={`rounded-xl p-2.5 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium text-foreground text-center leading-tight">{title}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Tutorial Link */}
      <Link to="/tutorial">
        <Card className="bg-accent border-accent hover:shadow-md transition-shadow cursor-pointer mt-3">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl p-3 bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-accent-foreground text-sm">Getting Started</h3>
              <p className="text-xs text-muted-foreground">Learn how to use StudyFlow</p>
            </div>
            <ArrowRight className="h-4 w-4 text-accent-foreground shrink-0" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default ToolGrid;
