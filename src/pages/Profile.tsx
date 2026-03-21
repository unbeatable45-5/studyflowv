import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/contexts/PremiumContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { User as UserIcon, Loader2, Camera, X, Plus, Crown, ChevronRight, Moon, Sun } from "lucide-react";

const SUBJECT_OPTIONS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "English", "History", "Geography", "Economics", "Psychology",
  "Philosophy", "Art", "Music", "Law", "Business Studies",
  "Sociology", "Political Science", "Literature", "Medicine", "Engineering",
];

const Profile = () => {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [studyGoal, setStudyGoal] = useState("");
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    setAvatarUrl(newUrl);

    await supabase
      .from("profiles")
      .update({ avatar_url: newUrl } as any)
      .eq("user_id", user.id);

    setUploading(false);
    toast({ title: "Avatar updated!" });
  };

  const toggleSubject = (subject: string) => {
    setPreferredSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : prev.length < 8 ? [...prev, subject] : prev
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        avatar_url: avatarUrl,
        bio,
        study_goal: studyGoal,
        preferred_subjects: preferredSubjects,
      } as any)
      .eq("user_id", user.id);

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
    }
  };

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-2">
            <UserIcon className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold">Profile Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">Personalize your account and study preferences.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="relative cursor-pointer rounded-full"
              >
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-xl font-display bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 border-2 border-card shadow-sm">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 text-primary-foreground" />
                  )}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </button>
              <p className="text-xs text-muted-foreground">Tap to upload a photo (max 2MB)</p>
            </div>

            {/* Display name */}
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
            </div>

            {/* Study Goal */}
            <div className="space-y-1.5">
              <Label htmlFor="studyGoal">Study goal</Label>
              <Input
                id="studyGoal"
                value={studyGoal}
                onChange={(e) => setStudyGoal(e.target.value)}
                placeholder="e.g. Pass all A-Levels with A grades"
              />
            </div>

            {/* Preferred Subjects */}
            <div className="space-y-2">
              <Label>Preferred subjects <span className="text-muted-foreground font-normal">(up to 8)</span></Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map(subject => {
                  const selected = preferredSubjects.includes(subject);
                  return (
                    <Badge
                      key={subject}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer transition-colors select-none"
                      onClick={() => toggleSubject(subject)}
                    >
                      {selected && <X className="h-3 w-3 mr-0.5" />}
                      {subject}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Subscription link */}
      <Link to="/subscription">
        <Card className="hover:bg-muted/80 transition-colors cursor-pointer">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${isPremium ? "bg-warning/15" : "bg-muted"}`}>
                <Crown className={`h-4 w-4 ${isPremium ? "text-warning" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Subscription</p>
                <p className="text-xs text-muted-foreground">
                  {isPremium ? "StudyFlow Pro — Active" : "Free Plan"}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Email:</span> {user?.email}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
