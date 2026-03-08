import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { format, subDays, startOfDay, parseISO } from "date-fns";

const StreakWidget = () => {
  const { user } = useAuth();
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("saved_outputs")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const days = (data ?? []).map((d: any) =>
          format(parseISO(d.created_at), "yyyy-MM-dd")
        );
        setDates(days);
        setLoading(false);
      });
  }, [user]);

  const { streak, weekDots } = useMemo(() => {
    const activeDays = new Set(dates);
    const today = startOfDay(new Date());

    // Calculate streak
    let streak = 0;
    let checkDate = today;
    if (!activeDays.has(format(checkDate, "yyyy-MM-dd"))) {
      checkDate = subDays(checkDate, 1);
    }
    while (activeDays.has(format(checkDate, "yyyy-MM-dd"))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }

    // Last 7 days dots
    const weekDots = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayStr = format(day, "yyyy-MM-dd");
      weekDots.push({
        label: format(day, "EEEEE"),
        active: activeDays.has(dayStr),
        isToday: i === 0,
      });
    }

    return { streak, weekDots };
  }, [dates]);

  if (loading) return null;

  return (
    <Card className="border-warning/20 bg-gradient-to-r from-warning/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2.5 bg-warning/10">
            <Flame className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-display font-bold text-foreground">{streak}</span>
              <span className="text-sm text-muted-foreground">day streak</span>
            </div>
            <div className="flex gap-1.5 mt-1.5">
              {weekDots.map((dot, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div
                    className={`h-3 w-3 rounded-full transition-colors ${
                      dot.active
                        ? "bg-warning"
                        : dot.isToday
                        ? "bg-warning/30 ring-1 ring-warning/50"
                        : "bg-muted"
                    }`}
                  />
                  <span className="text-[9px] text-muted-foreground">{dot.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakWidget;
