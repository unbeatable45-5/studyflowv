import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Timer, Play, Pause, RotateCcw, Coffee, BookOpen, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format, isToday, parseISO } from "date-fns";

interface PomodoroSession {
  id: string;
  duration_minutes: number;
  label: string | null;
  completed_at: string;
}

const Pomodoro = () => {
  const { user } = useAuth();
  const timer = useTimer();
  const { phase, secondsLeft, running, workMinutes, breakMinutes, label,
    setWorkMinutes, setBreakMinutes, setLabel, start, pause, reset, setOnSessionComplete } = timer;

  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("pomodoro_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setSessions((data as PomodoroSession[]) ?? []);
        setLoadingHistory(false);
      });
  }, [user]);

  const saveSession = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("pomodoro_sessions")
      .insert([{ user_id: user.id, duration_minutes: workMinutes, label: label.trim() || null }] as any)
      .select()
      .single();
    if (data) {
      setSessions(prev => [data as PomodoroSession, ...prev].slice(0, 20));
      toast({ title: "🎉 Focus session complete!", description: "Time for a break." });
    }
  }, [user, workMinutes, label]);

  // Register session complete callback
  useEffect(() => {
    setOnSessionComplete(saveSession);
    return () => setOnSessionComplete(undefined);
  }, [saveSession, setOnSessionComplete]);

  const totalSeconds = phase === "work" ? workMinutes * 60 : phase === "break" ? breakMinutes * 60 : workMinutes * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const todayCount = sessions.filter(s => isToday(parseISO(s.completed_at))).length;
  const todayMinutes = sessions.filter(s => isToday(parseISO(s.completed_at))).reduce((sum, s) => sum + s.duration_minutes, 0);

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (progress / 100) * circumference;

  const phaseColor = phase === "work" ? "text-primary" : phase === "break" ? "text-success" : "text-muted-foreground";
  const phaseStroke = phase === "work" ? "hsl(var(--primary))" : phase === "break" ? "hsl(var(--success))" : "hsl(var(--muted))";

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-destructive/10 rounded-lg p-2">
            <Timer className="h-5 w-5 text-destructive" />
          </div>
          <h1 className="text-xl font-display font-bold">Pomodoro Timer</h1>
        </div>
        <p className="text-sm text-muted-foreground">Stay focused with timed study sessions.</p>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          <div className="relative">
            <svg width="220" height="220" className="-rotate-90">
              <circle cx="110" cy="110" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle cx="110" cy="110" r={radius} fill="none" stroke={phaseStroke} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeOffset} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-5xl font-display font-bold tabular-nums", phaseColor)}>
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </span>
              <span className="text-sm text-muted-foreground mt-1 capitalize flex items-center gap-1.5">
                {phase === "work" && <><BookOpen className="h-3.5 w-3.5" /> Focus</>}
                {phase === "break" && <><Coffee className="h-3.5 w-3.5" /> Break</>}
                {phase === "idle" && "Ready"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!running ? (
              <Button size="lg" onClick={start} className="gap-2 px-8">
                <Play className="h-5 w-5" /> {phase === "idle" ? "Start" : "Resume"}
              </Button>
            ) : (
              <Button size="lg" variant="secondary" onClick={pause} className="gap-2 px-8">
                <Pause className="h-5 w-5" /> Pause
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={reset}>
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {phase === "idle" && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Focus label (optional)</Label>
              <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Biology Chapter 3" />
            </div>
            <div className="space-y-2">
              <Label>Work: {workMinutes} min</Label>
              <Slider value={[workMinutes]} onValueChange={v => setWorkMinutes(v[0])} min={5} max={60} step={5} />
            </div>
            <div className="space-y-2">
              <Label>Break: {breakMinutes} min</Label>
              <Slider value={[breakMinutes]} onValueChange={v => setBreakMinutes(v[0])} min={1} max={30} step={1} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl p-2.5 bg-primary/10 text-primary"><Trophy className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground leading-none">{todayCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sessions today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl p-2.5 bg-warning/10 text-warning"><Timer className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground leading-none">{todayMinutes}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Minutes focused</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {sessions.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Recent Sessions</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {sessions.slice(0, 8).map(s => (
              <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{s.label || "Focus session"}</p>
                  <p className="text-xs text-muted-foreground">{s.duration_minutes} min</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {isToday(parseISO(s.completed_at)) ? format(parseISO(s.completed_at), "h:mm a") : format(parseISO(s.completed_at), "MMM d")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Pomodoro;
