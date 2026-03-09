import { Crown, Zap, BarChart3, Layers, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/contexts/PremiumContext";

const features = [
  { icon: Zap, label: "Unlimited AI summaries", free: "3/day" },
  { icon: FileText, label: "Unlimited PDF uploads", free: "3/day" },
  { icon: Layers, label: "Advanced flashcards + SRS", free: "Basic" },
  { icon: BarChart3, label: "Detailed analytics", free: "Basic stats" },
];

const UpgradePrompt = () => {
  const { isPremium, promptUpgrade } = usePremium();

  if (isPremium) return null;

  return (
    <Card className="border-warning/15 bg-gradient-to-br from-warning/5 via-background to-primary/5 overflow-hidden shadow-premium animate-fade-in">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-3.5">
          <div className="rounded-2xl p-3 bg-gradient-to-br from-warning/20 to-warning/10 text-warning">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground text-base tracking-tight">Upgrade to Pro</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Unlock the full StudyFlow experience</p>
          </div>
        </div>

        <div className="grid gap-3">
          {features.map(({ icon: Icon, label, free }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <div className="rounded-lg p-1.5 bg-primary/10">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="flex-1 text-foreground font-medium">{label}</span>
              <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{free}</span>
            </div>
          ))}
        </div>

        <Button
          className="w-full gap-2 bg-gradient-to-r from-warning to-primary hover:opacity-90 text-white font-semibold rounded-xl shadow-sm"
          size="lg"
          onClick={promptUpgrade}
        >
          <Crown className="h-4 w-4" /> Upgrade to Pro
        </Button>
      </CardContent>
    </Card>
  );
};

export default UpgradePrompt;
