import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Lightbulb, FileText, CalendarDays, Layers, FileUp, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, parseISO } from "date-fns";

const toolConfig: Record<string, { icon: typeof Lightbulb; label: string; color: string; to: string }> = {
  "study-helper": { icon: Lightbulb, label: "Study Helper", color: "text-primary", to: "/study" },
  "note-organizer": { icon: FileText, label: "Notes", color: "text-success", to: "/notes" },
  "revision-planner": { icon: CalendarDays, label: "Planner", color: "text-warning", to: "/planner" },
  "flashcard-generator": { icon: Layers, label: "Flashcards", color: "text-accent-foreground", to: "/flashcards" },
  "pdf-summarizer": { icon: FileUp, label: "PDF Summary", color: "text-success", to: "/pdf-summarizer" },
  "study-mode": { icon: BookOpen, label: "Study Mode", color: "text-primary", to: "/study-mode" },
};

interface SearchResult {
  id: string;
  tool: string;
  output_text: string;
  subject: string | null;
  custom_title: string | null;
  created_at: string;
  input_data: any;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!user || q.trim().length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from("saved_outputs")
      .select("id, tool, output_text, subject, custom_title, created_at, input_data")
      .eq("user_id", user.id)
      .ilike("output_text", `%${q.trim()}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    setResults((data as SearchResult[]) ?? []);
    setSearching(false);
  }, [user]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const handleSelect = (result: SearchResult) => {
    const cfg = toolConfig[result.tool];
    if (cfg) navigate(cfg.to);
    onOpenChange(false);
  };

  const getTitle = (r: SearchResult) => {
    if (r.custom_title) return r.custom_title;
    if (r.tool === "study-helper") return r.input_data?.topic || "Study session";
    if (r.tool === "study-mode") return r.input_data?.topic || "Study Mode session";
    if (r.tool === "note-organizer") return "Organized notes";
    if (r.tool === "revision-planner") return "Revision plan";
    if (r.tool === "flashcard-generator") return r.input_data?.topic || "Flashcards";
    if (r.tool === "pdf-summarizer") return "PDF Summary";
    return r.tool;
  };

  const getSnippet = (text: string, q: string) => {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx === -1) return text.slice(0, 120);
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + q.length + 80);
    return (start > 0 ? "…" : "") + text.slice(start, end).replace(/\n/g, " ") + (end < text.length ? "…" : "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Search your study materials</DialogTitle>
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search notes, flashcards, sessions…"
            className="border-0 shadow-none focus-visible:ring-0 px-0 text-base"
            autoFocus
          />
          {query && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setQuery("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
          <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search…
            </div>
          ) : searching ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            <div className="divide-y">
              {results.map(r => {
                const cfg = toolConfig[r.tool];
                const Icon = cfg?.icon || FileText;
                const color = cfg?.color || "text-muted-foreground";

                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors focus:bg-accent/50 focus:outline-none"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{getTitle(r)}</p>
                          {r.subject && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                              {r.subject}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {getSnippet(r.output_text, query)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("text-[10px] font-medium", color)}>{cfg?.label || r.tool}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(parseISO(r.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
