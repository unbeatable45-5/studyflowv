import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePremium } from "@/contexts/PremiumContext";
import { BarChart3, Zap } from "lucide-react";

interface UsageItem {
  label: string;
  used: number;
  limit: number;
  color: string;
}

const UsageDashboard = () => {
  const { isPremium } = usePremium();

  const items: UsageItem[] = useMemo(() => {
    const getUsed = (key: string) => {
      const today = new Date().toDateString();
      const stored = localStorage.getItem(`usage_${key}`);
      if (!stored) return 0;
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) return parsed.count;
        return 0;
      } catch { return 0; }
    };

    if (isPremium) {
      return [
        { label: "PDF Summaries", used: getUsed("pdfs"), limit: 50, color: "bg-primary" },
        { label: "Deep Think", used: getUsed("deep_think"), limit: 20, color: "bg-warning" },
        { label: "Practice Exams", used: getUsed("exams"), limit: 999, color: "bg-success" },
      ];
    }

    return [
      { label: "PDF Summaries", used: getUsed("pdfs"), limit: 3, color: "bg-primary" },
      { label: "Deep Think", used: getUsed("deep_think"), limit: 2, color: "bg-warning" },
      { label: "Mind Maps", used: getUsed("mind_maps"), limit: 1, color: "bg-destructive" },
    ];
  }, [isPremium]);

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
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={`font-semibold ${isMax ? "text-destructive" : "text-foreground"}`}>
                    {item.used}/{item.limit === 999 ? "∞" : item.limit}
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageDashboard;
