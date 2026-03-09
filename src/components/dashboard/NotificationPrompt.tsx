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
    <Card className="border-accent-foreground/15 bg-gradient-to-r from-accent/50 to-accent/20 overflow-hidden shadow-premium animate-scale-in">
      <CardContent className="p-4 flex items-center gap-3.5">
        <div className="rounded-2xl p-3 bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground text-sm">Enable Notifications</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Get alerts for reminders and study sessions</p>
        </div>
        <Button size="sm" onClick={handleEnable} className="shrink-0 rounded-xl">Enable</Button>
        <Button size="icon" variant="ghost" onClick={handleDismiss} className="shrink-0 h-8 w-8 rounded-xl">
          <X className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationPrompt;
