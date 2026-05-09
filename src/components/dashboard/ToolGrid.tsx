import { Link } from "react-router-dom";
import { Bell, Timer, GraduationCap, ArrowRight, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MotionCard, MotionIcon, StaggerContainer, StaggerItem } from "@/components/ui/motion";

interface Tool {
  to: string;
  icon: typeof Bell;
  title: string;
  color: string;
}

// Only stable supporting utilities — primary actions live in MainActions.
const tools: Tool[] = [
  { to: "/reminders", icon: Bell, title: "Reminders", color: "bg-destructive/10 text-destructive" },
  { to: "/pomodoro", icon: Timer, title: "Focus Timer", color: "bg-primary/10 text-primary" },
  { to: "/history", icon: Layers, title: "Library", color: "bg-success/10 text-success" },
];

const ToolGrid = () => {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quick Tools</h2>
      <StaggerContainer className="grid grid-cols-3 gap-3" delay={0.1}>
        {tools.map(({ to, icon: Icon, title, color }) => (
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
        ))}
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
