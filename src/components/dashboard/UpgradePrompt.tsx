import { Crown, Zap, BarChart3, Layers, FileText, Brain, ClipboardList, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/contexts/PremiumContext";

const features = [
  { icon: Zap, label: "Unlimited Study Mode", free: "Limited" },
  { icon: ClipboardList, label: "Full Practice Exam (CBT)", free: "1/week" },
  { icon: Brain, label: "Deep Think AI", free: "2/day" },
  { icon: Layers, label: "Advanced flashcards + SRS", free: "Basic" },
];

const UpgradePrompt = () => {
  const { isPremium, promptUpgrade } = usePremium();

  if (isPremium) return null;

  return (
    <Card className="border-warning/15 bg-gradient-to-br from-warning/5 via-background to-primary/5 overflow-hidden shadow-premium animate-fade-in">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl p-2.5 bg-gradient-to-br from-warning/20 to-warning/10 text-warning shrink-0">
            <Crown className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-foreground text-sm tracking-tight">Upgrade to Pro</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">From just ₦400/week</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-warning/10 border border-warning/20">
          <Flame className="h-3 w-3 text-warning shrink-0" />
          <span className="text-[10px] font-semibold text-foreground">🔥 Limited Early Access Price</span>
        </div>

        <div className="grid gap-2.5">
          {features.map(({ icon: Icon, label, free }) => (
            <div key={label} className="flex items-center gap-2.5 text-sm">
              <div className="rounded-lg p-1.5 bg-primary/10 shrink-0">
                <Icon className="h-3 w-3 text-primary" />
              </div>
              <span className="flex-1 text-foreground font-medium text-xs">{label}</span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{free}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
          <span>StudyFlow Pro: <strong className="text-warning">₦400/wk</strong></span>
          <span>Private Tutor: <strong className="line-through">₦5,000+</strong></span>
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
