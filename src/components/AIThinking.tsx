import { Loader2, Brain, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AIThinkingProps {
  message?: string;
  className?: string;
}

const thinkingDots = (
  <span className="inline-flex gap-1 ml-1">
    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
  </span>
);

const AIThinking = ({ message = "Thinking", className }: AIThinkingProps) => (
  <Card className={cn("border-primary/20 overflow-hidden", className)}>
    <div className="h-1 w-full bg-primary/10 overflow-hidden">
      <div className="h-full w-1/3 bg-primary/50 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
    </div>
    <CardContent className="p-5 flex flex-col items-center gap-4">
      <div className="relative">
        <div className="rounded-full p-4 bg-primary/10">
          <Brain className="h-7 w-7 text-primary animate-pulse" />
        </div>
        <Sparkles className="h-4 w-4 text-warning absolute -top-1 -right-1 animate-bounce" />
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-sm font-medium text-foreground flex items-center justify-center">
          {message}{thinkingDots}
        </p>
        <p className="text-xs text-muted-foreground">This may take a few seconds</p>
      </div>
      <div className="flex gap-3 w-full max-w-[200px]">
        <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary/30 rounded-full animate-[pulse_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
        </div>
        <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary/20 rounded-full animate-[pulse_2s_ease-in-out_infinite_0.5s]" style={{ width: "40%" }} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AIThinking;
