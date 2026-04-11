import { Link } from "react-router-dom";
import { ClipboardList, FileUp, RotateCcw } from "lucide-react";
import { MotionCard, MotionIcon, StaggerContainer, StaggerItem } from "@/components/ui/motion";

const actions = [
  {
    to: "/practice-exam",
    icon: ClipboardList,
    label: "Practice Exam",
    description: "CBT & theory questions",
    color: "bg-primary/10 text-primary",
    emoji: "🧠",
  },
  {
    to: "/pdf-summarizer",
    icon: FileUp,
    label: "Upload Slides → Exam",
    description: "Turn notes into questions",
    color: "bg-success/10 text-success",
    emoji: "📄",
  },
  {
    to: "/planner",
    icon: RotateCcw,
    label: "Quick Revision",
    description: "Structured study plan",
    color: "bg-warning/10 text-warning",
    emoji: "⚡",
  },
];

const MainActions = () => (
  <div className="space-y-3">
    <h2 className="text-lg font-display font-bold text-foreground">What do you want to prepare for today?</h2>
    <StaggerContainer className="grid grid-cols-1 gap-3">
      {actions.map(({ to, icon: Icon, label, description, color, emoji }) => (
        <StaggerItem key={to}>
          <Link to={to}>
            <MotionCard className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border/50 cursor-pointer">
              <MotionIcon className={`rounded-2xl p-3.5 ${color} shrink-0`}>
                <Icon className="h-6 w-6" />
              </MotionIcon>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground block">{emoji} {label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
            </MotionCard>
          </Link>
        </StaggerItem>
      ))}
    </StaggerContainer>
  </div>
);

export default MainActions;
