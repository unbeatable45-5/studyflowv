import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { generateMultiPagePdf } from "@/lib/pdf-builder";
import { saveOutput } from "@/lib/saved-outputs";
import { toast } from "@/hooks/use-toast";
import { FilePlus, FileDown, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface PageData {
  title: string;
  content: string;
}

const CustomPdfBuilder = () => {
  const [pageCount, setPageCount] = useState(3);
  const [pages, setPages] = useState<PageData[]>(() =>
    Array.from({ length: 3 }, (_, i) => ({ title: "", content: "" }))
  );
  const [docTitle, setDocTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [includeDate, setIncludeDate] = useState(true);
  const [expandedPage, setExpandedPage] = useState<number>(0);

  const handlePageCountChange = (val: number[]) => {
    const count = val[0];
    setPageCount(count);
    setPages((prev) => {
      if (count > prev.length) {
        return [...prev, ...Array.from({ length: count - prev.length }, () => ({ title: "", content: "" }))];
      }
      return prev.slice(0, count);
    });
  };

  const updatePage = (index: number, field: keyof PageData, value: string) => {
    setPages((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const removePage = (index: number) => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((_, i) => i !== index));
    setPageCount((c) => c - 1);
    if (expandedPage >= pages.length - 1) setExpandedPage(Math.max(0, pages.length - 2));
  };

  const hasContent = pages.some((p) => p.content.trim());

  const handleGenerate = () => {
    if (!hasContent) {
      toast({ title: "Add some content", description: "At least one page needs content.", variant: "destructive" });
      return;
    }

    generateMultiPagePdf({
      docTitle: docTitle || "Study Notes",
      subject,
      includeDate,
      pages,
    });

    // Save to history
    const fullText = pages
      .map((p, i) => `--- Page ${i + 1}${p.title ? `: ${p.title}` : ""} ---\n${p.content}`)
      .join("\n\n");
    saveOutput("pdf-builder", { docTitle, subject, pageCount }, fullText);

    toast({ title: "PDF downloaded!" });
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-2">
            <FilePlus className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">Custom PDF Builder</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Create a multi-page PDF with your own notes and content.
        </p>
      </div>

      {/* Document Settings */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Document Title</Label>
            <Input
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. Biology Revision Notes"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subject (optional)</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Biology"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Include Date</Label>
              <Button
                variant={includeDate ? "default" : "outline"}
                size="sm"
                className="w-full mt-0.5"
                onClick={() => setIncludeDate(!includeDate)}
              >
                {includeDate ? "Yes" : "No"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Number of Pages</Label>
              <span className="text-sm font-bold text-primary">{pageCount}</span>
            </div>
            <Slider
              value={[pageCount]}
              onValueChange={handlePageCountChange}
              min={1}
              max={20}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1</span>
              <span>20</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page Sections */}
      <div className="space-y-2">
        {pages.map((page, i) => {
          const isExpanded = expandedPage === i;
          return (
            <Card key={i} className="overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedPage(isExpanded ? -1 : i)}
              >
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/10 text-primary text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {page.title || `Page ${i + 1}`}
                  </span>
                  {page.content && (
                    <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                      {page.content.length} chars
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <CardContent className="p-3 pt-0 space-y-3 border-t">
                  <div className="space-y-1.5 pt-3">
                    <Label className="text-xs font-medium">Page Title (optional)</Label>
                    <Input
                      value={page.title}
                      onChange={(e) => updatePage(i, "title", e.target.value)}
                      placeholder={`Page ${i + 1} title…`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Content</Label>
                    <Textarea
                      value={page.content}
                      onChange={(e) => updatePage(i, "content", e.target.value)}
                      placeholder="Type or paste your notes here…"
                      className="min-h-[160px] text-sm"
                    />
                  </div>
                  {pages.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs text-destructive hover:text-destructive"
                      onClick={() => removePage(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove Page
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Generate Button */}
      <Button onClick={handleGenerate} disabled={!hasContent} className="w-full gap-2">
        <FileDown className="h-4 w-4" /> Generate PDF
      </Button>
    </div>
  );
};

export default CustomPdfBuilder;
