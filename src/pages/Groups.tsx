import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, Users as UsersIcon } from "lucide-react";
import CreateGroupDialog from "@/components/groups/CreateGroupDialog";
import GroupCard from "@/components/groups/GroupCard";

const Groups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadGroups();
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;

    const { data: memberships } = await supabase
      .from("group_memberships")
      .select("group_id, role, study_groups(*)")
      .eq("user_id", user.id);

    if (memberships) {
      const groupsData = memberships.map((m: any) => ({
        ...m.study_groups,
        user_role: m.role,
      }));
      setGroups(groupsData);
    }
    setLoading(false);
  };

  const handleGroupCreated = () => {
    setCreateOpen(false);
    loadGroups();
  };

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-24 bg-muted rounded"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Study Groups</h1>
          <p className="text-sm text-muted-foreground">Collaborate with peers</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Create
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <div className="rounded-full p-4 bg-muted w-fit mx-auto">
            <UsersIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">No Groups Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create or join a group to start collaborating
            </p>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create Your First Group
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onClick={() => navigate(`/groups/${group.id}`)}
            />
          ))}
        </div>
      )}

      <CreateGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleGroupCreated}
      />
    </div>
  );
};

export default Groups;
