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
import {
  Crown,
  Calendar,
  CreditCard,
  Loader2,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Check,
  X,
  Sparkles,
  BookOpen,
  FileText,
  Layers,
  Brain,
  Mic,
  BarChart3,
  Download,
  Clock,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/ui/motion";

interface SubscriptionData {
  plan: string;
  status: string;
  current_period_end: string | null;
  paystack_email: string | null;
  created_at: string;
}

interface FeatureRow {
  name: string;
  icon: typeof BookOpen;
  free: string | boolean;
  pro: string | boolean;
}

const features: FeatureRow[] = [
  { name: "Study Helper", icon: BookOpen, free: "3/day", pro: "Unlimited" },
  { name: "Note Organizer", icon: FileText, free: "3/day", pro: "Unlimited" },
  { name: "Flashcard Sets", icon: Layers, free: "5 sets", pro: "Unlimited" },
  { name: "PDF Summarizer", icon: FileText, free: "3/day", pro: "Unlimited" },
  { name: "Mind Maps", icon: Brain, free: false, pro: true },
  { name: "Lecture Capture (Full)", icon: Mic, free: false, pro: true },
  { name: "Spaced Repetition", icon: Clock, free: false, pro: true },
  { name: "Detailed Analytics", icon: BarChart3, free: false, pro: true },
  { name: "Watermark-free PDFs", icon: Download, free: false, pro: true },
  { name: "Priority AI Models", icon: Sparkles, free: false, pro: true },
  { name: "Daily Questions", icon: Zap, free: "1/day", pro: "10/day" },
  { name: "Bulk Export", icon: Download, free: false, pro: true },
];

const Subscription = () => {
  const { user } = useAuth();
  const { isPremium, promptUpgrade } = usePremium();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
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
        setSub(data as SubscriptionData | null);
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
    <div className="px-3 sm:px-4 py-6 sm:py-8 max-w-2xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="bg-warning/15 rounded-xl p-2">
              <Crown className="h-5 w-5 text-warning" />
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold">Subscription</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage your StudyFlow plan</p>
        </div>
      </FadeIn>

      {/* Plan Comparison Cards */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free Plan */}
          <Card className={cn(
            "relative overflow-hidden transition-shadow",
            !isPremium && !stillHasAccess && "ring-2 ring-primary/50"
          )}>
            {!isPremium && !stillHasAccess && (
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="text-[10px]">Current</Badge>
              </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="rounded-xl p-2 bg-muted">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">Free</CardTitle>
                  <p className="text-xs text-muted-foreground">Get started</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-bold text-foreground">₦0</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <Separator />
              <ul className="space-y-2">
                {[
                  "3 summaries per day",
                  "3 PDF exports per day",
                  "5 flashcard sets",
                  "1 daily question",
                  "Basic study tools",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className={cn(
            "relative overflow-hidden border-warning/30 bg-gradient-to-br from-warning/5 via-background to-primary/5 transition-shadow shadow-premium",
            (isPremium || stillHasAccess) && "ring-2 ring-warning/50"
          )}>
            {(isPremium || stillHasAccess) && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-warning text-warning-foreground text-[10px]">Current</Badge>
              </div>
            )}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning to-primary" />
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="rounded-xl p-2 bg-warning/15">
                  <Crown className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">Pro</CardTitle>
                  <p className="text-xs text-muted-foreground">Unlock everything</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-bold text-foreground">₦2,500</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <Separator />
              <ul className="space-y-2">
                {[
                  "Unlimited summaries & PDFs",
                  "Unlimited flashcard sets",
                  "Mind Maps & Lecture Capture",
                  "Spaced Repetition system",
                  "Detailed analytics",
                  "Watermark-free PDF exports",
                  "Priority AI models",
                  "10 daily questions",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {!isPremium && !stillHasAccess && (
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-warning to-primary hover:opacity-90 text-white mt-2"
                  size="lg"
                  onClick={promptUpgrade}
                >
                  <Crown className="h-4 w-4" /> Upgrade to Pro
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Feature Comparison Table */}
      <FadeIn delay={0.1}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Feature Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Feature</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground w-24">Free</th>
                    <th className="text-center px-4 py-3 font-semibold text-warning w-24">
                      <span className="flex items-center justify-center gap-1">
                        <Crown className="h-3 w-3" /> Pro
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, i) => (
                    <tr key={feature.name} className={cn(
                      "border-b border-border/30 last:border-0 transition-colors hover:bg-muted/30",
                      i % 2 === 0 && "bg-muted/10"
                    )}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <feature.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-foreground">{feature.name}</span>
                        </div>
                      </td>
                      <td className="text-center px-4 py-3">
                        {typeof feature.free === "boolean" ? (
                          feature.free ? (
                            <Check className="h-4 w-4 text-success mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">{feature.free}</span>
                        )}
                      </td>
                      <td className="text-center px-4 py-3">
                        {typeof feature.pro === "boolean" ? (
                          feature.pro ? (
                            <Check className="h-4 w-4 text-warning mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className="text-xs text-warning font-semibold">{feature.pro}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Current Subscription Details */}
      {(isActive || isCancelled) && (
        <FadeIn delay={0.15}>
          <Card className={isPremium || stillHasAccess ? "border-warning/30" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display">Subscription Details</CardTitle>
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className={isActive ? "bg-success text-success-foreground" : isCancelled ? "bg-warning/20 text-warning" : ""}
                >
                  {isActive ? "Active" : "Cancelled"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {periodEnd && (
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
        </FadeIn>
      )}

      {/* Actions */}
      <FadeIn delay={0.2}>
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
      </FadeIn>
    </div>
  );
};

export default Subscription;
