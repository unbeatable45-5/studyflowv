import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, ArrowRight, CheckCircle2, XCircle, Loader2, Lightbulb, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface QuestionData {
  topic: string;
  question: string;
  type: string;
  options: string[];
  correct_answer: string;
  hint: string;
}

interface FeedbackData {
  correct: boolean;
  explanation: string;
}

const DailyChallenge = () => {
  const { user } = useAuth();
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [checking, setChecking] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const fetchQuestion = async () => {
    setLoading(true);
    setSelectedOption(null);
    setFeedback(null);
    setShowHint(false);

    try {
      // Get user's recent topics
      let topics: string[] = [];
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_subjects")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile?.preferred_subjects?.length) {
          topics = profile.preferred_subjects;
        }

        // Also get recent study topics
        const { data: recentOutputs } = await supabase
          .from("saved_outputs")
          .select("input_data")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (recentOutputs) {
          recentOutputs.forEach((o: any) => {
            const d = o.input_data as any;
            if (d?.topic && !topics.includes(d.topic)) topics.push(d.topic);
          });
        }
      }

      const { data, error } = await supabase.functions.invoke("daily-question", {
        body: { topics, mode: "generate" },
      });

      if (error) throw error;
      if (data?.question) {
        setQuestionData(data);
      }
    } catch (e) {
      console.error("Failed to fetch daily question:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, [user]);

  const handleAnswer = async (option: string) => {
    if (feedback || checking) return;
    setSelectedOption(option);
    setChecking(true);

    try {
      const { data, error } = await supabase.functions.invoke("daily-question", {
        body: {
          mode: "check",
          question: questionData?.question,
          answer: option,
          topics: [],
        },
      });

      if (error) throw error;
      setFeedback(data);
    } catch {
      // Fallback: compare locally
      const letter = option.charAt(0);
      setFeedback({
        correct: letter === questionData?.correct_answer,
        explanation: letter === questionData?.correct_answer
          ? "Correct! Well done."
          : `The correct answer was ${questionData?.correct_answer}.`,
      });
    } finally {
      setChecking(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-warning/10 overflow-hidden">
        <CardContent className="p-5 flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-warning animate-spin" />
          <p className="text-sm text-muted-foreground">Generating your daily challenge…</p>
        </CardContent>
      </Card>
    );
  }

  // No question loaded — show static fallback
  if (!questionData) {
    return (
      <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-warning/10 overflow-hidden">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="rounded-xl p-3 bg-warning/15 text-warning shrink-0">
            <Flame className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-foreground text-sm">Daily Challenge</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Start a study session to unlock daily questions!</p>
          </div>
          <Link to="/study-mode">
            <ArrowRight className="h-5 w-5 text-warning shrink-0" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-warning/10 overflow-hidden animate-fade-in">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2.5 bg-warning/15 text-warning shrink-0">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground text-sm">Daily Challenge</h3>
              <p className="text-xs text-muted-foreground">{questionData.topic}</p>
            </div>
          </div>
          {feedback && (
            <Button variant="ghost" size="sm" onClick={fetchQuestion} className="gap-1 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> New
            </Button>
          )}
        </div>

        {/* Question */}
        <p className="text-sm font-medium text-foreground leading-relaxed">
          {questionData.question}
        </p>

        {/* Options */}
        <div className="grid gap-2">
          {questionData.options.map((opt) => {
            const letter = opt.charAt(0);
            const isSelected = selectedOption === opt;
            const isCorrect = feedback && letter === questionData.correct_answer;
            const isWrong = feedback && isSelected && !feedback.correct;

            return (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                disabled={!!feedback || checking}
                className={cn(
                  "w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-all duration-200",
                  !feedback && !isSelected && "border-border bg-card hover:border-warning/50 hover:bg-warning/5",
                  !feedback && isSelected && "border-warning bg-warning/10",
                  isCorrect && "border-success bg-success/10 text-success",
                  isWrong && "border-destructive bg-destructive/10 text-destructive",
                  feedback && !isCorrect && !isWrong && "opacity-50"
                )}
              >
                <div className="flex items-center gap-2">
                  {isCorrect && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                  {isWrong && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                  <span>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Checking indicator */}
        {checking && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Checking your answer…
          </div>
        )}

        {/* Hint */}
        {!feedback && !showHint && (
          <button
            onClick={() => setShowHint(true)}
            className="text-xs text-warning hover:underline flex items-center gap-1"
          >
            <Lightbulb className="h-3.5 w-3.5" /> Show hint
          </button>
        )}
        {showHint && !feedback && (
          <p className="text-xs text-muted-foreground bg-warning/5 rounded-lg px-3 py-2">
            💡 {questionData.hint}
          </p>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={cn(
            "rounded-lg px-3 py-2.5 text-sm animate-fade-in",
            feedback.correct ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20"
          )}>
            <div className="flex items-center gap-2 font-medium mb-1">
              {feedback.correct ? (
                <><CheckCircle2 className="h-4 w-4 text-success" /> Correct! 🎉</>
              ) : (
                <><XCircle className="h-4 w-4 text-destructive" /> Not quite</>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{feedback.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyChallenge;
