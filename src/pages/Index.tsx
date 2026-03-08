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

const Index = () => {
  const { canInstall, install } = usePwaInstall();

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
      <GreetingSection />

      {canInstall && (
        <Card className="border-primary/30 bg-primary/5 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-xl p-3 bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-foreground text-sm">Install StudyFlow</h3>
              <p className="text-xs text-muted-foreground">Add to home screen for native experience</p>
            </div>
            <Button size="sm" onClick={install} className="gap-1.5 shrink-0">
              <Download className="h-4 w-4" /> Install
            </Button>
          </CardContent>
        </Card>
      )}

      <QuickActions />
      <DailyChallenge />
      <RecentActivity />
      <StudyLibrary />
      <ToolGrid />
    </div>
  );
};

export default Index;
