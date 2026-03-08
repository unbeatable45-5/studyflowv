import { Link } from "react-router-dom";
import { Crown, Zap, BarChart3, Layers, FileText, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Zap, label: "Unlimited AI summaries", free: "5/day" },
  { icon: FileText, label: "Unlimited PDF uploads", free: "3/day" },
  { icon: Layers, label: "Advanced flashcard modes", free: "Basic" },
  { icon: BarChart3, label: "Detailed analytics", free: "Basic stats" },
];

const UpgradePrompt = () => (
  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-warning/5 overflow-hidden">
    <CardContent className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-2.5 bg-warning/15 text-warning">
          <Crown className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground text-sm">Upgrade to Pro</h3>
          <p className="text-xs text-muted-foreground">Unlock the full StudyFlow experience</p>
        </div>
      </div>

      <div className="grid gap-2">
        {features.map(({ icon: Icon, label, free }) => (
          <div key={label} className="flex items-center gap-3 text-sm">
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <span className="flex-1 text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground">{free}</span>
          </div>
        ))}
      </div>

      <Button className="w-full gap-2" size="sm" disabled>
        <Crown className="h-4 w-4" /> Coming Soon
      </Button>
    </CardContent>
  </Card>
);

export default UpgradePrompt;
