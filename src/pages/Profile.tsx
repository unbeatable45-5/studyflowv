import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, UserCircle, Bell, Palette, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import ProfileForm from "@/components/profile/ProfileForm";
import NotificationPreferences from "@/components/profile/NotificationPreferences";
import AppearanceSettings from "@/components/profile/AppearanceSettings";
import AccountSection from "@/components/profile/AccountSection";

const tabs = [
  { id: "profile", label: "Profile", icon: UserCircle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "account", label: "Account", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

const Profile = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [studyGoal, setStudyGoal] = useState("");
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>([]);
  const [fetching, setFetching] = useState(true);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url, bio, study_goal, preferred_subjects")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDisplayName((data as any).display_name ?? "");
          setAvatarUrl((data as any).avatar_url ?? "");
          setBio((data as any).bio ?? "");
          setStudyGoal((data as any).study_goal ?? "");
          setPreferredSubjects((data as any).preferred_subjects ?? []);
        }
        setFetching(false);
      });
  }, [user]);

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <ProfileForm
            displayName={displayName} setDisplayName={setDisplayName}
            avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl}
            bio={bio} setBio={setBio}
            studyGoal={studyGoal} setStudyGoal={setStudyGoal}
            preferredSubjects={preferredSubjects} setPreferredSubjects={setPreferredSubjects}
          />
        );
      case "notifications":
        return <NotificationPreferences />;
      case "appearance":
        return <AppearanceSettings dark={dark} setDark={setDark} />;
      case "account":
        return <AccountSection />;
    }
  };

  // Mobile: horizontal scrolling tabs at top
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="px-4 pt-5 pb-2">
          <h1 className="text-xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Horizontal scrollable tabs */}
        <div className="px-4 py-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                  activeTab === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 px-4 pb-6 space-y-4">
          {renderContent()}
        </div>
      </div>
    );
  }

  // Desktop: side navigation + content
  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, notifications, and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Side nav */}
        <nav className="w-56 shrink-0 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                activeTab === id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Profile;
