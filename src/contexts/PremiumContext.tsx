import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type PremiumFeature =
  | "unlimited_summaries"
  | "unlimited_pdfs"
  | "advanced_flashcards"
  | "spaced_repetition"
  | "personalized_packs"
  | "weak_topic_ai"
  | "priority_ai"
  | "bulk_export"
  | "lecture_capture_full"
  | "multiple_daily_questions"
  | "detailed_analytics"
  | "mind_maps"
  | "collaboration";

const FREE_LIMITS = {
  summaries_per_day: 3,
  pdfs_per_day: 3,
  daily_questions: 1,
  flashcard_sets: 5,
};

const PREMIUM_LIMITS = {
  summaries_per_day: Infinity,
  pdfs_per_day: Infinity,
  daily_questions: 10,
  flashcard_sets: Infinity,
};

interface PremiumContextType {
  isPremium: boolean;
  loading: boolean;
  limits: typeof FREE_LIMITS;
  canAccess: (feature: PremiumFeature) => boolean;
  /** Returns number of uses left today for a capped resource */
  usesLeft: (resource: "summaries" | "pdfs" | "daily_questions") => number;
  /** Trigger upgrade flow */
  promptUpgrade: () => void;
  showUpgradeDialog: boolean;
  setShowUpgradeDialog: (v: boolean) => void;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  loading: true,
  limits: FREE_LIMITS,
  canAccess: () => false,
  usesLeft: () => 0,
  promptUpgrade: () => {},
  showUpgradeDialog: false,
  setShowUpgradeDialog: () => {},
});

export const usePremium = () => useContext(PremiumContext);

const PREMIUM_FEATURES: PremiumFeature[] = [
  "unlimited_summaries",
  "unlimited_pdfs",
  "advanced_flashcards",
  "spaced_repetition",
  "personalized_packs",
  "weak_topic_ai",
  "priority_ai",
  "bulk_export",
  "lecture_capture_full",
  "multiple_daily_questions",
  "detailed_analytics",
  "mind_maps",
  "collaboration",
];

export const PremiumProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [todayUsage, setTodayUsage] = useState({ summaries: 0, pdfs: 0, daily_questions: 0 });

  // Check premium status — will be wired to Stripe later
  useEffect(() => {
    if (!user) {
      setIsPremium(false);
      setLoading(false);
      return;
    }

    // For now, check a simple flag. This will be replaced by Stripe subscription check.
    const checkPremium = async () => {
      // TODO: Replace with Stripe subscription status check
      setIsPremium(false);
      setLoading(false);
    };

    // Count today's usage
    const countUsage = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("saved_outputs")
        .select("tool")
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00`);

      const outputs = data ?? [];
      setTodayUsage({
        summaries: outputs.filter((o) => ["study-helper", "note-organizer", "pdf-summarizer"].includes(o.tool)).length,
        pdfs: outputs.filter((o) => o.tool === "pdf-summarizer").length,
        daily_questions: outputs.filter((o) => o.tool === "daily-question").length,
      });
    };

    checkPremium();
    countUsage();
  }, [user]);

  const limits = isPremium ? PREMIUM_LIMITS : FREE_LIMITS;

  const canAccess = useCallback(
    (feature: PremiumFeature) => {
      if (isPremium) return true;
      // Free users can't access premium-only features
      return !PREMIUM_FEATURES.includes(feature);
    },
    [isPremium]
  );

  const usesLeft = useCallback(
    (resource: "summaries" | "pdfs" | "daily_questions") => {
      if (isPremium) return Infinity;
      const limitMap = {
        summaries: FREE_LIMITS.summaries_per_day,
        pdfs: FREE_LIMITS.pdfs_per_day,
        daily_questions: FREE_LIMITS.daily_questions,
      };
      return Math.max(0, limitMap[resource] - todayUsage[resource]);
    },
    [isPremium, todayUsage]
  );

  const promptUpgrade = useCallback(() => {
    setShowUpgradeDialog(true);
  }, []);

  return (
    <PremiumContext.Provider
      value={{ isPremium, loading, limits, canAccess, usesLeft, promptUpgrade, showUpgradeDialog, setShowUpgradeDialog }}
    >
      {children}
    </PremiumContext.Provider>
  );
};
