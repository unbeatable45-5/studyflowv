import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { Flame, BookOpen, CheckCircle2, TrendingUp, Calendar, Trophy, Clock, Target } from "lucide-react";
import { format, subDays, startOfDay, differenceInCalendarDays, parseISO, isToday } from "date-fns";

const toolLabels: Record<string, string> = {
  "study-helper": "Study Helper",
  "note-organizer": "Notes",
  "revision-planner": "Planner",
  "flashcard-generator": "Flashcards",
  "pdf-summarizer": "PDF Summary",
  "study-mode": "Study Mode",
};

interface OutputRow {
  created_at: string;
  tool: string;
}

interface ReminderRow {
  completed: boolean;
}

interface PomodoroRow {
  completed_at: string;
  duration_minutes: number;
}

const Progress = () => {
  const { user } = useAuth();
  const [outputs, setOutputs] = useState<OutputRow[]>([]);
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [pomodoros, setPomodoros] = useState<PomodoroRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase
        .from("saved_outputs")
        .select("created_at, tool")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("reminders")
        .select("completed")
        .eq("user_id", user.id),
      supabase
        .from("pomodoro_sessions")
        .select("completed_at, duration_minutes")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: true }),
    ]).then(([outputsRes, remindersRes, pomodoroRes]) => {
      setOutputs((outputsRes.data as OutputRow[]) ?? []);
      setReminders((remindersRes.data as ReminderRow[]) ?? []);
      setPomodoros((pomodoroRes.data as PomodoroRow[]) ?? []);
      setLoading(false);
    });
  }, [user]);

  const stats = useMemo(() => {
    const empty = { streak: 0, totalSessions: 0, thisWeek: 0, completedTasks: 0, weeklyData: [], toolBreakdown: [], totalFocusMinutes: 0, focusData: [] };
    if (outputs.length === 0 && pomodoros.length === 0) return empty;

    const activeDays = new Set([
      ...outputs.map(o => format(parseISO(o.created_at), "yyyy-MM-dd")),
      ...pomodoros.map(p => format(parseISO(p.completed_at), "yyyy-MM-dd")),
    ]);

    let streak = 0;
    const today = startOfDay(new Date());
    let checkDate = today;
    if (!activeDays.has(format(checkDate, "yyyy-MM-dd"))) {
      checkDate = subDays(checkDate, 1);
    }
    while (activeDays.has(format(checkDate, "yyyy-MM-dd"))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }

    const weekStart = subDays(today, 6);
    const thisWeek = outputs.filter(o => parseISO(o.created_at) >= weekStart).length;

    const weeklyData = [];
    const focusData = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayStr = format(day, "yyyy-MM-dd");
      const count = outputs.filter(o => format(parseISO(o.created_at), "yyyy-MM-dd") === dayStr).length;
      const focusMins = pomodoros
        .filter(p => format(parseISO(p.completed_at), "yyyy-MM-dd") === dayStr)
        .reduce((sum, p) => sum + p.duration_minutes, 0);
      weeklyData.push({ day: format(day, "EEE"), date: format(day, "MMM d"), sessions: count, isToday: i === 0 });
      focusData.push({ day: format(day, "EEE"), date: format(day, "MMM d"), minutes: focusMins, isToday: i === 0 });
    }

    const toolCounts: Record<string, number> = {};
    outputs.forEach(o => {
      toolCounts[o.tool] = (toolCounts[o.tool] || 0) + 1;
    });
    const toolBreakdown = Object.entries(toolCounts)
      .map(([tool, count]) => ({ tool, label: toolLabels[tool] || tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const completedTasks = reminders.filter(r => r.completed).length;
    const totalFocusMinutes = pomodoros.reduce((sum, p) => sum + p.duration_minutes, 0);

    return { streak, totalSessions: outputs.length, thisWeek, completedTasks, weeklyData, toolBreakdown, totalFocusMinutes, focusData };
  }, [outputs, reminders, pomodoros]);

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-52 rounded-xl" />
      </div>
    );
  }

  const statCards = [
    {
      icon: Flame,
      label: "Day Streak",
      value: stats.streak,
      suffix: stats.streak === 1 ? "day" : "days",
      color: "text-warning bg-warning/10",
    },
    {
      icon: BookOpen,
      label: "Total Sessions",
      value: stats.totalSessions,
      suffix: "",
      color: "text-primary bg-primary/10",
    },
    {
      icon: TrendingUp,
      label: "This Week",
      value: stats.thisWeek,
      suffix: "sessions",
      color: "text-success bg-success/10",
    },
    {
      icon: CheckCircle2,
      label: "Tasks Done",
      value: stats.completedTasks,
      suffix: "",
      color: "text-accent-foreground bg-accent",
    },
    {
      icon: Clock,
      label: "Focus Time",
      value: Math.round(stats.totalFocusMinutes / 60) || stats.totalFocusMinutes,
      suffix: stats.totalFocusMinutes >= 60 ? "hours" : "min",
      color: "text-primary bg-primary/10",
    },
    {
      icon: Target,
      label: "Pomodoros",
      value: pomodoros.length,
      suffix: "",
      color: "text-destructive bg-destructive/10",
    },
  ];

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-warning/10 rounded-lg p-2">
            <Trophy className="h-5 w-5 text-warning" />
          </div>
          <h1 className="text-xl font-display font-bold">Progress</h1>
        </div>
        <p className="text-sm text-muted-foreground">Track your study habits and keep the streak alive!</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map(({ icon: Icon, label, value, suffix, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground leading-none">
                  {value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {suffix ? `${suffix} · ` : ""}{label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Activity Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Weekly Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {stats.weeklyData.every(d => d.sessions === 0) ? (
            <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
              No activity this week. Start a study session!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.weeklyData} barSize={28} barGap={4}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground border rounded-lg px-3 py-2 shadow-md text-xs">
                        <p className="font-medium">{d.date}</p>
                        <p>{d.sessions} session{d.sessions !== 1 ? "s" : ""}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="sessions" radius={[6, 6, 0, 0]}>
                  {stats.weeklyData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.isToday ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.35)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Focus Time Chart */}
      {stats.focusData.some((d: any) => d.minutes > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Focus Time (minutes)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={stats.focusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={24} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground border rounded-lg px-3 py-2 shadow-md text-xs">
                        <p className="font-medium">{d.date}</p>
                        <p>{d.minutes} min focused</p>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tool Breakdown */}
      {stats.toolBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Most Used Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.toolBreakdown.map(({ label, count }) => {
              const max = stats.toolBreakdown[0].count;
              const pct = Math.round((count / max) * 100);
              return (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{label}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Progress;
