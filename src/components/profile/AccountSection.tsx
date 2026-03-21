import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/contexts/PremiumContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Crown, ChevronRight, Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const AccountSection = () => {
  const { user, signOut } = useAuth();
  const { isPremium } = usePremium();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
  };

  return (
    <div className="space-y-4">
      <Link to="/subscription">
        <Card className="hover:bg-muted/80 transition-colors cursor-pointer">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${isPremium ? "bg-warning/15" : "bg-muted"}`}>
                <Crown className={`h-4 w-4 ${isPremium ? "text-warning" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Subscription</p>
                <p className="text-xs text-muted-foreground">{isPremium ? "StudyFlow Pro — Active" : "Free Plan"}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
          <CardDescription>Manage your account settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-muted">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSection;
