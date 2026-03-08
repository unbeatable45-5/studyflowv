import { usePremium } from "@/contexts/PremiumContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Brain, FileText, Layers, BarChart3, Download, Users, Sparkles, Check } from "lucide-react";

const features = [
  { icon: Zap, label: "Unlimited AI summaries" },
  { icon: FileText, label: "Unlimited PDF uploads" },
  { icon: Layers, label: "Advanced flashcards + SRS" },
  { icon: Brain, label: "Smart weak-topic detection" },
  { icon: BarChart3, label: "Detailed analytics dashboard" },
  { icon: Download, label: "Bulk export & offline access" },
  { icon: Sparkles, label: "Priority AI processing" },
  { icon: Users, label: "Collaboration features" },
];

const UpgradeDialog = () => {
  const { showUpgradeDialog, setShowUpgradeDialog } = usePremium();

  return (
    <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto rounded-full p-3 bg-gradient-to-br from-warning/20 to-primary/20 w-fit">
            <Crown className="h-7 w-7 text-warning" />
          </div>
          <DialogTitle className="font-display text-xl">Upgrade to StudyFlow Pro</DialogTitle>
          <DialogDescription>Unlock the full power of AI-driven study tools</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <div className="rounded-lg p-1.5 bg-primary/10">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="flex-1 text-foreground">{label}</span>
              <Check className="h-4 w-4 text-success" />
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          <div className="text-center">
            <span className="text-3xl font-display font-bold text-foreground">$9.99</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          <Button className="w-full gap-2 bg-gradient-to-r from-warning to-primary hover:opacity-90 text-white" size="lg" disabled>
            <Crown className="h-4 w-4" /> Coming Soon
          </Button>
          <p className="text-[11px] text-center text-muted-foreground">
            Cancel anytime · 7-day free trial
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeDialog;
