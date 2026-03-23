import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/contexts/PremiumContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Crown, Calendar, CreditCard, Loader2, ShieldCheck, Zap, AlertTriangle,
  Check, X, Sparkles, BookOpen, FileText, Layers, Brain, BarChart3,
  Download, Clock, Bot, ClipboardList, Flame,
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
  { name: "Study Helper", icon: BookOpen, free: "3/day", pro: "50/day" },
  { name: "PDF Summarizer", icon: FileText, free: "3/day", pro: "50/day" },
  { name: "Flashcard Sets", icon: Layers, free: "5 sets", pro: "Unlimited" },
  { name: "Practice Exam (CBT)", icon: ClipboardList, free: "1/week", pro: "Unlimited" },
  { name: "Deep Think AI", icon: Brain, free: "2/day", pro: "20/day" },
  { name: "AI Tutor", icon: Bot, free: "Limited", pro: "Full Access" },
  { name: "Mind Maps", icon: Brain, free: "1/week", pro: "Unlimited" },
  { name: "Spaced Repetition", icon: Clock, free: "Limited", pro: "Full Access" },
  { name: "Detailed Analytics", icon: BarChart3, free: false, pro: true },
  { name: "Watermark-free PDFs", icon: Download, free: false, pro: true },
  { name: "Priority AI Processing", icon: Sparkles, free: false, pro: true },
  { name: "Daily Questions", icon: Zap, free: "1/day", pro: "10/day" },
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
    <div className="px-4 py-6 sm:py-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="text-center space-y-2">
          <div className="mx-auto bg-warning/15 rounded-2xl p-3 w-fit">
            <Crown className="h-7 w-7 text-warning" />
          </div>
          <h1 className="text-2xl font-display font-bold">Study Smarter, Not Harder</h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Pass exams faster with AI-powered study tools built for students
          </p>
        </div>
      </FadeIn>

      {/* Early Access Banner */}
      {!isPremium && !stillHasAccess && (
        <FadeIn delay={0.03}>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-warning/10 to-primary/10 border border-warning/20">
            <Flame className="h-4 w-4 text-warning shrink-0" />
            <p className="text-xs font-medium text-foreground">
              🔥 Limited Early Access Price — Lock in student-friendly rates now!
            </p>
          </div>
        </FadeIn>
      )}

      {/* Plan Cards */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free Plan */}
          <Card className={cn(
            "relative overflow-hidden",
            !isPremium && !stillHasAccess && "ring-2 ring-primary/40"
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
                <span className="text-sm text-muted-foreground">/forever</span>
              </div>
              <Separator />
              <ul className="space-y-2">
                {[
                  "Study Mode (limited)",
                  "2–3 PDF summaries per day",
                  "Basic flashcards & quizzes",
                  "1 daily AI question",
                  "1–2 Deep Think/day",
                  "1 Practice Exam/week",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {!isPremium && !stillHasAccess && (
                <Button variant="outline" className="w-full rounded-xl" disabled>
                  Current Plan
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className={cn(
            "relative overflow-hidden border-warning/30 bg-gradient-to-br from-warning/5 via-background to-primary/5 shadow-premium",
            (isPremium || stillHasAccess) && "ring-2 ring-warning/50"
          )}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning to-primary" />
            {(isPremium || stillHasAccess) && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-warning text-warning-foreground text-[10px]">Current</Badge>
              </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="rounded-xl p-2 bg-warning/15">
                  <Crown className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">Pro</CardTitle>
                  <p className="text-xs text-muted-foreground">Full power</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Pricing options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-warning/10 border border-warning/20">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-display font-bold text-foreground">₦400</span>
                      <span className="text-xs text-muted-foreground">/week</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Billed weekly</p>
                  </div>
                  <Badge className="bg-warning/20 text-warning text-[9px] border-warning/30">🔥 Most Popular</Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/50">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-display font-bold text-foreground">₦1,200</span>
                      <span className="text-xs text-muted-foreground">/month</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Save ₦400 vs weekly</p>
                  </div>
                  <Badge variant="secondary" className="text-[9px]">Best Value</Badge>
                </div>
              </div>

              <Separator />

              <ul className="space-y-2">
                {[
                  "Unlimited Study Mode",
                  "Higher AI limits (fair usage)",
                  "Full Practice Exam (CBT + timer)",
                  "Deep Think (20/day)",
                  "Mind Maps & Visual Summaries",
                  "Spaced Review System",
                  "AI Tutor — full access",
                  "Watermark-free PDF exports",
                  "Faster AI processing",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Value comparison */}
              <div className="p-3 rounded-xl bg-muted/50 space-y-1.5">
                <p className="text-xs font-semibold text-foreground">💡 Compare the value</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">StudyFlow Pro</span>
                  <span className="font-bold text-warning">₦400/week</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Private Tutor</span>
                  <span className="line-through text-muted-foreground">₦5,000+/week</span>
                </div>
              </div>

              {!isPremium && !stillHasAccess && (
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-warning to-primary hover:opacity-90 text-white rounded-xl text-base py-6"
                  onClick={promptUpgrade}
                >
                  <Crown className="h-5 w-5" /> Upgrade to Pro
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
                    <th className="text-left px-3 sm:px-4 py-2.5 font-semibold text-muted-foreground text-xs">Feature</th>
                    <th className="text-center px-2 sm:px-4 py-2.5 font-semibold text-muted-foreground text-xs w-20">Free</th>
                    <th className="text-center px-2 sm:px-4 py-2.5 font-semibold text-warning text-xs w-20">
                      <span className="flex items-center justify-center gap-1">
                        <Crown className="h-3 w-3" /> Pro
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, i) => (
                    <tr key={feature.name} className={cn(
                      "border-b border-border/30 last:border-0",
                      i % 2 === 0 && "bg-muted/10"
                    )}>
                      <td className="px-3 sm:px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <feature.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-foreground text-xs sm:text-sm">{feature.name}</span>
                        </div>
                      </td>
                      <td className="text-center px-2 sm:px-4 py-2.5">
                        {typeof feature.free === "boolean" ? (
                          feature.free ? <Check className="h-4 w-4 text-success mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        ) : (
                          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">{feature.free}</span>
                        )}
                      </td>
                      <td className="text-center px-2 sm:px-4 py-2.5">
                        {typeof feature.pro === "boolean" ? (
                          feature.pro ? <Check className="h-4 w-4 text-warning mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        ) : (
                          <span className="text-[10px] sm:text-xs text-warning font-semibold">{feature.pro}</span>
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

      {/* Subscription Details */}
      {(isActive || isCancelled) && (
        <FadeIn delay={0.15}>
          <Card className={isPremium || stillHasAccess ? "border-warning/30" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display">Subscription Details</CardTitle>
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className={isActive ? "bg-success text-success-foreground" : "bg-warning/20 text-warning"}
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
                    <span className="font-medium text-foreground">{format(periodEnd, "MMM d, yyyy")}</span>
                  </div>
                  {sub?.paystack_email && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <CreditCard className="h-4 w-4" />
                        Billing email
                      </span>
                      <span className="font-medium text-foreground text-xs break-all">{sub.paystack_email}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <ShieldCheck className="h-4 w-4" />
                      Member since
                    </span>
                    <span className="font-medium text-foreground">{format(new Date(sub!.created_at), "MMM d, yyyy")}</span>
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
        <div className="space-y-3 pb-6">
          {!isPremium && !stillHasAccess && (
            <Button
              className="w-full gap-2 bg-gradient-to-r from-warning to-primary hover:opacity-90 text-white rounded-xl text-base py-6"
              onClick={promptUpgrade}
            >
              <Crown className="h-5 w-5" /> Upgrade to Pro
            </Button>
          )}
          {isCancelled && stillHasAccess && (
            <Button
              className="w-full gap-2 bg-gradient-to-r from-warning to-primary hover:opacity-90 text-white rounded-xl"
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
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Plan</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel} disabled={cancelling} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {cancelling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Yes, Cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <p className="text-[11px] text-center text-muted-foreground">
            Cancel anytime · No hidden fees · Secured by Paystack
          </p>
        </div>
      </FadeIn>
    </div>
  );
};

export default Subscription;
