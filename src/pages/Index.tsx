import { useState, useEffect, useCallback } from "react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import PullToRefresh from "@/components/PullToRefresh";
import PageSkeleton from "@/components/PageSkeleton";
import { Download, Smartphone, Share, MoreVertical, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import GreetingSection from "@/components/dashboard/GreetingSection";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import StudyLibrary from "@/components/dashboard/StudyLibrary";
import DailyChallenge from "@/components/dashboard/DailyChallenge";
import StreakWidget from "@/components/dashboard/StreakWidget";
import NotificationPrompt from "@/components/dashboard/NotificationPrompt";
import UpgradePrompt from "@/components/dashboard/UpgradePrompt";
import ReferralWidget from "@/components/dashboard/ReferralWidget";
import UsageDashboard from "@/components/dashboard/UsageDashboard";
import Onboarding from "@/components/Onboarding";
import { FadeIn } from "@/components/ui/motion";

const Index = () => {
  const { canInstall, install, platform, showIOSGuide, dismissGuide } = usePwaInstall();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("onboarding_completed");
    if (!seen) setShowOnboarding(true);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsRefreshing(false);
  }, []);

  if (showOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  if (isRefreshing) {
    return (
      <div className="px-3 sm:px-4 py-6 sm:py-8 max-w-lg mx-auto">
        <PageSkeleton variant="dashboard" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="px-3 sm:px-4 py-6 sm:py-8 max-w-lg mx-auto space-y-5 sm:space-y-7">
      <FadeIn><GreetingSection /></FadeIn>

      <FadeIn delay={0.05}><StreakWidget /></FadeIn>

      {canInstall && (
        <FadeIn delay={0.1}>
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/30 overflow-hidden shadow-premium">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="rounded-2xl p-2.5 sm:p-3 bg-primary/10 text-primary shrink-0">
                <Smartphone className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-foreground text-sm">Install StudyFlow</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {platform === "ios-safari"
                    ? "Add to Home Screen from Safari"
                    : "Add to home screen for native experience"}
                </p>
              </div>
              <Button size="sm" onClick={install} className="gap-1.5 shrink-0 rounded-xl text-xs sm:text-sm">
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Install
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* iOS / manual install guide dialog */}
      <Dialog open={showIOSGuide} onOpenChange={dismissGuide}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Install StudyFlow</DialogTitle>
            <DialogDescription>
              Follow these steps to add StudyFlow to your home screen:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {platform === "ios-safari" ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-xl p-2 shrink-0">
                    <Share className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">1. Tap the Share button</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Find the share icon (square with arrow) at the bottom of Safari
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-xl p-2 shrink-0">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">2. Add to Home Screen</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Scroll down and tap "Add to Home Screen"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-xl p-2 shrink-0">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">3. Tap "Add"</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Confirm by tapping Add in the top right
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-xl p-2 shrink-0">
                    <MoreVertical className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">1. Open browser menu</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tap the three-dot menu (⋮) in your browser
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-xl p-2 shrink-0">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">2. Add to Home Screen</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Look for "Add to Home screen" or "Install app"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-xl p-2 shrink-0">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">3. Confirm</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tap "Add" or "Install" to confirm
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
          <Button onClick={dismissGuide} variant="outline" className="w-full">
            Got it
          </Button>
        </DialogContent>
      </Dialog>

      <FadeIn delay={0.1}><NotificationPrompt /></FadeIn>
      <FadeIn delay={0.15}><MainActions /></FadeIn>
      <FadeIn delay={0.17}><QuickActions /></FadeIn>
      <FadeIn delay={0.18}><UsageDashboard /></FadeIn>
      <FadeIn delay={0.2}><DailyChallenge /></FadeIn>
      <FadeIn delay={0.25}><RecentActivity /></FadeIn>
      <FadeIn delay={0.3}><StudyLibrary /></FadeIn>
      <FadeIn delay={0.35}><ReferralWidget /></FadeIn>
      <FadeIn delay={0.4}><UpgradePrompt /></FadeIn>
    </PullToRefresh>
  );
};

export default Index;
