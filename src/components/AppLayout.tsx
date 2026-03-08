import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import BottomNav from "./BottomNav";
import { BookOpen, Moon, Sun, LogOut, UserCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import GlobalSearch from "./GlobalSearch";
import { useReminderNotifications } from "@/hooks/use-reminder-notifications";
import { toast } from "@/hooks/use-toast";

const AppLayout = () => {
  const { signOut } = useAuth();
  useReminderNotifications();
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
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b px-4 py-3 flex items-center gap-2">
        <div className="bg-primary rounded-lg p-1.5">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-lg font-display font-bold text-foreground flex-1">Student Hub</h1>
        <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="shrink-0">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} className="shrink-0">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <NotificationBell />
        <Link to="/profile">
          <Button variant="ghost" size="icon" className="shrink-0">
            <UserCircle className="h-5 w-5" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={handleSignOut} className="shrink-0">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};

export default AppLayout;
