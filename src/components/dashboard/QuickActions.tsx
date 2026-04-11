import { Link } from "react-router-dom";
import { BookOpen, FileText, FilePlus, Network, BrainCircuit } from "lucide-react";
import { MotionCard, MotionIcon, StaggerContainer, StaggerItem } from "@/components/ui/motion";

const actions = [
  { to: "/study-mode", icon: BookOpen, label: "Study Topic", color: "bg-primary/10 text-primary" },
  { to: "/flashcards", icon: BrainCircuit, label: "Flashcards", color: "bg-success/10 text-success" },
  { to: "/mind-map", icon: Network, label: "Mind Map", color: "bg-warning/10 text-warning" },
  { to: "/pdf-builder", icon: FilePlus, label: "Create PDF", color: "bg-destructive/10 text-destructive" },
  { to: "/notes", icon: FileText, label: "Notes", color: "bg-accent text-accent-foreground" },
];

const QuickActions = () => (
  <div className="space-y-3">
    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">More Tools</h2>
    <StaggerContainer className="grid grid-cols-5 gap-2.5">
      {actions.map(({ to, icon: Icon, label, color }) => (
        <StaggerItem key={to}>
          <Link to={to}>
            <MotionCard className="flex flex-col items-center gap-2.5 p-3.5 rounded-2xl bg-card border border-border/50 cursor-pointer">
              <MotionIcon className={`rounded-2xl p-3 ${color}`}>
                <Icon className="h-5 w-5" />
              </MotionIcon>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">{label}</span>
            </MotionCard>
          </Link>
        </StaggerItem>
      ))}
    </StaggerContainer>
  </div>
);

export default QuickActions;
