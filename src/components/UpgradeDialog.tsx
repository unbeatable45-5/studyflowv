import { useState } from "react";
import { usePremium } from "@/contexts/PremiumContext";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Brain, FileText, Layers, BarChart3, Download, Sparkles, Check, Loader2, ClipboardList, Bot, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const features = [
  { icon: Zap, label: "Unlimited Study Mode" },
  { icon: ClipboardList, label: "Full Practice Exam (CBT)" },
  { icon: Brain, label: "Deep Think AI (20/day)" },
  { icon: Bot, label: "AI Tutor — full access" },
  { icon: Layers, label: "Advanced flashcards + SRS" },
  { icon: FileText, label: "Watermark-free PDF exports" },
  { icon: BarChart3, label: "Detailed analytics" },
  { icon: Sparkles, label: "Faster AI processing" },
];

const UpgradeDialog = () => {
  const { showUpgradeDialog, setShowUpgradeDialog } = usePremium();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly">("weekly");

  const handlePaystackCheckout = async () => {
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: { plan: selectedPlan },
      });

      if (error) throw error;

      if (data?.authorization_url) {
        localStorage.setItem("paystack_reference", data.reference);
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No authorization URL returned");
      }
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto rounded-full p-3 bg-gradient-to-br from-warning/20 to-primary/20 w-fit">
            <Crown className="h-6 w-6 text-warning" />
          </div>
          <DialogTitle className="font-display text-lg">Upgrade to StudyFlow Pro</DialogTitle>
          <DialogDescription className="text-xs">Pass exams faster with AI-powered tools</DialogDescription>
        </DialogHeader>

        {/* Early access badge */}
        <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-warning/10 border border-warning/20">
          <Flame className="h-3.5 w-3.5 text-warning" />
          <span className="text-[11px] font-semibold text-foreground">🔥 Limited Early Access Price</span>
        </div>

        <div className="space-y-2 py-1 max-h-[200px] overflow-y-auto">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 text-sm">
              <div className="rounded-lg p-1 bg-primary/10 shrink-0">
                <Icon className="h-3 w-3 text-primary" />
              </div>
              <span className="flex-1 text-foreground text-xs">{label}</span>
              <Check className="h-3.5 w-3.5 text-success shrink-0" />
            </div>
          ))}
        </div>

        <div className="space-y-2.5 pt-1">
          {/* Plan toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedPlan("weekly")}
              className={cn(
                "relative p-3 rounded-xl border text-left transition-all",
                selectedPlan === "weekly"
                  ? "border-warning/50 bg-warning/5 ring-2 ring-warning/20"
                  : "border-border hover:border-border/80 bg-background"
              )}
            >
              {selectedPlan === "weekly" && (
                <span className="absolute -top-2 left-3 text-[9px] bg-warning text-warning-foreground px-1.5 py-0.5 rounded-full font-bold">
                  🔥 Popular
                </span>
              )}
              <p className="text-base font-display font-bold text-foreground">₦400</p>
              <p className="text-[10px] text-muted-foreground">/week</p>
            </button>
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={cn(
                "relative p-3 rounded-xl border text-left transition-all",
                selectedPlan === "monthly"
                  ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-border/80 bg-background"
              )}
            >
              <span className="absolute -top-2 left-3 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">
                Save ₦400
              </span>
              <p className="text-base font-display font-bold text-foreground">₦1,200</p>
              <p className="text-[10px] text-muted-foreground">/month</p>
            </button>
          </div>

          {/* Value comparison */}
          <div className="flex items-center justify-between text-[10px] px-1 text-muted-foreground">
            <span>StudyFlow Pro: <strong className="text-warning">₦400/week</strong></span>
            <span>Private Tutor: <strong className="line-through">₦5,000+/week</strong></span>
          </div>

          <Button
            className="w-full gap-2 bg-gradient-to-r from-warning to-primary hover:opacity-90 text-white rounded-xl py-5 text-sm font-semibold"
            onClick={handlePaystackCheckout}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
            {loading ? "Processing..." : "Upgrade Now"}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            Cancel anytime · Secured by Paystack
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeDialog;
