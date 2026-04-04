import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { saveOutput } from "@/lib/saved-outputs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AIThinking from "@/components/AIThinking";
import OutputActions from "@/components/OutputActions";
import MarkdownWithMath from "@/components/MarkdownWithMath";
import { streamAI } from "@/lib/streaming";
import { useUsageLimitCheck } from "@/components/UsageLimitToast";
import ShareResultButton from "@/components/ShareResultButton";
import TimeSavedIndicator from "@/components/TimeSavedIndicator";
import { Lightbulb, Loader2, FileDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const StudyHelper = () => {
  const [topic, setTopic] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { checkAndPrompt } = useUsageLimitCheck();

  const handleGenerate = async () => {
    if (!topic.trim() || loading) return;
    if (!checkAndPrompt("summaries", "study summaries")) return;

    setLoading(true);
    setOutput("");
    let fullText = "";
    await streamAI({
      functionName: "study-helper",
      body: { topic: topic.trim() },
      onDelta: (text) => { fullText += text; setOutput(fullText); },
      onDone: () => { setLoading(false); saveOutput("study-helper", { topic }, fullText); },
      onError: (err) => { setLoading(false); toast({ title: "Error", description: err, variant: "destructive" }); },
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

      {loading && !output && <AIThinking message="Generating explanation" />}

      {output && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Results</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => navigate(`/pdf-export?source=study-helper&title=${encodeURIComponent(`Study: ${topic}`)}&content=${encodeURIComponent(output)}`)}
                >
                  <FileDown className="h-4 w-4" /> PDF
                </Button>
                <OutputActions text={output} title={`Study: ${topic}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <MarkdownWithMath className="prose prose-sm max-w-none text-foreground dark:prose-invert break-words overflow-hidden">
              {output}
            </MarkdownWithMath>
            <TimeSavedIndicator text={output} type="summary" />
            <ShareResultButton text={output} title={`Study: ${topic}`} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudyHelper;
