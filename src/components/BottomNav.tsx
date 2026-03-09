import { Link, useLocation } from "react-router-dom";
import { Home, Lightbulb, FileText, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/study", icon: Lightbulb, label: "Study" },
  { to: "/notes", icon: FileText, label: "Notes" },
  { to: "/pomodoro", icon: Clock, label: "Focus" },
  { to: "/progress", icon: TrendingUp, label: "Progress" },
];

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t-0 pb-safe-area">
      <div className="flex items-center justify-around max-w-lg mx-auto px-1 sm:px-2 py-2 safe-area-bottom">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className="relative flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1.5 min-w-[48px] sm:min-w-[56px] touch-manipulation"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-2xl bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="relative z-10"
              >
                <Icon className={cn("h-5 w-5 sm:h-5 sm:w-5 transition-colors duration-200", active ? "text-primary" : "text-muted-foreground")} />
              </motion.div>
              <span className={cn("text-[9px] sm:text-[10px] font-semibold tracking-wide relative z-10 transition-colors duration-200", active ? "text-primary" : "text-muted-foreground")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
