import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const JoinGroup = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const [status, setStatus] = useState<"checking" | "already_member" | "ready" | "joined" | "error">("checking");

  useEffect(() => {
    if (!groupId || !user) return;

    const checkGroupAndMembership = async () => {
      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from("study_groups")
        .select("*")
        .eq("id", groupId)
        .maybeSingle();

      if (groupError || !groupData) {
        setStatus("error");
        setLoading(false);
        return;
      }

      setGroup(groupData);

      // Check if already a member
      const { data: membership } = await supabase
        .from("group_memberships")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership) {
        setStatus("already_member");
      } else {
        setStatus("ready");
      }
      setLoading(false);
    };

    checkGroupAndMembership();
  }, [groupId, user]);

  const handleJoin = async () => {
    if (!groupId || !user) return;
    setLoading(true);

    const { error } = await supabase.from("group_memberships").insert({
      group_id: groupId,
      user_id: user.id,
      role: "member",
    });

    if (error) {
      toast({ title: "Failed to join group", description: error.message, variant: "destructive" });
      setStatus("error");
    } else {
      setStatus("joined");
      toast({ title: "Welcome!", description: `You've joined ${group?.name}` });
      setTimeout(() => navigate(`/groups/${groupId}`), 1500);
    }
    setLoading(false);
  };

  if (loading && status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading group details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-destructive/50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="rounded-full p-3 bg-destructive/10 w-fit mx-auto">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Invalid Invite Link</h2>
              <p className="text-muted-foreground text-sm">This group doesn't exist or the link has expired.</p>
            </div>
            <Button onClick={() => navigate("/groups")} variant="outline" className="w-full">
              Browse Groups
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "already_member") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="rounded-full p-3 bg-primary/10 w-fit mx-auto">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Already a Member</h2>
              <p className="text-muted-foreground text-sm">You're already part of {group?.name}</p>
            </div>
            <Button onClick={() => navigate(`/groups/${groupId}`)} className="w-full">
              Go to Group
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "joined") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="rounded-full p-3 bg-success/10 w-fit mx-auto">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
              <p className="text-muted-foreground text-sm">Redirecting you to the group...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="rounded-full p-4 bg-primary/10 w-fit mx-auto">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Join Study Group</h2>
              <p className="text-muted-foreground text-sm">You've been invited to join</p>
            </div>
          </div>

          {group && (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <h3 className="font-semibold text-lg mb-1">{group.name}</h3>
              {group.description && (
                <p className="text-sm text-muted-foreground">{group.description}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Button onClick={handleJoin} disabled={loading} className="w-full" size="lg">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join Group
            </Button>
            <Button onClick={() => navigate("/groups")} variant="ghost" className="w-full">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinGroup;
