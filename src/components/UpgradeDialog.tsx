import { useState } from "react";
import { usePremium } from "@/contexts/PremiumContext";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Brain, FileText, Layers, BarChart3, Download, Users, Sparkles, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");

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
        // Store reference for verification on return
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
          {/* Plan toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`flex-1 text-sm py-2 rounded-md font-medium transition-colors ${
                selectedPlan === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan("yearly")}
              className={`flex-1 text-sm py-2 rounded-md font-medium transition-colors ${
                selectedPlan === "yearly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Yearly <span className="text-xs text-success">Save 33%</span>
            </button>
          </div>

          <div className="text-center">
            <span className="text-3xl font-display font-bold text-foreground">
              {selectedPlan === "monthly" ? "₦9,990" : "₦79,990"}
            </span>
            <span className="text-sm text-muted-foreground">
              /{selectedPlan === "monthly" ? "month" : "year"}
            </span>
          </div>

          <Button
            className="w-full gap-2 bg-gradient-to-r from-warning to-primary hover:opacity-90 text-white"
            size="lg"
            onClick={handlePaystackCheckout}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            {loading ? "Processing..." : "Upgrade Now"}
          </Button>
          <p className="text-[11px] text-center text-muted-foreground">
            Cancel anytime · Secured by Paystack
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeDialog;
