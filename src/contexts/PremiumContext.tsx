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
  | "collaboration"
  | "practice_exam"
  | "ai_tutor"
  | "deep_think";

const FREE_LIMITS = {
  summaries_per_day: 3,
  pdfs_per_day: 3,
  daily_questions: 1,
  flashcard_sets: 5,
  deep_think_per_day: 2,
  practice_exams_per_week: 1,
  mind_maps_per_week: 1,
};

const PRO_LIMITS = {
  summaries_per_day: 50,
  pdfs_per_day: 50,
  daily_questions: 10,
  flashcard_sets: Infinity,
  deep_think_per_day: 20,
  practice_exams_per_week: Infinity,
  mind_maps_per_week: Infinity,
};

// Features that are premium-only (no free access at all)
const PREMIUM_ONLY_FEATURES: PremiumFeature[] = [
  "unlimited_summaries",
  "unlimited_pdfs",
  "personalized_packs",
  "weak_topic_ai",
  "priority_ai",
  "bulk_export",
  "lecture_capture_full",
  "detailed_analytics",
  "collaboration",
];

// Features that have limited free trials
const FREE_TRIAL_FEATURES: PremiumFeature[] = [
  "practice_exam",
  "mind_maps",
  "deep_think",
  "spaced_repetition",
  "ai_tutor",
  "advanced_flashcards",
  "multiple_daily_questions",
];

interface PremiumContextType {
  isPremium: boolean;
  loading: boolean;
  limits: typeof FREE_LIMITS;
  canAccess: (feature: PremiumFeature) => boolean;
  usesLeft: (resource: "summaries" | "pdfs" | "daily_questions" | "deep_think") => number;
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

export const PremiumProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [todayUsage, setTodayUsage] = useState({ summaries: 0, pdfs: 0, daily_questions: 0, deep_think: 0 });

  useEffect(() => {
    if (!user) {
      setIsPremium(false);
      setLoading(false);
      return;
    }

    const checkPremium = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && data.status === "active" && data.current_period_end) {
        const isValid = new Date(data.current_period_end) > new Date();
        setIsPremium(isValid);
      } else {
        setIsPremium(false);
      }
      setLoading(false);
    };

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
        deep_think: outputs.filter((o) => o.tool === "ai-tutor-deep").length,
      });
    };

    checkPremium();
    countUsage();
  }, [user]);

  const limits = isPremium ? PRO_LIMITS : FREE_LIMITS;

  const canAccess = useCallback(
    (feature: PremiumFeature) => {
      if (isPremium) return true;
      // Premium-only features are blocked for free users
      if (PREMIUM_ONLY_FEATURES.includes(feature)) return false;
      // Free trial features are allowed (with limits enforced elsewhere)
      if (FREE_TRIAL_FEATURES.includes(feature)) return true;
      return true;
    },
    [isPremium]
  );

  const usesLeft = useCallback(
    (resource: "summaries" | "pdfs" | "daily_questions" | "deep_think") => {
      const limitMap = isPremium
        ? {
            summaries: PRO_LIMITS.summaries_per_day,
            pdfs: PRO_LIMITS.pdfs_per_day,
            daily_questions: PRO_LIMITS.daily_questions,
            deep_think: PRO_LIMITS.deep_think_per_day,
          }
        : {
            summaries: FREE_LIMITS.summaries_per_day,
            pdfs: FREE_LIMITS.pdfs_per_day,
            daily_questions: FREE_LIMITS.daily_questions,
            deep_think: FREE_LIMITS.deep_think_per_day,
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
