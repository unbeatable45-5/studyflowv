import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";

const GreetingSection = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
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
    <div className="space-y-1">
      <h1 className="text-2xl font-display font-bold text-foreground">
        {greeting}, {displayName}! 👋
      </h1>
      <p className="text-muted-foreground flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-warning" />
        Ready to study smarter today?
      </p>
    </div>
  );
};

export default GreetingSection;
