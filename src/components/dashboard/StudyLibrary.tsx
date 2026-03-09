import { Link } from "react-router-dom";
import { FolderOpen, Calculator, Leaf, Atom, Code } from "lucide-react";
import { MotionCard, MotionIcon, StaggerContainer, StaggerItem } from "@/components/ui/motion";

const subjects = [
  { label: "Math", icon: Calculator, color: "bg-primary/10 text-primary" },
  { label: "Biology", icon: Leaf, color: "bg-success/10 text-success" },
  { label: "Chemistry", icon: Atom, color: "bg-warning/10 text-warning" },
  { label: "CS", icon: Code, color: "bg-accent text-accent-foreground" },
];

const StudyLibrary = () => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">My Study Library</h2>
      </div>
      <Link to="/organizer" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">Browse all</Link>
    </div>
    <StaggerContainer className="grid grid-cols-4 gap-3" delay={0.15}>
      {subjects.map(({ label, icon: Icon, color }) => (
        <StaggerItem key={label}>
          <Link to={`/organizer?subject=${encodeURIComponent(label)}`}>
            <MotionCard className="flex flex-col items-center gap-2.5 p-3.5 rounded-2xl bg-card border border-border/50 cursor-pointer">
              <MotionIcon className={`rounded-xl p-2.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </MotionIcon>
              <span className="text-xs font-semibold text-foreground">{label}</span>
            </MotionCard>
          </Link>
        </StaggerItem>
      ))}
    </StaggerContainer>
  </div>
);

export default StudyLibrary;
