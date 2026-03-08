import { Link } from "react-router-dom";
import { BookOpen, FileUp, FileText, FilePlus, GraduationCap } from "lucide-react";

const actions = [
  { to: "/study-mode", icon: BookOpen, label: "Start Study", color: "bg-primary/10 text-primary" },
  { to: "/pdf-summarizer", icon: FileUp, label: "Upload PDF", color: "bg-success/10 text-success" },
  { to: "/notes", icon: FileText, label: "Summarize Notes", color: "bg-warning/10 text-warning" },
  { to: "/pdf-builder", icon: FilePlus, label: "Create PDF", color: "bg-destructive/10 text-destructive" },
  { to: "/lecture-capture", icon: GraduationCap, label: "Lecture Mode", color: "bg-accent text-accent-foreground" },
];

const QuickActions = () => (
  <div className="space-y-2">
    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick Actions</h2>
    <div className="grid grid-cols-5 gap-2">
      {actions.map(({ to, icon: Icon, label, color }) => (
        <Link key={to} to={to} className="group">
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/60 hover:shadow-md hover:border-primary/30 transition-all duration-200">
            <div className={`rounded-xl p-2.5 ${color} group-hover:scale-110 transition-transform duration-200`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium text-foreground text-center leading-tight">{label}</span>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default QuickActions;
