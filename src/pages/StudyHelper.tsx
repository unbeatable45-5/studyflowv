import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { saveOutput } from "@/lib/saved-outputs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import OutputActions from "@/components/OutputActions";
import { streamAI } from "@/lib/streaming";
import { Lightbulb, Loader2, FileDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const StudyHelper = () => {
  const [topic, setTopic] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setOutput("");

    let fullText = "";
    await streamAI({
      functionName: "study-helper",
      body: { topic: topic.trim() },
      onDelta: (text) => {
        fullText += text;
        setOutput(fullText);
      },
      onDone: () => {
        setLoading(false);
        saveOutput("study-helper", { topic }, fullText);
      },
      onError: (err) => {
        setLoading(false);
        toast({ title: "Error", description: err, variant: "destructive" });
      },
    });
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-2">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold">Quick Study Helper</h1>
        </div>
        <p className="text-sm text-muted-foreground">Enter a topic to get an explanation and practice questions.</p>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          placeholder="e.g. Photosynthesis, Newton's Laws..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={handleGenerate} disabled={loading || !topic.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
        </Button>
      </div>

      {/* Loading skeleton */}
      {loading && !output && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {/* Output */}
      {output && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Results</CardTitle>
              <OutputActions text={output} title={`Study: ${topic}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
              {output}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudyHelper;
