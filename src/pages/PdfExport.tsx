import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { generatePdf } from "@/lib/pdf-generator";
import { saveOutput } from "@/lib/saved-outputs";
import { toast } from "@/hooks/use-toast";
import { FileDown, FileText, Lightbulb, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Source = "study-helper" | "note-organizer" | "custom";

const PdfExport = () => {
  const [searchParams] = useSearchParams();
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [content, setContent] = useState("");
  const [source, setSource] = useState<Source>("custom");
  const [generating, setGenerating] = useState(false);

  // Pre-fill from URL params (from tool redirect)
  useEffect(() => {
    const src = searchParams.get("source") as Source | null;
    const data = searchParams.get("content");
    const t = searchParams.get("title");
    if (src) setSource(src);
    if (data) setContent(decodeURIComponent(data));
    if (t) setTitle(decodeURIComponent(t));
  }, [searchParams]);

  const handleExport = () => {
    if (!content.trim()) {
      toast({ title: "No content", description: "Please add content to export.", variant: "destructive" });
      return;
    }
    setGenerating(true);

    try {
      generatePdf({
        title: title || "Study Notes",
        course,
        date: date || undefined,
        content: content.trim(),
        source,
      });
      // Save to history
      saveOutput("study-helper", {
        type: "pdf-export",
        title: title || "Study Notes",
        course,
      }, content.trim());
      toast({ title: "PDF downloaded! 📄" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const sourceOptions: { value: Source; label: string; icon: typeof FileText; desc: string }[] = [
    { value: "study-helper", label: "Study Helper", icon: Lightbulb, desc: "Explanation & Q&A" },
    { value: "note-organizer", label: "Note Organizer", icon: FileText, desc: "Organized notes" },
    { value: "custom", label: "Custom", icon: FileDown, desc: "Paste any content" },
  ];

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-2">
            <FileDown className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold">Export to PDF</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Create a professional, study-friendly PDF from your notes or study results.
        </p>
      </div>

      {/* Source selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Content source</Label>
        <div className="grid grid-cols-3 gap-2">
          {sourceOptions.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              onClick={() => setSource(value)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-colors",
                source === value
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* PDF metadata */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="pdf-title">Title (optional)</Label>
          <Input
            id="pdf-title"
            placeholder="e.g. Biology Chapter 5 Summary"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pdf-course">Course (optional)</Label>
            <Input
              id="pdf-course"
              placeholder="e.g. BIO 101"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pdf-date">Date</Label>
            <Input
              id="pdf-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1.5">
        <Label>Content</Label>
        <Textarea
          placeholder="Paste your notes, study helper output, or any content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[200px] text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Supports markdown: ## headings, - bullets, **bold**, numbered lists
        </p>
      </div>

      {/* Preview info */}
      {content.trim() && (
        <Card className="bg-muted/50">
          <CardContent className="p-3 text-xs text-muted-foreground space-y-1">
            <p><span className="font-medium text-foreground">Title:</span> {title || "Study Notes"}</p>
            {course && <p><span className="font-medium text-foreground">Course:</span> {course}</p>}
            <p><span className="font-medium text-foreground">Content:</span> {content.trim().split("\n").length} lines</p>
          </CardContent>
        </Card>
      )}

      {/* Download button */}
      <Button onClick={handleExport} disabled={generating || !content.trim()} className="w-full gap-2" size="lg">
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        Download PDF
      </Button>
    </div>
  );
};

export default PdfExport;
