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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 glass-strong px-4 py-3.5 flex items-center gap-2.5">
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-1.5 shadow-sm">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-lg font-display font-bold text-foreground tracking-tight flex-1">StudyFlow</h1>
        {isPremium ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-warning bg-warning/10 px-2.5 py-1 rounded-full border border-warning/20">
            <Crown className="h-3 w-3" /> PRO
          </span>
        ) : (
          <Button variant="ghost" size="sm" onClick={promptUpgrade} className="gap-1 text-xs text-warning hover:text-warning hover:bg-warning/10 shrink-0 px-2.5 rounded-xl">
            <Crown className="h-3.5 w-3.5" /> Pro
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="shrink-0 rounded-xl hover:bg-muted">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} className="shrink-0 rounded-xl hover:bg-muted">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <NotificationBell />
        <Link to="/profile">
          <Button variant="ghost" size="icon" className="shrink-0 rounded-xl hover:bg-muted">
            <UserCircle className="h-5 w-5" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={handleSignOut} className="shrink-0 rounded-xl hover:bg-muted">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="flex-1 pb-24 overflow-y-auto">
        <Outlet />
      </main>

      <BottomNav />
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <UpgradeDialog />
    </div>
  );
};

export default AppLayout;
