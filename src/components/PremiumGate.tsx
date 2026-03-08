import { usePremium, PremiumFeature } from "@/contexts/PremiumContext";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
  /** Show inline lock badge instead of overlay */
  inline?: boolean;
  /** Custom label for the locked state */
  label?: string;
  className?: string;
}

/**
 * Wraps content that requires premium.
 * Free users see a locked overlay or badge; premium users see children normally.
 */
const PremiumGate = ({ feature, children, inline = false, label, className }: PremiumGateProps) => {
  const { canAccess, promptUpgrade } = usePremium();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  if (inline) {
    return (
      <button
        onClick={promptUpgrade}
        className={cn(
          "flex items-center gap-1.5 text-xs text-muted-foreground hover:text-warning transition-colors",
          className
        )}
      >
        <Lock className="h-3 w-3" />
        <span>{label || "Pro"}</span>
      </button>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      <div className="opacity-40 pointer-events-none select-none blur-[1px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 backdrop-blur-sm rounded-xl">
        <div className="rounded-full p-2.5 bg-warning/15 text-warning">
          <Crown className="h-5 w-5" />
        </div>
        <p className="text-xs font-medium text-foreground">{label || "Premium Feature"}</p>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs border-warning/30 text-warning hover:bg-warning/10" onClick={promptUpgrade}>
          <Crown className="h-3.5 w-3.5" /> Upgrade
        </Button>
      </div>
    </div>
  );
};

export default PremiumGate;
