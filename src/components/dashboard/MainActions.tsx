import { Link } from "react-router-dom";
import { BookOpen, FileUp, ClipboardList, RotateCcw } from "lucide-react";
import { MotionCard, MotionIcon, StaggerContainer, StaggerItem } from "@/components/ui/motion";

const actions = [
  {
    to: "/study-mode",
    icon: BookOpen,
    label: "Study a Topic",
    description: "AI-powered explanations",
    color: "bg-primary/10 text-primary",
  },
  {
    to: "/pdf-summarizer",
    icon: FileUp,
    label: "Upload PDF",
    description: "Summarize any document",
    color: "bg-success/10 text-success",
  },
  {
    to: "/practice-exam",
    icon: ClipboardList,
    label: "Practice Exam",
    description: "CBT-style questions",
    color: "bg-warning/10 text-warning",
  },
  {
    to: "/planner",
    icon: RotateCcw,
    label: "Quick Revision",
    description: "Structured study plan",
    color: "bg-destructive/10 text-destructive",
  },
];

const MainActions = () => (
  <div className="space-y-3">
    <h2 className="text-lg font-display font-bold text-foreground">What do you want to do today?</h2>
    <StaggerContainer className="grid grid-cols-2 gap-3">
      {actions.map(({ to, icon: Icon, label, description, color }) => (
        <StaggerItem key={to}>
          <Link to={to}>
            <MotionCard className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-card border border-border/50 cursor-pointer min-h-[120px] justify-center">
              <MotionIcon className={`rounded-2xl p-3.5 ${color}`}>
                <Icon className="h-6 w-6" />
              </MotionIcon>
              <div className="text-center">
                <span className="text-sm font-semibold text-foreground block">{label}</span>
                <span className="text-[10px] text-muted-foreground">{description}</span>
              </div>
            </MotionCard>
          </Link>
        </StaggerItem>
      ))}
    </StaggerContainer>
  </div>
);

export default MainActions;
