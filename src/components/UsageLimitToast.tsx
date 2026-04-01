import { usePremium } from "@/contexts/PremiumContext";
import { toast } from "@/hooks/use-toast";
import { useCallback } from "react";

/**
 * Hook that checks usage limits and shows upgrade prompts when limits are hit.
 */
export function useUsageLimitCheck() {
  const { isPremium, usesLeft, promptUpgrade } = usePremium();

  const checkAndPrompt = useCallback(
    (resource: "summaries" | "pdfs" | "daily_questions" | "deep_think", actionLabel?: string) => {
      const remaining = usesLeft(resource);
      if (remaining <= 0 && !isPremium) {
        toast({
          title: "Daily limit reached",
          description: `You've used all your free ${actionLabel || resource} for today. Upgrade to Pro for higher limits!`,
          variant: "destructive",
        });
        setTimeout(() => promptUpgrade(), 500);
        return false;
      }
      if (remaining === 1 && !isPremium) {
        toast({
          title: "Almost at your limit",
          description: `You have 1 free ${actionLabel || resource} use left today.`,
        });
      }
      return true;
    },
    [isPremium, usesLeft, promptUpgrade]
  );

  return { checkAndPrompt };
}
