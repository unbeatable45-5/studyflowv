import { Link } from "react-router-dom";
import { Lightbulb, CalendarDays, Layers, FileDown, Bell, Timer, GraduationCap, ArrowRight, Brain, Lock, Network, Clock as ClockIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { usePremium, PremiumFeature } from "@/contexts/PremiumContext";
import { MotionCard, MotionIcon, StaggerContainer, StaggerItem, MotionButton } from "@/components/ui/motion";
import { Badge } from "@/components/ui/badge";

interface Tool {
  to: string;
  icon: typeof Lightbulb;
  title: string;
  color: string;
  premiumFeature?: PremiumFeature;
  comingSoon?: boolean;
}

const tools: Tool[] = [
  { to: "/study", icon: Lightbulb, title: "Quick Study", color: "bg-primary/10 text-primary" },
  { to: "/planner", icon: CalendarDays, title: "Revision Planner", color: "bg-warning/10 text-warning" },
  { to: "/flashcards", icon: Layers, title: "Flashcards", color: "bg-accent text-accent-foreground" },
  { to: "/mind-map", icon: Network, title: "Mind Maps", color: "bg-primary/10 text-primary" },
  { to: "/spaced-review", icon: Brain, title: "Spaced Review", color: "bg-success/10 text-success", premiumFeature: "spaced_repetition" },
  { to: "#", icon: GraduationCap, title: "Lecture Capture", color: "bg-muted text-muted-foreground", comingSoon: true },
  { to: "/pdf-export", icon: FileDown, title: "PDF Export", color: "bg-destructive/10 text-destructive" },
  { to: "/reminders", icon: Bell, title: "Reminders", color: "bg-destructive/10 text-destructive" },
  { to: "/pomodoro", icon: Timer, title: "Pomodoro", color: "bg-primary/10 text-primary" },
];

const ToolGrid = () => {
  const { canAccess, promptUpgrade } = usePremium();

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">More Tools</h2>
      <StaggerContainer className="grid grid-cols-4 gap-3" delay={0.1}>
        {tools.map(({ to, icon: Icon, title, color, premiumFeature }) => {
          const locked = premiumFeature && !canAccess(premiumFeature);
          
          if (locked) {
            return (
              <StaggerItem key={to}>
                <button onClick={promptUpgrade} className="text-left w-full">
                  <MotionCard className="relative flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/50 opacity-70 cursor-pointer">
                    <div className="absolute top-1.5 right-1.5">
                      <Lock className="h-3 w-3 text-warning" />
                    </div>
                    <MotionIcon className={`rounded-2xl p-2.5 ${color}`}>
                      <Icon className="h-5 w-5" />
                    </MotionIcon>
                    <span className="text-[10px] font-semibold text-foreground text-center leading-tight">{title}</span>
                  </MotionCard>
                </button>
              </StaggerItem>
            );
          }
          
          return (
            <StaggerItem key={to}>
              <Link to={to}>
                <MotionCard className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/50 cursor-pointer">
                  <MotionIcon className={`rounded-2xl p-2.5 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </MotionIcon>
                  <span className="text-[10px] font-semibold text-foreground text-center leading-tight">{title}</span>
                </MotionCard>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Tutorial Link */}
      <Link to="/tutorial">
        <MotionCard className="mt-3">
          <Card className="bg-accent border-accent cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <MotionIcon className="rounded-2xl p-3 bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </MotionIcon>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-accent-foreground text-sm">Getting Started</h3>
                <p className="text-xs text-muted-foreground">Learn how to use StudyFlow</p>
              </div>
              <ArrowRight className="h-4 w-4 text-accent-foreground shrink-0" />
            </CardContent>
          </Card>
        </MotionCard>
      </Link>
    </div>
  );
};

export default ToolGrid;
