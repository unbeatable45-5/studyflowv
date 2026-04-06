import { useMemo, useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePremium } from "@/contexts/PremiumContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageItem {
  label: string;
  used: number;
  limit: number;
}

const UsageDashboard = () => {
  const { isPremium } = usePremium();
  const { user } = useAuth();
  const [usage, setUsage] = useState({ pdfs: 0, deep_think: 0, summaries: 0, exams: 0, mind_maps: 0 });

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("saved_outputs")
      .select("tool")
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00`);

    const outputs = data ?? [];
    setUsage({
      pdfs: outputs.filter((o) => o.tool === "pdf-summarizer").length,
      deep_think: outputs.filter((o) => o.tool === "ai-tutor-deep").length,
      summaries: outputs.filter((o) => ["study-helper", "note-organizer", "pdf-summarizer"].includes(o.tool)).length,
      exams: outputs.filter((o) => o.tool === "practice-exam").length,
      mind_maps: outputs.filter((o) => o.tool === "mind-map").length,
    });
  }, [user]);

  useEffect(() => {
    fetchUsage();

    // Subscribe to realtime changes on saved_outputs
    if (!user) return;
    const channel = supabase
      .channel("usage-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saved_outputs", filter: `user_id=eq.${user.id}` },
        () => fetchUsage()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchUsage]);

  const items: UsageItem[] = useMemo(() => {
    if (isPremium) {
      return [
        { label: "PDF Summaries", used: usage.pdfs, limit: 50 },
        { label: "Deep Think", used: usage.deep_think, limit: 20 },
        { label: "Practice Exams", used: usage.exams, limit: 999 },
      ];
    }
    return [
      { label: "PDF Summaries", used: usage.pdfs, limit: 3 },
      { label: "Deep Think", used: usage.deep_think, limit: 2 },
      { label: "Mind Maps", used: usage.mind_maps, limit: 1 },
    ];
  }, [isPremium, usage]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-accent">
            <BarChart3 className="h-4 w-4 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-sm text-foreground">Today's Usage</h3>
          </div>
          {isPremium && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full border border-warning/20">
              <Zap className="h-2.5 w-2.5" /> PRO
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {items.map((item) => {
            const pct = Math.min((item.used / item.limit) * 100, 100);
            const isMax = item.used >= item.limit;
            const isNearLimit = !isMax && pct >= 70;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={cn("text-muted-foreground", isNearLimit && "text-warning font-medium")}>
                    {item.label}
                    {isNearLimit && <AlertTriangle className="h-3 w-3 inline ml-1 text-warning" />}
                  </span>
                  <span className={cn(
                    "font-semibold transition-all",
                    isMax ? "text-destructive" : isNearLimit ? "text-warning animate-pulse" : "text-foreground"
                  )}>
                    {item.used}/{item.limit === 999 ? "∞" : item.limit}
                  </span>
                </div>
                <Progress
                  value={pct}
                  className={cn(
                    "h-1.5 transition-all",
                    isMax && "[&>div]:bg-destructive",
                    isNearLimit && !isMax && "[&>div]:bg-warning"
                  )}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageDashboard;
