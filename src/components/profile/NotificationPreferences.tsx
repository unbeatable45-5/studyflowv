import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BookOpen, Clock, Calendar, Brain, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { requestNotificationPermission, getNotificationPermission } from "@/hooks/use-reminder-notifications";

interface NotifPref {
  studyReminders: boolean;
  examAlerts: boolean;
  dailyChallenge: boolean;
  streakReminder: boolean;
  spacedReview: boolean;
  appUpdates: boolean;
}

const STORAGE_KEY = "notif_preferences";

const defaultPrefs: NotifPref = {
  studyReminders: true,
  examAlerts: true,
  dailyChallenge: true,
  streakReminder: false,
  spacedReview: true,
  appUpdates: false,
};

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
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
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
                <p className="text-xs text-muted-foreground">
                  {browserEnabled ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
            <Switch checked={browserEnabled} onCheckedChange={handleBrowserToggle} />
          </div>
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
              <Switch checked={prefs[key]} onCheckedChange={() => togglePref(key)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences;
