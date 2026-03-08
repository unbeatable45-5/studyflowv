import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Bell, CalendarDays, Clock, Plus, Trash2, BookOpen, GraduationCap, CheckSquare, Loader2 } from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  reminder_type: "study_session" | "exam_countdown" | "task";
  due_at: string;
  repeat: "none" | "daily" | "weekly";
  completed: boolean;
  created_at: string;
}

const typeConfig = {
  study_session: { icon: BookOpen, label: "Study Session", color: "text-primary bg-primary/10" },
  exam_countdown: { icon: GraduationCap, label: "Exam Countdown", color: "text-warning bg-warning/10" },
  task: { icon: CheckSquare, label: "Task", color: "text-success bg-success/10" },
};

const Reminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminderType, setReminderType] = useState<"study_session" | "exam_countdown" | "task">("task");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueTime, setDueTime] = useState("09:00");
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly">("none");
  const [saving, setSaving] = useState(false);

  const fetchReminders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("due_at", { ascending: true });
    setReminders((data as Reminder[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReminders();
  }, [user]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setReminderType("task");
    setDueDate(undefined);
    setDueTime("09:00");
    setRepeat("none");
  };

  const handleCreate = async () => {
    if (!user || !title.trim() || !dueDate) return;
    setSaving(true);

    const [hours, minutes] = dueTime.split(":").map(Number);
    const dueAt = new Date(dueDate);
    dueAt.setHours(hours, minutes, 0, 0);

    const { error } = await supabase.from("reminders").insert([{
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      reminder_type: reminderType,
      due_at: dueAt.toISOString(),
      repeat,
    }] as any);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to create reminder", variant: "destructive" });
    } else {
      toast({ title: "Reminder created!" });
      resetForm();
      setDialogOpen(false);
      fetchReminders();
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    await supabase.from("reminders").update({ completed: !completed } as any).eq("id", id);
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !completed } : r));
  };

  const deleteReminder = async (id: string) => {
    await supabase.from("reminders").delete().eq("id", id);
    setReminders(prev => prev.filter(r => r.id !== id));
    toast({ title: "Reminder deleted" });
  };

  const getDueLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    if (isPast(d)) return "Overdue";
    return format(d, "MMM d, yyyy");
  };

  const getDueClass = (dateStr: string, completed: boolean) => {
    if (completed) return "text-muted-foreground";
    const d = new Date(dateStr);
    if (isPast(d) && !isToday(d)) return "text-destructive font-medium";
    if (isToday(d)) return "text-warning font-medium";
    return "text-muted-foreground";
  };

  const activeReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-lg p-2">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-display font-bold">Reminders</h1>
          </div>
          <p className="text-sm text-muted-foreground">Stay on top of your study schedule.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" onClick={resetForm}>
              <Plus className="h-4 w-4" /> New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="e.g. Review Biology Chapter 5" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea placeholder="Add details..." value={description} onChange={e => setDescription(e.target.value)} rows={2} />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={reminderType} onValueChange={(v: any) => setReminderType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study_session">📚 Study Session</SelectItem>
                    <SelectItem value="exam_countdown">🎓 Exam Countdown</SelectItem>
                    <SelectItem value="task">✅ Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("w-full justify-start text-xs", !dueDate && "text-muted-foreground")}>
                        <CalendarDays className="h-3.5 w-3.5 mr-1" />
                        {dueDate ? format(dueDate, "MMM d, yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="text-xs" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Repeat</Label>
                <Select value={repeat} onValueChange={(v: any) => setRepeat(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreate} disabled={saving || !title.trim() || !dueDate}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : activeReminders.length === 0 && completedReminders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-2">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No reminders yet. Tap "New" to create one.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeReminders.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Upcoming</h2>
              {activeReminders.map(r => {
                const cfg = typeConfig[r.reminder_type];
                const Icon = cfg.icon;
                return (
                  <Card key={r.id} className="overflow-hidden">
                    <CardContent className="p-3 flex items-start gap-3">
                      <Checkbox
                        checked={r.completed}
                        onCheckedChange={() => toggleComplete(r.id, r.completed)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md", cfg.color)}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                          {r.repeat !== "none" && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {r.repeat}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-sm text-foreground mt-1">{r.title}</p>
                        {r.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.description}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className={cn("text-xs", getDueClass(r.due_at, r.completed))}>
                            {getDueLabel(r.due_at)} · {format(new Date(r.due_at), "h:mm a")}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => deleteReminder(r.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {completedReminders.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Completed</h2>
              {completedReminders.map(r => {
                const cfg = typeConfig[r.reminder_type];
                const Icon = cfg.icon;
                return (
                  <Card key={r.id} className="opacity-60">
                    <CardContent className="p-3 flex items-start gap-3">
                      <Checkbox checked onCheckedChange={() => toggleComplete(r.id, r.completed)} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground line-through">{r.title}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md", cfg.color)}>
                            <Icon className="h-2.5 w-2.5" />
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => deleteReminder(r.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reminders;
