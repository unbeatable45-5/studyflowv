import { Link } from "react-router-dom";
import { FolderOpen, Calculator, Leaf, Atom, Code } from "lucide-react";

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
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">My Study Library</h2>
      </div>
      <Link to="/organizer" className="text-xs text-primary hover:underline">Browse all</Link>
    </div>
    <div className="grid grid-cols-4 gap-3">
      {subjects.map(({ label, icon: Icon, color }) => (
        <Link key={label} to={`/organizer?subject=${encodeURIComponent(label)}`}>
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/60 hover:shadow-md hover:border-primary/30 transition-all duration-200">
            <div className={`rounded-lg p-2.5 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-foreground">{label}</span>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default StudyLibrary;
