import { Link, useLocation } from "react-router-dom";
import { Home, Lightbulb, TrendingUp, MoreHorizontal, FileText, Clock, Layers, Calendar, FileUp, Brain, BookOpen, ClipboardList, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

const mainNavItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/history", icon: Layers, label: "Library" },
  { to: "/progress", icon: TrendingUp, label: "Progress" },
  { to: "/profile", icon: FileText, label: "Profile" },
];

const moreItems = [
  { to: "/practice-exam", icon: ClipboardList, label: "Practice Exam" },
  { to: "/ai-tutor", icon: Bot, label: "AI Tutor" },
  { to: "/notes", icon: FileText, label: "Notes" },
  { to: "/pomodoro", icon: Clock, label: "Focus Timer" },
  { to: "/flashcards", icon: Layers, label: "Flashcards" },
  { to: "/planner", icon: Calendar, label: "Revision Planner" },
  { to: "/pdf-summarizer", icon: FileUp, label: "PDF Summarizer" },
  { to: "/mind-map", icon: Brain, label: "Mind Map" },
  { to: "/spaced-review", icon: BookOpen, label: "Spaced Review" },
];

const BottomNav = () => {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = moreItems.some(item => pathname === item.to);

  return (
    <>
      <motion.nav
        initial={{ y: 60, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-t border-border/30 shadow-[0_-4px_24px_-6px_hsl(var(--primary)/0.08)] pb-safe-area"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto px-1 sm:px-2 py-2 safe-area-bottom">
          {mainNavItems.map(({ to, icon: Icon, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => { if (navigator.vibrate) navigator.vibrate(10); }}
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
                  animate={active ? { scale: [1, 1.25, 0.95, 1.05, 1], y: [0, -4, 1, -1, 0] } : { scale: 1, y: 0 }}
                  transition={active ? { duration: 0.4, ease: "easeOut" } : { duration: 0.2 }}
                  className="relative z-10"
                >
                  <Icon className={cn("h-5 w-5 transition-colors duration-200", active ? "text-primary" : "text-muted-foreground")} />
                </motion.div>
                <span className={cn("text-[9px] sm:text-[10px] font-semibold tracking-wide relative z-10 transition-colors duration-200", active ? "text-primary" : "text-muted-foreground")}>{label}</span>
                <AnimatePresence>
                  {active && (
                    <motion.div
                      layoutId="nav-dot"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
          {/* More button */}
          <button
            onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setMoreOpen(true); }}
            className="relative flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1.5 min-w-[48px] sm:min-w-[56px] touch-manipulation"
          >
            {isMoreActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute inset-0 rounded-2xl bg-primary/10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <motion.div
              whileTap={{ scale: 0.85 }}
              animate={isMoreActive ? { scale: [1, 1.25, 0.95, 1.05, 1], y: [0, -4, 1, -1, 0] } : { scale: 1, y: 0 }}
              transition={isMoreActive ? { duration: 0.4, ease: "easeOut" } : { duration: 0.2 }}
              className="relative z-10"
            >
              <MoreHorizontal className={cn("h-5 w-5 transition-colors duration-200", isMoreActive ? "text-primary" : "text-muted-foreground")} />
            </motion.div>
            <span className={cn("text-[9px] sm:text-[10px] font-semibold tracking-wide relative z-10 transition-colors duration-200", isMoreActive ? "text-primary" : "text-muted-foreground")}>More</span>
          </button>
        </div>
      </motion.nav>

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="px-4 pb-8 pt-2 max-h-[70vh]">
          <DrawerHeader className="pb-3">
            <DrawerTitle className="text-base font-display">More Tools</DrawerTitle>
          </DrawerHeader>
          <AnimatePresence>
            {moreOpen && (
              <motion.div
                className="grid grid-cols-3 gap-3"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
                }}
              >
                {moreItems.map(({ to, icon: Icon, label }) => {
                  const active = pathname === to;
                  return (
                    <motion.div
                      key={to}
                      variants={{
                        hidden: { opacity: 0, y: 16, scale: 0.9 },
                        visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } },
                      }}
                    >
                      <Link
                        to={to}
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(8);
                          setMoreOpen(false);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors touch-manipulation",
                          active ? "bg-primary/10" : "hover:bg-muted/50 active:bg-muted"
                        )}
                      >
                        <motion.div whileTap={{ scale: 0.85 }}>
                          <Icon className={cn("h-6 w-6", active ? "text-primary" : "text-muted-foreground")} />
                        </motion.div>
                        <span className={cn("text-[10px] font-semibold text-center leading-tight", active ? "text-primary" : "text-muted-foreground")}>{label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default BottomNav;
