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

    let streak = 0;
    let checkDate = today;
    if (!activeDays.has(format(checkDate, "yyyy-MM-dd"))) {
      checkDate = subDays(checkDate, 1);
    }
    while (activeDays.has(format(checkDate, "yyyy-MM-dd"))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }

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
    <Card className="border-warning/20 bg-gradient-to-r from-warning/5 via-warning/3 to-transparent overflow-hidden shadow-premium animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl p-3 bg-warning/10 text-warning">
            <Flame className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-extrabold text-foreground tracking-tight">{streak}</span>
              <span className="text-sm text-muted-foreground font-medium">day streak</span>
            </div>
            <div className="flex gap-2 mt-2">
              {weekDots.map((dot, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`h-3.5 w-3.5 rounded-full transition-all duration-300 ${
                      dot.active
                        ? "bg-warning shadow-sm shadow-warning/30"
                        : dot.isToday
                        ? "bg-warning/25 ring-2 ring-warning/40"
                        : "bg-muted"
                    }`}
                  />
                  <span className="text-[9px] font-medium text-muted-foreground">{dot.label}</span>
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
