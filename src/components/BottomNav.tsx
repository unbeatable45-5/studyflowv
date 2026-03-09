import { Link, useLocation } from "react-router-dom";
import { Home, Lightbulb, FileText, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/study", icon: Lightbulb, label: "Study" },
  { to: "/notes", icon: FileText, label: "Notes" },
  { to: "/groups", icon: Users, label: "Groups" },
  { to: "/progress", icon: TrendingUp, label: "Progress" },
];

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t-0">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-2.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-all duration-300 min-w-[56px]",
                active
                  ? "text-primary bg-primary/10 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-transform duration-300", active && "scale-110")} />
              <span className={cn("text-[10px] font-semibold tracking-wide", active && "text-primary")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
