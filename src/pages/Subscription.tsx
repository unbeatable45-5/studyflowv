import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/contexts/PremiumContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Crown, Calendar, CreditCard, Loader2, ShieldCheck, Zap, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string | null;
  paystack_email: string | null;
  created_at: string;
}

const Subscription = () => {
  const { user } = useAuth();
  const { isPremium, promptUpgrade } = usePremium();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end, paystack_email, created_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setSub(data as Subscription | null);
        setLoading(false);
      });
  }, [user]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription");
      if (error) throw error;
      toast({ title: "Subscription cancelled", description: "You'll retain access until your current period ends." });
      setSub((prev) => prev ? { ...prev, status: "cancelled" } : prev);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isActive = sub?.status === "active";
  const isCancelled = sub?.status === "cancelled";
  const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end) : null;
  const stillHasAccess = periodEnd && periodEnd > new Date();

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-warning/15 rounded-lg p-2">
            <Crown className="h-5 w-5 text-warning" />
          </div>
          <h1 className="text-xl font-display font-bold">Subscription</h1>
        </div>
        <p className="text-sm text-muted-foreground">Manage your StudyFlow Pro plan</p>
      </div>

      {/* Current Plan Card */}
      <Card className={isPremium || stillHasAccess ? "border-warning/30 bg-gradient-to-br from-warning/5 to-primary/5" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-display">Current Plan</CardTitle>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={isActive ? "bg-success text-success-foreground" : isCancelled ? "bg-warning/20 text-warning" : ""}
            >
              {isActive ? "Active" : isCancelled ? "Cancelled" : "Free"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-3 ${isPremium || stillHasAccess ? "bg-warning/15" : "bg-muted"}`}>
              {isPremium || stillHasAccess ? (
                <Crown className="h-6 w-6 text-warning" />
              ) : (
                <Zap className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">
                {isPremium || stillHasAccess ? "StudyFlow Pro" : "Free Plan"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isPremium ? "Full access to all premium features" : "Basic study tools with daily limits"}
              </p>
            </div>
          </div>

          {(isActive || isCancelled) && periodEnd && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {isCancelled ? "Access until" : "Renews on"}
                  </span>
                  <span className="font-medium text-foreground">
                    {format(periodEnd, "MMM d, yyyy")}
                  </span>
                </div>

                {sub?.paystack_email && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      Billing email
                    </span>
                    <span className="font-medium text-foreground">{sub.paystack_email}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    Member since
                  </span>
                  <span className="font-medium text-foreground">
                    {format(new Date(sub!.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </>
          )}

          {isCancelled && stillHasAccess && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <p className="text-xs text-warning">
                Your subscription is cancelled but you still have access until {format(periodEnd!, "MMM d, yyyy")}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        {!isPremium && !stillHasAccess && (
          <Button
            className="w-full gap-2 bg-gradient-to-r from-warning to-primary hover:opacity-90 text-white"
            size="lg"
            onClick={promptUpgrade}
          >
            <Crown className="h-4 w-4" /> Upgrade to Pro
          </Button>
        )}

        {isCancelled && stillHasAccess && (
          <Button
            className="w-full gap-2 bg-gradient-to-r from-warning to-primary hover:opacity-90 text-white"
            size="lg"
            onClick={promptUpgrade}
          >
            <Crown className="h-4 w-4" /> Resubscribe
          </Button>
        )}

        {isActive && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full text-destructive hover:text-destructive" size="sm">
                Cancel Subscription
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll keep access to Pro features until {periodEnd ? format(periodEnd, "MMM d, yyyy") : "your current period ends"}.
                  After that, you'll be downgraded to the free plan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Plan</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {cancelling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Yes, Cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};

export default Subscription;
