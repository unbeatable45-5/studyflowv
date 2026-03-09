import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import BottomNav from "./BottomNav";
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

const AppLayout = () => {
  const { signOut } = useAuth();
  const { isPremium, promptUpgrade } = usePremium();
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

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      <header className="sticky top-0 z-40 glass-strong px-3 sm:px-4 py-3 sm:py-3.5 flex items-center gap-1.5 sm:gap-2.5 safe-area-top">
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-1.5 shadow-sm shrink-0">
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
        </div>
        <h1 className="text-base sm:text-lg font-display font-bold text-foreground tracking-tight flex-1 truncate">StudyFlow</h1>
        {isPremium ? (
          <span className="hidden xs:flex items-center gap-1 text-[10px] font-bold text-warning bg-warning/10 px-2 sm:px-2.5 py-1 rounded-full border border-warning/20">
            <Crown className="h-3 w-3" /> PRO
          </span>
        ) : (
          <Button variant="ghost" size="sm" onClick={promptUpgrade} className="gap-1 text-xs text-warning hover:text-warning hover:bg-warning/10 shrink-0 px-2 rounded-xl h-8">
            <Crown className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Pro</span>
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="shrink-0 rounded-xl hover:bg-muted h-8 w-8 sm:h-10 sm:w-10">
          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} className="shrink-0 rounded-xl hover:bg-muted h-8 w-8 sm:h-10 sm:w-10">
          {dark ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
        </Button>
        <NotificationBell />
        <Link to="/profile">
          <Button variant="ghost" size="icon" className="shrink-0 rounded-xl hover:bg-muted h-8 w-8 sm:h-10 sm:w-10">
            <UserCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={handleSignOut} className="shrink-0 rounded-xl hover:bg-muted h-8 w-8 sm:h-10 sm:w-10">
          <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </header>

      <main className="flex-1 pb-20 sm:pb-24 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>

      <BottomNav />
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <UpgradeDialog />
    </div>
  );
};

export default AppLayout;
