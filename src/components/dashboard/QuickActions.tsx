import { Link } from "react-router-dom";
import { BookOpen, FileUp, FileText, FilePlus, Network } from "lucide-react";

const actions = [
  { to: "/study-mode", icon: BookOpen, label: "Start Study", color: "bg-primary/10 text-primary" },
  { to: "/pdf-summarizer", icon: FileUp, label: "Upload PDF", color: "bg-success/10 text-success" },
  { to: "/mind-map", icon: Network, label: "Mind Map", color: "bg-warning/10 text-warning" },
  { to: "/pdf-builder", icon: FilePlus, label: "Create PDF", color: "bg-destructive/10 text-destructive" },
  { to: "/notes", icon: FileText, label: "Notes", color: "bg-accent text-accent-foreground" },
];

const QuickActions = () => (
  <div className="space-y-3">
    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quick Actions</h2>
    <div className="grid grid-cols-5 gap-2.5">
      {actions.map(({ to, icon: Icon, label, color }) => (
        <Link key={to} to={to} className="group">
          <div className="flex flex-col items-center gap-2.5 p-3.5 rounded-2xl bg-card border border-border/50 hover:shadow-premium hover:border-primary/25 transition-all duration-300">
            <div className={`rounded-2xl p-3 ${color} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-semibold text-foreground text-center leading-tight">{label}</span>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default QuickActions;
