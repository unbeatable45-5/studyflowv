import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, BookOpen, Clock, Calendar, Brain, MessageSquare, Moon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { requestNotificationPermission, getNotificationPermission } from "@/hooks/use-reminder-notifications";

interface NotifPref {
  studyReminders: boolean;
  examAlerts: boolean;
  dailyChallenge: boolean;
  streakReminder: boolean;
  spacedReview: boolean;
  appUpdates: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const STORAGE_KEY = "notif_preferences";

const defaultPrefs: NotifPref = {
  studyReminders: true,
  examAlerts: true,
  dailyChallenge: true,
  streakReminder: false,
  spacedReview: true,
  appUpdates: false,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, "0");
  const label = i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`;
  return { value: `${h}:00`, label };
});

const NotificationPreferences = () => {
  const [prefs, setPrefs] = useState<NotifPref>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultPrefs, ...JSON.parse(stored) } : defaultPrefs;
  });
  const [browserEnabled, setBrowserEnabled] = useState(() => getNotificationPermission() === "granted");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const togglePref = (key: keyof NotifPref) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] as any }));
  };

  const updatePref = (key: keyof NotifPref, value: any) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleBrowserToggle = async (checked: boolean) => {
    if (checked) {
      const result = await requestNotificationPermission();
      if (result === "granted") {
        setBrowserEnabled(true);
        toast({ title: "Browser notifications enabled 🔔" });
      } else {
        toast({ title: "Permission denied", description: "Enable in browser settings", variant: "destructive" });
      }
    } else {
      setBrowserEnabled(false);
      toast({ title: "Browser notifications disabled" });
    }
  };

  const items: { key: keyof NotifPref; label: string; desc: string; icon: React.ElementType }[] = [
    { key: "studyReminders", label: "Study reminders", desc: "Get reminded to study at your scheduled times", icon: Clock },
    { key: "examAlerts", label: "Exam countdown alerts", desc: "Alerts as your exams approach", icon: Calendar },
    { key: "dailyChallenge", label: "Daily challenge", desc: "Notification for new daily study challenges", icon: Brain },
    { key: "streakReminder", label: "Streak reminder", desc: "Don't break your study streak!", icon: BookOpen },
    { key: "spacedReview", label: "Spaced review due", desc: "When flashcards are ready for review", icon: MessageSquare },
    { key: "appUpdates", label: "App updates & tips", desc: "New features and study tips", icon: Bell },
  ];

  const startLabel = TIME_OPTIONS.find(t => t.value === prefs.quietHoursStart)?.label ?? prefs.quietHoursStart;
  const endLabel = TIME_OPTIONS.find(t => t.value === prefs.quietHoursEnd)?.label ?? prefs.quietHoursEnd;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Browser Notifications</CardTitle>
          <CardDescription>Allow StudyFlow to send you notifications in your browser.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-primary/10">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Push notifications</p>
                <p className="text-xs text-muted-foreground">{browserEnabled ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
            <Switch checked={browserEnabled} onCheckedChange={handleBrowserToggle} />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quiet Hours</CardTitle>
          <CardDescription>Mute all notifications during specific hours.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-accent">
                <Moon className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Enable quiet hours</p>
                <p className="text-xs text-muted-foreground">
                  {prefs.quietHoursEnabled ? `${startLabel} – ${endLabel}` : "No quiet hours set"}
                </p>
              </div>
            </div>
            <Switch checked={prefs.quietHoursEnabled} onCheckedChange={() => togglePref("quietHoursEnabled")} />
          </div>

          {prefs.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Select value={prefs.quietHoursStart} onValueChange={(v) => updatePref("quietHoursStart", v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Select value={prefs.quietHoursEnd} onValueChange={(v) => updatePref("quietHoursEnd", v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Types</CardTitle>
          <CardDescription>Choose which notifications you'd like to receive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {items.map(({ key, label, desc, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <Label className="text-sm font-medium cursor-pointer">{label}</Label>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
              <Switch checked={prefs[key] as boolean} onCheckedChange={() => togglePref(key)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences;
