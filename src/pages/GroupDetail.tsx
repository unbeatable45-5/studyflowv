import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, UserPlus, Settings, LogOut } from "lucide-react";
import GroupFeed from "@/components/groups/GroupFeed";
import GroupMembers from "@/components/groups/GroupMembers";
import InviteMemberDialog from "@/components/groups/InviteMemberDialog";
import { toast } from "@/hooks/use-toast";

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!groupId || !user) return;
    loadGroup();
  }, [groupId, user]);

  const loadGroup = async () => {
    if (!groupId || !user) return;

    const [groupRes, membershipRes] = await Promise.all([
      supabase.from("study_groups").select("*").eq("id", groupId).maybeSingle(),
      supabase
        .from("group_memberships")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (groupRes.data) setGroup(groupRes.data);
    if (membershipRes.data) setMembership(membershipRes.data);
    setLoading(false);
  };

  const handleLeaveGroup = async () => {
    if (!groupId || !user) return;

    if (group?.owner_id === user.id) {
      toast({
        title: "Cannot leave group",
        description: "Transfer ownership before leaving",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("group_memberships")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);

    if (!error) {
      toast({ title: "Left group" });
      navigate("/groups");
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/2"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    );
  }

  if (!group || !membership) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto text-center space-y-4">
        <h2 className="text-xl font-semibold">Group not found</h2>
        <Button onClick={() => navigate("/groups")}>Back to Groups</Button>
      </div>
    );
  }

  const isAdmin = membership.role === "owner" || membership.role === "admin";

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/groups")}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-display font-bold truncate">{group.name}</h1>
          {group.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
          )}
        </div>
        {isAdmin && (
          <Button variant="ghost" size="icon" onClick={() => setInviteOpen(true)} className="shrink-0">
            <UserPlus className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="feed" className="mt-4">
          <GroupFeed groupId={groupId!} />
        </TabsContent>
        <TabsContent value="members" className="mt-4">
          <GroupMembers groupId={groupId!} currentUserRole={membership.role} />
        </TabsContent>
      </Tabs>

      {group.owner_id !== user?.id && (
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive hover:text-destructive"
          onClick={handleLeaveGroup}
        >
          <LogOut className="h-4 w-4" /> Leave Group
        </Button>
      )}

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        groupId={groupId!}
        groupName={group.name}
      />
    </div>
  );
};

export default GroupDetail;
