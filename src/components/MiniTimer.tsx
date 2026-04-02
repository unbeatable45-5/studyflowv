import { useTimer } from "@/contexts/TimerContext";
import { Clock, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

const MiniTimer = () => {
  const { phase, secondsLeft, running, start, pause } = useTimer();

  if (phase === "idle") return null;

  const isBreak = phase === "break";
  const urgent = secondsLeft <= 60 && running;

  return (
    <Link
      to="/pomodoro"
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono font-bold transition-all shrink-0",
        "border shadow-sm cursor-pointer",
        isBreak
          ? "bg-accent/20 border-accent/30 text-accent-foreground"
          : urgent
            ? "bg-destructive/10 border-destructive/30 text-destructive animate-pulse"
            : "bg-primary/10 border-primary/20 text-primary"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <Clock className="h-3 w-3" />
      <span>{formatTime(secondsLeft)}</span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          running ? pause() : start();
        }}
        className="ml-0.5 p-0.5 rounded-full hover:bg-background/50 transition-colors"
      >
        {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </button>
    </Link>
  );
};

export default MiniTimer;
