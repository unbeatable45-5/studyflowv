import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";

interface Reminder {
  id: string;
  title: string;
  reminder_type: string;
  due_at: string;
  completed: boolean;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<Reminder[]>([]);

  const fetchUpcoming = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("reminders")
      .select("id, title, reminder_type, due_at, completed")
      .eq("user_id", user.id)
      .eq("completed", false)
      .order("due_at", { ascending: true })
      .limit(10);
    setUpcoming((data as Reminder[]) ?? []);
  };

  useEffect(() => {
    fetchUpcoming();
    const interval = setInterval(fetchUpcoming, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, [user]);

  const overdueCount = upcoming.filter(r => isPast(new Date(r.due_at)) && !isToday(new Date(r.due_at))).length;
  const totalCount = upcoming.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0 relative">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span className={cn(
              "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1",
              overdueCount > 0 ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
            )}>
              {totalCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Reminders</h3>
          <Link to="/reminders" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No upcoming reminders 🎉
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto divide-y">
            {upcoming.slice(0, 5).map(r => {
              const d = new Date(r.due_at);
              const overdue = isPast(d) && !isToday(d);
              return (
                <Link key={r.id} to="/reminders" className="block px-3 py-2.5 hover:bg-accent/50 transition-colors">
                  <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                  <p className={cn("text-xs mt-0.5", overdue ? "text-destructive" : "text-muted-foreground")}>
                    {overdue ? "Overdue · " : ""}{format(d, "MMM d, h:mm a")}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
