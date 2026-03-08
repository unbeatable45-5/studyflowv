import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Timer, Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PRESETS = [
  { label: "5 min", seconds: 5 * 60 },
  { label: "15 min", seconds: 15 * 60 },
  { label: "25 min", seconds: 25 * 60 },
];

const ReviewTimer = () => {
  const { user } = useAuth();
  const [totalSeconds, setTotalSeconds] = useState(15 * 60);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const saveSession = useCallback(async (durationSeconds: number) => {
    if (!user || saved) return;
    const minutes = Math.round(durationSeconds / 60);
    if (minutes < 1) return;
    setSaved(true);
    const { error } = await supabase.from("pomodoro_sessions").insert({
      user_id: user.id,
      duration_minutes: minutes,
      label: "Lecture Review",
    });
    if (error) {
      console.error("Failed to save session:", error);
      setSaved(false);
    }
  }, [user, saved]);

  useEffect(() => {
    if (!running) { clear(); return; }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clear();
          setRunning(false);
          setFinished(true);
          toast({ title: "⏰ Time's up!", description: "Great review session! Session saved." });
          saveSession(totalSeconds);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clear;
  }, [running, clear]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const selectPreset = (s: number) => {
    setTotalSeconds(s);
    setSecondsLeft(s);
    setRunning(false);
    setFinished(false);
    clear();
  };

  const reset = () => {
    setSecondsLeft(totalSeconds);
    setRunning(false);
    setFinished(false);
    clear();
  };

  return (
    <Card className="border-success/20 bg-success/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-success" />
          <span className="text-sm font-medium text-foreground">Review Timer</span>
        </div>

        {/* Presets */}
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              variant={totalSeconds === p.seconds ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => selectPreset(p.seconds)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Progress bar + time */}
        <div className="space-y-1.5">
          <div className="relative h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-1000", finished ? "bg-success" : "bg-primary")}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className={cn("text-2xl font-mono font-bold tabular-nums", finished ? "text-success" : "text-foreground")}>
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
            {finished && (
              <span className="flex items-center gap-1 text-xs text-success font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Done!
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            onClick={() => { setFinished(false); setRunning(!running); }}
            disabled={secondsLeft === 0 && !finished}
            className="flex-1 gap-1.5"
            size="sm"
          >
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "Pause" : "Start"}
          </Button>
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewTimer;
