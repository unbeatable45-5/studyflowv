import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const POLL_INTERVAL = 30_000; // check every 30 seconds
const NOTIFIED_KEY = "notified_reminders";

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

function showNotification(title: string, body: string) {
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: `reminder-${Date.now()}`,
    });
  } catch {
    // Fallback: some browsers block Notification constructor, ignore
  }
}

export function useReminderNotifications() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkReminders = useCallback(async () => {
    if (!user || Notification.permission !== "granted") return;

    const now = new Date().toISOString();
    const { data } = await supabase
      .from("reminders")
      .select("id, title, description, reminder_type, due_at")
      .eq("user_id", user.id)
      .eq("completed", false)
      .lte("due_at", now)
      .order("due_at", { ascending: true })
      .limit(20);

    if (!data) return;

    const notified = getNotifiedIds();
    for (const r of data as any[]) {
      if (notified.has(r.id)) continue;

      const typeLabel =
        r.reminder_type === "study_session" ? "📚 Study Session" :
        r.reminder_type === "exam_countdown" ? "🎓 Exam Alert" : "✅ Task";

      showNotification(
        `${typeLabel}: ${r.title}`,
        r.description || "Your reminder is due now!"
      );
      markNotified(r.id);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Initial check after short delay
    const timeout = setTimeout(checkReminders, 2000);

    intervalRef.current = setInterval(checkReminders, POLL_INTERVAL);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
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
