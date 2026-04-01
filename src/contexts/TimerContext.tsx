import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from "react";

type Phase = "work" | "break" | "idle";

interface TimerContextType {
  phase: Phase;
  secondsLeft: number;
  running: boolean;
  workMinutes: number;
  breakMinutes: number;
  label: string;
  setWorkMinutes: (m: number) => void;
  setBreakMinutes: (m: number) => void;
  setLabel: (l: string) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  onSessionComplete?: () => void;
  setOnSessionComplete: (cb: (() => void) | undefined) => void;
}

const TimerContext = createContext<TimerContextType | null>(null);

export const useTimer = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
};

// Audio beep for timer end
function playAlarm() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 880;
      gain2.gain.value = 0.3;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.5);
    }, 600);
  } catch {}
}

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [label, setLabel] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const onCompleteRef = useRef<(() => void) | undefined>();

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setSecondsLeft(prev => {
      if (prev <= 1) {
        playAlarm();
        if (phaseRef.current === "work") {
          onCompleteRef.current?.();
          try { new Notification("🍅 Pomodoro", { body: "Focus session done! Take a break." }); } catch {}
          phaseRef.current = "break";
          setPhase("break");
          return breakMinutes * 60;
        } else {
          try { new Notification("🍅 Pomodoro", { body: "Break's over! Ready to focus?" }); } catch {}
          clearTimer();
          setRunning(false);
          phaseRef.current = "idle";
          setPhase("idle");
          return workMinutes * 60;
        }
      }
      return prev - 1;
    });
  }, [breakMinutes, workMinutes, clearTimer]);

  const start = useCallback(() => {
    if (phase === "idle") {
      setPhase("work");
      phaseRef.current = "work";
      setSecondsLeft(workMinutes * 60);
    }
    setRunning(true);
    clearTimer();
    intervalRef.current = setInterval(tick, 1000);
  }, [phase, workMinutes, tick, clearTimer]);

  const pause = useCallback(() => {
    setRunning(false);
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(() => {
    pause();
    setPhase("idle");
    phaseRef.current = "idle";
    setSecondsLeft(workMinutes * 60);
  }, [pause, workMinutes]);

  const setOnSessionComplete = useCallback((cb: (() => void) | undefined) => {
    onCompleteRef.current = cb;
  }, []);

  useEffect(() => {
    if (phase === "idle" && !running) setSecondsLeft(workMinutes * 60);
  }, [workMinutes, phase, running]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return (
    <TimerContext.Provider value={{
      phase, secondsLeft, running, workMinutes, breakMinutes, label,
      setWorkMinutes, setBreakMinutes, setLabel, start, pause, reset,
      setOnSessionComplete,
    }}>
      {children}
    </TimerContext.Provider>
  );
};
