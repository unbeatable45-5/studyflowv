import { useState, useEffect } from "react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Download, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GreetingSection from "@/components/dashboard/GreetingSection";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import StudyLibrary from "@/components/dashboard/StudyLibrary";
import DailyChallenge from "@/components/dashboard/DailyChallenge";
import ToolGrid from "@/components/dashboard/ToolGrid";
import StreakWidget from "@/components/dashboard/StreakWidget";
import NotificationPrompt from "@/components/dashboard/NotificationPrompt";
import UpgradePrompt from "@/components/dashboard/UpgradePrompt";
import Onboarding from "@/components/Onboarding";

const Index = () => {
  const { canInstall, install } = usePwaInstall();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("onboarding_completed");
    if (!seen) setShowOnboarding(true);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return (
    <div className="px-4 py-8 max-w-lg mx-auto space-y-7 animate-fade-in">
      <GreetingSection />

      <StreakWidget />

      {canInstall && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/30 overflow-hidden shadow-premium">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-2xl p-3 bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-foreground text-sm">Install StudyFlow</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Add to home screen for native experience</p>
            </div>
            <Button size="sm" onClick={install} className="gap-1.5 shrink-0 rounded-xl">
              <Download className="h-4 w-4" /> Install
            </Button>
          </CardContent>
        </Card>
      )}

      <NotificationPrompt />

      <QuickActions />
      <DailyChallenge />
      <RecentActivity />
      <StudyLibrary />
      <ToolGrid />
      <UpgradePrompt />
    </div>
  );
};

export default Index;
