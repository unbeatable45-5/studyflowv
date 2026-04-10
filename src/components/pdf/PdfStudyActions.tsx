import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, GraduationCap, X } from "lucide-react";
import AIThinking from "@/components/AIThinking";
import MarkdownWithMath from "@/components/MarkdownWithMath";
import OutputActions from "@/components/OutputActions";
import { streamAI } from "@/lib/streaming";
import { saveOutput } from "@/lib/saved-outputs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PdfStudyActionsProps {
  extractedText: string;
  summaryOutput: string;
  fileName?: string;
  isImagePdf: boolean;
}

const PdfStudyActions = ({ extractedText, summaryOutput, fileName, isImagePdf }: PdfStudyActionsProps) => {
  const [flashcards, setFlashcards] = useState<{ front: string; back: string }[] | null>(null);
  const [quizOutput, setQuizOutput] = useState("");
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [activePanel, setActivePanel] = useState<"flashcards" | "quiz" | null>(null);

  const sourceText = summaryOutput || extractedText;

  const handleGenerateFlashcards = async () => {
    if (loadingFlashcards || !sourceText) return;
    setLoadingFlashcards(true);
    setActivePanel("flashcards");
    setFlashcards(null);

    try {
      const { data, error } = await supabase.functions.invoke("flashcard-generator", {
        body: { topic: `Based on this document content:\n\n${sourceText.slice(0, 8000)}`, count: 8 },
      });

      if (error) throw error;
      if (data?.flashcards) {
        setFlashcards(data.flashcards);
        saveOutput("flashcard-generator", { source: "pdf", fileName }, JSON.stringify(data.flashcards));
        toast({ title: "Flashcards generated!", description: `${data.flashcards.length} cards created from your PDF.` });
      } else {
        throw new Error("No flashcards returned");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate flashcards", variant: "destructive" });
      setActivePanel(null);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (loadingQuiz || !sourceText) return;
    setLoadingQuiz(true);
    setActivePanel("quiz");
    setQuizOutput("");
    let fullText = "";

    await streamAI({
      functionName: "practice-exam",
      body: { content: sourceText.slice(0, 15000), mode: "cbt", numQuestions: 5 },
      onDelta: (text) => { fullText += text; setQuizOutput(fullText); },
      onDone: () => {
        setLoadingQuiz(false);
        saveOutput("practice-exam", { source: "pdf", fileName }, fullText);
        toast({ title: "Quiz generated!" });
      },
      onError: (err) => {
        setLoadingQuiz(false);
        toast({ title: "Error", description: err, variant: "destructive" });
        setActivePanel(null);
      },
    });
  };

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-9 text-xs"
          onClick={handleGenerateFlashcards}
          disabled={loadingFlashcards || loadingQuiz}
        >
          {loadingFlashcards ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookOpen className="h-3.5 w-3.5" />}
          Generate Flashcards
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-9 text-xs"
          onClick={handleGenerateQuiz}
          disabled={loadingFlashcards || loadingQuiz}
        >
          {loadingQuiz ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GraduationCap className="h-3.5 w-3.5" />}
          Generate Quiz
        </Button>
      </div>

      {/* Loading States */}
      {loadingFlashcards && !flashcards && <AIThinking message="Generating flashcards from PDF…" />}
      {loadingQuiz && !quizOutput && <AIThinking message="Creating quiz questions…" />}

      {/* Flashcards Output */}
      {activePanel === "flashcards" && flashcards && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base">📇 Flashcards ({flashcards.length})</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setActivePanel(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 space-y-2">
            {flashcards.map((card, i) => (
              <div key={i} className="border rounded-lg p-2.5 space-y-1.5">
                <p className="text-xs font-medium text-primary">Q: {card.front}</p>
                <p className="text-xs text-muted-foreground">A: {card.back}</p>
              </div>
            ))}
            <OutputActions text={flashcards.map((c, i) => `${i + 1}. Q: ${c.front}\n   A: ${c.back}`).join("\n\n")} title="PDF Flashcards" />
          </CardContent>
        </Card>
      )}

      {/* Quiz Output */}
      {activePanel === "quiz" && quizOutput && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base">📝 Practice Quiz</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setActivePanel(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 space-y-2">
            <MarkdownWithMath className="prose prose-sm max-w-none text-foreground dark:prose-invert prose-p:text-xs sm:prose-p:text-sm break-words overflow-hidden">
              {quizOutput}
            </MarkdownWithMath>
            <OutputActions text={quizOutput} title="PDF Quiz" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PdfStudyActions;
