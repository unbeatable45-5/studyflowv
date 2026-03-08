import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import { BookOpen } from "lucide-react";

const AppLayout = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b px-4 py-3 flex items-center gap-2">
        <div className="bg-primary rounded-lg p-1.5">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-lg font-display font-bold text-foreground">Student Hub</h1>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  );
};

export default AppLayout;
