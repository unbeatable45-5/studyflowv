import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { generatePdf } from "@/lib/pdf-generator";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import ShareToGroupDialog from "@/components/groups/ShareToGroupDialog";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { generatePdf } from "@/lib/pdf-generator";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  History as HistoryIcon,
  Lightbulb,
  FileText,
  CalendarDays,
  Layers,
  FileUp,
  FileDown,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Share2,
} from "lucide-react";
import { copyToClipboard } from "@/lib/streaming";

const toolMeta: Record<string, { icon: typeof Lightbulb; color: string; label: string }> = {
  "study-helper": { icon: Lightbulb, color: "text-primary", label: "Study Helper" },
  "note-organizer": { icon: FileText, color: "text-success", label: "Note Organizer" },
  "revision-planner": { icon: CalendarDays, color: "text-warning", label: "Revision Planner" },
  "flashcard-generator": { icon: Layers, color: "text-accent-foreground", label: "Flashcards" },
  "pdf-export": { icon: FileDown, color: "text-destructive", label: "PDF Export" },
  "pdf-summarizer": { icon: FileUp, color: "text-success", label: "PDF Summary" },
};

const filters = [
  { value: "all", label: "All" },
  { value: "study-helper", label: "Study" },
  { value: "note-organizer", label: "Notes" },
  { value: "revision-planner", label: "Planner" },
  { value: "flashcard-generator", label: "Cards" },
  { value: "pdf-summarizer", label: "PDF" },
];

interface SavedOutput {
  id: string;
  tool: string;
  input_data: any;
  output_text: string;
  created_at: string;
}

const HistoryPage = () => {
  const [items, setItems] = useState<SavedOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchItems = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("saved_outputs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (filter !== "all") query = query.eq("tool", filter);

    const { data } = await query;
    setItems((data as SavedOutput[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const handleDelete = async (id: string) => {
    await supabase.from("saved_outputs").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Deleted" });
  };

  const handleDownloadPdf = (item: SavedOutput) => {
    const label = getLabel(item);
    generatePdf({
      title: label,
      content: item.output_text,
      source: "custom",
    });
    toast({ title: "PDF downloaded!" });
  };

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) toast({ title: "Copied to clipboard!" });
  };

  const getLabel = (item: SavedOutput): string => {
    const input = item.input_data as any;
    if (item.tool === "study-helper") return input?.topic || "Study Notes";
    if (item.tool === "note-organizer") return "Organized Notes";
    if (item.tool === "revision-planner") return "Study Plan";
    if (item.tool === "flashcard-generator") return input?.topic || "Flashcards";
    if (item.tool === "pdf-summarizer") return input?.fileName || "PDF Summary";
    if (item.tool === "pdf-export") return input?.title || "PDF Export";
    return "Output";
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-2">
            <HistoryIcon className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">History</h1>
        </div>
        <p className="text-sm text-muted-foreground">Browse and re-download all your past results.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {filters.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            className="shrink-0 text-xs"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No saved results yet. Use any tool to see your history here!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const meta = toolMeta[item.tool];
            const Icon = meta?.icon ?? FileText;
            const color = meta?.color ?? "text-muted-foreground";
            const label = getLabel(item);
            const expanded = expandedId === item.id;
            const preview = item.output_text.slice(0, 120).replace(/\n/g, " ");

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Summary row */}
                  <button
                    className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{label}</p>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{preview}…</p>
                      {meta && (
                        <span className="inline-block mt-1 text-[10px] font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                          {meta.label}
                        </span>
                      )}
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                  </button>

                  {/* Expanded content */}
                  {expanded && (
                    <div className="border-t px-3 pb-3 space-y-3">
                      <div className="max-h-60 overflow-y-auto mt-3">
                        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap text-xs">
                          {item.output_text}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => handleDownloadPdf(item)}
                        >
                          <FileDown className="h-3.5 w-3.5" /> Download PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => handleCopy(item.output_text)}
                        >
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
