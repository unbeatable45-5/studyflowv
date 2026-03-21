import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Loader2, Camera, X } from "lucide-react";

const SUBJECT_OPTIONS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "English", "History", "Geography", "Economics", "Psychology",
  "Philosophy", "Art", "Music", "Law", "Business Studies",
  "Sociology", "Political Science", "Literature", "Medicine", "Engineering",
];

interface ProfileFormProps {
  displayName: string;
  setDisplayName: (v: string) => void;
  avatarUrl: string;
  setAvatarUrl: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  studyGoal: string;
  setStudyGoal: (v: string) => void;
  preferredSubjects: string[];
  setPreferredSubjects: React.Dispatch<React.SetStateAction<string[]>>;
}

const ProfileForm = ({
  displayName, setDisplayName,
  avatarUrl, setAvatarUrl,
  bio, setBio,
  studyGoal, setStudyGoal,
  preferredSubjects, setPreferredSubjects,
}: ProfileFormProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

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
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    setAvatarUrl(newUrl);
    await supabase.from("profiles").update({ avatar_url: newUrl } as any).eq("user_id", user.id);
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
      .update({ display_name: displayName, avatar_url: avatarUrl, bio, study_goal: studyGoal, preferred_subjects: preferredSubjects } as any)
      .eq("user_id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Personal Information</CardTitle>
        <CardDescription>Update your profile details and study preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col items-center gap-3">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="relative cursor-pointer rounded-full">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="text-lg font-display bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 border-2 border-card shadow-sm">
                {uploading ? <Loader2 className="h-3.5 w-3.5 text-primary-foreground animate-spin" /> : <Camera className="h-3.5 w-3.5 text-primary-foreground" />}
              </span>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarUpload} className="hidden" />
            </button>
            <p className="text-xs text-muted-foreground">Tap to upload (max 2MB)</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="studyGoal">Study goal</Label>
              <Input id="studyGoal" value={studyGoal} onChange={(e) => setStudyGoal(e.target.value)} placeholder="e.g. Pass A-Levels" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} maxLength={300} />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
          </div>

          <div className="space-y-2">
            <Label>Preferred subjects <span className="text-muted-foreground font-normal">(up to 8)</span></Label>
            <div className="flex flex-wrap gap-1.5">
              {SUBJECT_OPTIONS.map(subject => {
                const selected = preferredSubjects.includes(subject);
                return (
                  <Badge key={subject} variant={selected ? "default" : "outline"} className="cursor-pointer transition-colors select-none text-xs" onClick={() => toggleSubject(subject)}>
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
  );
};

export default ProfileForm;
