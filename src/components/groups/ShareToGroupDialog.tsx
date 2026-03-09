import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface ShareToGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outputId: string;
  onSuccess?: () => void;
}

const ShareToGroupDialog = ({ open, onOpenChange, outputId, onSuccess }: ShareToGroupDialogProps) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadGroups();
    }
  }, [open, user]);

  const loadGroups = async () => {
    if (!user) return;
    setLoading(true);

    const { data: memberships } = await supabase
      .from("group_memberships")
      .select("group_id, study_groups(*)")
      .eq("user_id", user.id);

    if (memberships) {
      setGroups(memberships.map((m: any) => m.study_groups));
    }
    setLoading(false);
  };

  const handleShare = async () => {
    if (!selectedGroup || !user) return;
    setSharing(true);

    // Check if already shared
    const { data: existing } = await supabase
      .from("shared_content")
      .select("id")
      .eq("group_id", selectedGroup)
      .eq("output_id", outputId)
      .maybeSingle();

    if (existing) {
      toast({
        title: "Already shared",
        description: "This content is already in the group",
      });
      setSharing(false);
      return;
    }

    const { error } = await supabase.from("shared_content").insert({
      group_id: selectedGroup,
      output_id: outputId,
      shared_by: user.id,
    });

    if (error) {
      toast({
        title: "Failed to share",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Shared successfully!",
        description: "Your content has been shared with the group",
      });
      onSuccess?.();
      onOpenChange(false);
    }
    setSharing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share to Group</DialogTitle>
          <DialogDescription>Choose a study group to share this content with</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground">You're not in any groups yet</p>
            <p className="text-xs text-muted-foreground">Create or join a group first</p>
          </div>
        ) : (
          <div className="space-y-4">
            <RadioGroup value={selectedGroup} onValueChange={setSelectedGroup}>
              <div className="space-y-2">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={group.id} id={group.id} />
                    <Label
                      htmlFor={group.id}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {group.name}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={sharing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleShare}
                disabled={!selectedGroup || sharing}
                className="flex-1 gap-2"
              >
                {sharing ? (
                  <>Sharing...</>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" /> Share
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareToGroupDialog;
