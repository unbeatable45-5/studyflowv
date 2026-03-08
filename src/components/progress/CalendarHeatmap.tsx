import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isToday,
  isFuture,
} from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarHeatmapProps {
  /** Map of "yyyy-MM-dd" → activity count */
  activityMap: Record<string, number>;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const getIntensity = (count: number, max: number): string => {
  if (count === 0) return "bg-muted";
  const ratio = count / Math.max(max, 1);
  if (ratio <= 0.25) return "bg-primary/25";
  if (ratio <= 0.5) return "bg-primary/50";
  if (ratio <= 0.75) return "bg-primary/75";
  return "bg-primary";
};

const CalendarHeatmap = ({ activityMap }: CalendarHeatmapProps) => {
  const [viewMonth, setViewMonth] = useState(new Date());

  const { days, monthMax, monthTotal } = useMemo(() => {
    const start = startOfMonth(viewMonth);
    const end = endOfMonth(viewMonth);
    const days = eachDayOfInterval({ start, end });
    let monthMax = 0;
    let monthTotal = 0;
    days.forEach((d) => {
      const count = activityMap[format(d, "yyyy-MM-dd")] ?? 0;
      if (count > monthMax) monthMax = count;
      monthTotal += count;
    });
    return { days, monthMax, monthTotal };
  }, [viewMonth, activityMap]);

  const startPadding = getDay(days[0]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            Activity Calendar
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {format(viewMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              disabled={isFuture(addMonths(startOfMonth(viewMonth), 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((l, i) => (
            <div
              key={i}
              className="text-[10px] text-muted-foreground text-center font-medium"
            >
              {l}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const count = activityMap[key] ?? 0;
            const future = isFuture(day);
            return (
              <div
                key={key}
                title={`${format(day, "MMM d")}: ${count} session${count !== 1 ? "s" : ""}`}
                className={cn(
                  "aspect-square rounded-sm flex items-center justify-center text-[10px] font-medium transition-colors",
                  future
                    ? "bg-transparent text-muted-foreground/30"
                    : getIntensity(count, monthMax),
                  !future && count > 0 && "text-primary-foreground",
                  !future && count === 0 && "text-muted-foreground/50",
                  isToday(day) && "ring-1 ring-primary ring-offset-1 ring-offset-background"
                )}
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {monthTotal} session{monthTotal !== 1 ? "s" : ""} this month
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Less</span>
            {["bg-muted", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"].map(
              (cls, i) => (
                <div key={i} className={cn("h-3 w-3 rounded-sm", cls)} />
              )
            )}
            <span className="text-[10px] text-muted-foreground">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarHeatmap;
