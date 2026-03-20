import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
}

const THRESHOLD = 80;
const MAX_PULL = 120;

const PullToRefresh = ({ onRefresh, children, className }: PullToRefreshProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const pulling = useRef(false);
  const pullY = useMotionValue(0);

  const indicatorOpacity = useTransform(pullY, [0, 40, THRESHOLD], [0, 0.6, 1]);
  const indicatorScale = useTransform(pullY, [0, THRESHOLD], [0.5, 1]);
  const indicatorRotate = useTransform(pullY, [0, MAX_PULL], [0, 360]);

  const isAtTop = useCallback(() => {
    const el = containerRef.current?.closest("[data-scroll-container]") || containerRef.current?.closest("main");
    return !el || el.scrollTop <= 0;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    if (isAtTop()) {
      touchStartY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [refreshing, isAtTop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && isAtTop()) {
      const dampened = Math.min(delta * 0.45, MAX_PULL);
      pullY.set(dampened);
    } else {
      pullY.set(0);
    }
  }, [refreshing, pullY, isAtTop]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || refreshing) return;
    pulling.current = false;
    const currentPull = pullY.get();

    if (currentPull >= THRESHOLD) {
      setRefreshing(true);
      animate(pullY, 60, { type: "spring", stiffness: 300, damping: 25 });
      if (navigator.vibrate) navigator.vibrate(15);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        animate(pullY, 0, { type: "spring", stiffness: 300, damping: 25 });
      }
    } else {
      animate(pullY, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  }, [refreshing, pullY, onRefresh]);

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        className="flex items-center justify-center overflow-hidden pointer-events-none"
        style={{ height: pullY }}
      >
        <motion.div
          style={{ opacity: indicatorOpacity, scale: indicatorScale }}
          className="flex flex-col items-center gap-1"
        >
          <motion.div
            style={{ rotate: refreshing ? undefined : indicatorRotate }}
            animate={refreshing ? { rotate: 360 } : {}}
            transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : {}}
          >
            <RefreshCw className="h-5 w-5 text-primary" />
          </motion.div>
          <span className="text-[10px] font-medium text-muted-foreground">
            {refreshing ? "Refreshing…" : "Release to refresh"}
          </span>
        </motion.div>
      </motion.div>

      {children}
    </div>
  );
};

export default PullToRefresh;
