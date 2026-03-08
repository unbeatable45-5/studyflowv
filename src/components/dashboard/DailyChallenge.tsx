import { Link } from "react-router-dom";
import { Flame, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const challenges = [
  "Study a new topic for 25 minutes using Pomodoro",
  "Create flashcards on a topic you're struggling with",
  "Summarize your latest class notes",
  "Review 3 old flashcard sets",
  "Plan your revision schedule for the week",
  "Upload a PDF and read the AI summary",
  "Complete a full Study Mode session",
];

const DailyChallenge = () => {
  const dayIndex = Math.floor(Date.now() / 86400000) % challenges.length;
  const challenge = challenges[dayIndex];

  return (
    <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-warning/10 overflow-hidden">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="rounded-xl p-3 bg-warning/15 text-warning shrink-0">
          <Flame className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground text-sm">Daily Challenge</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{challenge}</p>
        </div>
        <Link to="/study-mode">
          <ArrowRight className="h-5 w-5 text-warning shrink-0" />
        </Link>
      </CardContent>
    </Card>
  );
};

export default DailyChallenge;
