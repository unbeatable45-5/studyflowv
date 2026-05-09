import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const POLL_INTERVAL = 30_000; // check every 30 seconds
const NOTIFIED_KEY = "notified_reminders";
const LOOKAHEAD_MS = 60_000; // fire reminders due within next 60s

function getNotifiedIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function markNotified(id: string) {
  const ids = getNotifiedIds();
  ids.add(id);
  // Keep only last 200 entries to avoid bloat
  const arr = [...ids].slice(-200);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(arr));
}

function isQuietHours(): boolean {
  try {
    const raw = localStorage.getItem("notification_prefs");
    if (!raw) return false;
    const prefs = JSON.parse(raw);
    if (!prefs?.quietHoursEnabled) return false;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = (prefs.quietStart || "22:00").split(":").map(Number);
    const [eh, em] = (prefs.quietEnd || "07:00").split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    // Wraps midnight
    if (start > end) return mins >= start || mins < end;
    return mins >= start && mins < end;
  } catch {
    return false;
  }
}

function fireReminder(title: string, body: string) {
  // In-app toast always shows (so reminders are never silent if app is open)
  toast({ title, description: body });

  // OS notification if granted and not quiet hours
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (isQuietHours()) return;

  try {
    new Notification(title, {
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: `reminder-${Date.now()}`,
    });
  } catch {
    // Some browsers block the constructor; in-app toast already covered it.
  }
}

export function useReminderNotifications() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkingRef = useRef(false);

  const checkReminders = useCallback(async () => {
    if (!user) return;
    if (checkingRef.current) return; // prevent overlapping polls
    checkingRef.current = true;
    try {
      const cutoff = new Date(Date.now() + LOOKAHEAD_MS).toISOString();
      const { data, error } = await supabase
        .from("reminders")
        .select("id, title, description, reminder_type, due_at")
        .eq("user_id", user.id)
        .eq("completed", false)
        .lte("due_at", cutoff)
        .order("due_at", { ascending: true })
        .limit(20);

      if (error || !data) return;

      const notified = getNotifiedIds();
      for (const r of data as any[]) {
        if (notified.has(r.id)) continue;

        const typeLabel =
          r.reminder_type === "study_session" ? "📚 Study Session" :
          r.reminder_type === "exam_countdown" ? "🎓 Exam Alert" :
          r.reminder_type === "streak" ? "🔥 Streak" :
          r.reminder_type === "revision" ? "🔁 Revision" : "✅ Task";

        fireReminder(
          `${typeLabel}: ${r.title}`,
          r.description || "Your reminder is due now."
        );
        markNotified(r.id);
      }
    } finally {
      checkingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Initial check after short delay
    const timeout = setTimeout(checkReminders, 1500);
    intervalRef.current = setInterval(checkReminders, POLL_INTERVAL);

    // Re-check whenever the tab becomes visible (catches phones returning from sleep)
    const onVis = () => {
      if (document.visibilityState === "visible") checkReminders();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user, checkReminders]);
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}
