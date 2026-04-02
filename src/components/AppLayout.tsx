import { Outlet, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import BottomNav from "./BottomNav";
import { AppSidebar } from "./AppSidebar";
import MiniTimer from "./MiniTimer";
import { BookOpen, Moon, Sun, LogOut, UserCircle, Search, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/contexts/PremiumContext";
import NotificationBell from "./NotificationBell";
import GlobalSearch from "./GlobalSearch";
import UpgradeDialog from "./UpgradeDialog";
import { useReminderNotifications } from "@/hooks/use-reminder-notifications";
import { usePaystackVerify } from "@/hooks/use-paystack-verify";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import PageTransition from "./PageTransition";
import { AnimatePresence } from "framer-motion";

const AppLayout = () => {
  const { signOut } = useAuth();
  const { isPremium, promptUpgrade } = usePremium();
  const isMobile = useIsMobile();
  const location = useLocation();
  useReminderNotifications();
  usePaystackVerify(() => window.location.reload());
  const [searchOpen, setSearchOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
  };

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // Mobile layout with bottom navigation
  if (isMobile) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
        <header className="sticky top-0 z-40 glass-strong px-2.5 py-2.5 flex items-center gap-1.5 safe-area-top">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-lg p-1.5 shadow-sm shrink-0">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-sm font-display font-bold text-foreground tracking-tight flex-1 truncate">StudyFlow</h1>
          {isPremium ? (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full border border-warning/20 shrink-0">
              <Crown className="h-2.5 w-2.5" /> PRO
            </span>
          ) : (
            <Button variant="ghost" size="sm" onClick={promptUpgrade} className="gap-0.5 text-[10px] text-warning hover:text-warning hover:bg-warning/10 shrink-0 px-1.5 rounded-lg h-7">
              <Crown className="h-3 w-3" />
              Pro
            </Button>
          )}
          <MiniTimer />
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="shrink-0 rounded-lg hover:bg-muted h-7 w-7">
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleDark} className="shrink-0 rounded-lg hover:bg-muted h-7 w-7">
            {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>
          <NotificationBell />
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="shrink-0 rounded-lg hover:bg-muted h-7 w-7">
              <UserCircle className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="shrink-0 rounded-lg hover:bg-muted h-7 w-7">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </header>

        <main className="flex-1 pb-24 overflow-y-auto overflow-x-hidden overscroll-contain scroll-touch" style={{ WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
        <BottomNav />
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        <UpgradeDialog />
      </div>
    );
  }

  // Desktop/Tablet layout with sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar dark={dark} setDark={setDark} onSearch={() => setSearchOpen(true)} />
        
        <SidebarInset className="flex-1 flex flex-col">
          {/* Desktop header */}
          <header className="h-14 flex items-center gap-3 border-b border-border/50 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="h-8 w-8" />
            <div className="flex-1" />
            <MiniTimer />
            <NotificationBell />
            {isPremium && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-warning bg-warning/10 px-2.5 py-1 rounded-full border border-warning/20">
                <Crown className="h-3 w-3" /> PRO
              </span>
            )}
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <PageTransition key={location.pathname}>
                  <Outlet />
                </PageTransition>
              </AnimatePresence>
            </div>
          </main>
        </SidebarInset>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <UpgradeDialog />
    </SidebarProvider>
  );
};

export default AppLayout;
