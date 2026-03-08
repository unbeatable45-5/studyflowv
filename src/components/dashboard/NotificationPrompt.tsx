import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { requestNotificationPermission, getNotificationPermission } from "@/hooks/use-reminder-notifications";
import { toast } from "@/hooks/use-toast";

const NotificationPrompt = () => {
  const permission = getNotificationPermission();
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("notif_prompt_dismissed") === "true"
  );

  if (permission === "granted" || permission === "denied" || permission === "unsupported" || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    const result = await requestNotificationPermission();
    if (result === "granted") {
      toast({ title: "Notifications enabled! 🔔" });
    } else {
      toast({ title: "Notifications blocked", description: "You can enable them in browser settings", variant: "destructive" });
    }
    setDismissed(true);
    localStorage.setItem("notif_prompt_dismissed", "true");
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("notif_prompt_dismissed", "true");
  };

  return (
    <Card className="border-accent/30 bg-accent/5 overflow-hidden">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-xl p-2.5 bg-accent text-accent-foreground">
          <Bell className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground text-sm">Enable Notifications</h3>
          <p className="text-xs text-muted-foreground">Get alerts for reminders and study sessions</p>
        </div>
        <Button size="sm" onClick={handleEnable} className="shrink-0">Enable</Button>
        <Button size="icon" variant="ghost" onClick={handleDismiss} className="shrink-0 h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationPrompt;
