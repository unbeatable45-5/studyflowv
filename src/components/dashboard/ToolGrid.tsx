import { Link } from "react-router-dom";
import { Lightbulb, CalendarDays, Layers, FileDown, Bell, Timer, GraduationCap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const tools = [
  { to: "/study", icon: Lightbulb, title: "Quick Study", color: "bg-primary/10 text-primary" },
  { to: "/planner", icon: CalendarDays, title: "Revision Planner", color: "bg-warning/10 text-warning" },
  { to: "/flashcards", icon: Layers, title: "Flashcards", color: "bg-accent text-accent-foreground" },
  { to: "/pdf-export", icon: FileDown, title: "PDF Export", color: "bg-destructive/10 text-destructive" },
  { to: "/reminders", icon: Bell, title: "Reminders", color: "bg-destructive/10 text-destructive" },
  { to: "/pomodoro", icon: Timer, title: "Pomodoro", color: "bg-success/10 text-success" },
];

const ToolGrid = () => (
  <div className="space-y-3">
    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">More Tools</h2>
    <div className="grid grid-cols-3 gap-3">
      {tools.map(({ to, icon: Icon, title, color }) => (
        <Link key={to} to={to}>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/60 hover:shadow-md hover:border-primary/30 transition-all duration-200">
            <div className={`rounded-xl p-2.5 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-foreground text-center">{title}</span>
          </div>
        </Link>
      ))}
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

export default ToolGrid;
