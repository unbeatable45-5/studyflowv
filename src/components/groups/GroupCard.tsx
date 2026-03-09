import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, Shield } from "lucide-react";

interface GroupCardProps {
  group: any;
  onClick: () => void;
}

const GroupCard = ({ group, onClick }: GroupCardProps) => {
  const getRoleBadge = () => {
    if (group.user_role === "owner") {
      return (
        <Badge variant="secondary" className="gap-1 text-xs">
          <Crown className="h-3 w-3" /> Owner
        </Badge>
      );
    }
    if (group.user_role === "admin") {
      return (
        <Badge variant="secondary" className="gap-1 text-xs">
          <Shield className="h-3 w-3" /> Admin
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg p-2.5 bg-primary/10 text-primary shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{group.name}</h3>
              {getRoleBadge()}
            </div>
            {group.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {group.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupCard;
