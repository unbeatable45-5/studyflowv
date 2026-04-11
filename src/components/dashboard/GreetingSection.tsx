import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, PartyPopper } from "lucide-react";

const GreetingSection = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (!user) return;

    const createdAt = new Date(user.created_at);
    const now = new Date();
    const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    setIsNewUser(diffHours < 24);

    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name || user.email?.split("@")[0] || "Student");
      });
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-2">
      {isNewUser && (
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-primary/10 to-accent/40 rounded-2xl px-4 py-3 mb-3 animate-scale-in">
          <PartyPopper className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-primary">
          Welcome to StudyFlow! Turn your notes into exam questions below.
        </p>
        </div>
      )}
      <h1 className="text-[1.65rem] font-display font-extrabold text-foreground leading-tight tracking-tight">
        {greeting}, {displayName}! 👋
      </h1>
      <p className="text-muted-foreground text-sm flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-warning" />
        What do you want to prepare for today?
      </p>
    </div>
  );
};

export default GreetingSection;
