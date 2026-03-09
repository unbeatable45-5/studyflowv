import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Shield, UserMinus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface GroupMembersProps {
  groupId: string;
  currentUserRole: string;
}

const GroupMembers = ({ groupId, currentUserRole }: GroupMembersProps) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  const loadMembers = async () => {
    const { data } = await supabase
      .from("group_memberships")
      .select("*, profiles(*)")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true });

    if (data) setMembers(data);
    setLoading(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from("group_memberships")
      .delete()
      .eq("id", memberId);

    if (!error) {
      toast({ title: "Member removed" });
      loadMembers();
    }
  };

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  if (loading) {
    return <div className="text-center text-sm text-muted-foreground">Loading members...</div>;
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const profile = member.profiles;
        const initial = profile?.display_name?.[0]?.toUpperCase() || "?";
        const isCurrentUser = member.user_id === user?.id;

        return (
          <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">
                  {profile?.display_name || "Unknown"}
                  {isCurrentUser && (
                    <span className="text-muted-foreground ml-1">(you)</span>
                  )}
                </p>
                {member.role === "owner" && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Crown className="h-3 w-3" /> Owner
                  </Badge>
                )}
                {member.role === "admin" && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Shield className="h-3 w-3" /> Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Joined {new Date(member.joined_at).toLocaleDateString()}
              </p>
            </div>
            {canManage && !isCurrentUser && member.role !== "owner" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveMember(member.id)}
                className="shrink-0 text-destructive hover:text-destructive"
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GroupMembers;
