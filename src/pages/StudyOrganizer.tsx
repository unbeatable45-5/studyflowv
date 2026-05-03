import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { generatePdf } from "@/lib/pdf-generator";
import { usePremium } from "@/contexts/PremiumContext";
import { copyToClipboard } from "@/lib/streaming";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  FolderOpen,
  Search,
  Lightbulb,
  FileText,
  CalendarDays,
  Layers,
  FileUp,
  FileDown,
  FilePlus,
  Trash2,
  Copy,
  Pencil,
  FolderInput,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  Calculator,
  Leaf,
  FlaskConical,
  Atom,
  Monitor,
  Landmark,
  Globe,
  BookOpen,
  BookMarked,
  TrendingUp,
  Briefcase,
  Brain,
  GraduationCap,
  Palette,
  Music,
  Languages,
  Scale,
  HeartPulse,
  Wrench,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SUBJECTS = [
  "Mathematics", "Biology", "Chemistry", "Physics", "Computer Science",
  "History", "Geography", "English", "Literature", "Economics",
  "Business Studies", "Psychology", "Philosophy", "Art", "Music",
  "Foreign Languages", "Law", "Medicine", "Engineering", "General Studies",
];

const subjectTheme: Record<string, { icon: typeof Calculator; bg: string; text: string; badge: string }> = {
  Mathematics:       { icon: Calculator,   bg: "bg-[hsl(220,72%,50%)]/10", text: "text-primary",            badge: "bg-[hsl(220,72%,50%)]/15 text-primary" },
  Biology:           { icon: Leaf,          bg: "bg-[hsl(152,60%,42%)]/10", text: "text-success",            badge: "bg-[hsl(152,60%,42%)]/15 text-success" },
  Chemistry:         { icon: FlaskConical,  bg: "bg-[hsl(280,60%,50%)]/10", text: "text-[hsl(280,60%,50%)]", badge: "bg-[hsl(280,60%,50%)]/15 text-[hsl(280,60%,50%)]" },
  Physics:           { icon: Atom,          bg: "bg-[hsl(200,80%,50%)]/10", text: "text-[hsl(200,80%,50%)]", badge: "bg-[hsl(200,80%,50%)]/15 text-[hsl(200,80%,50%)]" },
  "Computer Science":{ icon: Monitor,       bg: "bg-[hsl(170,60%,40%)]/10", text: "text-[hsl(170,60%,40%)]", badge: "bg-[hsl(170,60%,40%)]/15 text-[hsl(170,60%,40%)]" },
  History:           { icon: Landmark,      bg: "bg-[hsl(38,92%,50%)]/10",  text: "text-warning",            badge: "bg-[hsl(38,92%,50%)]/15 text-warning" },
  Geography:         { icon: Globe,         bg: "bg-[hsl(160,50%,45%)]/10", text: "text-[hsl(160,50%,45%)]", badge: "bg-[hsl(160,50%,45%)]/15 text-[hsl(160,50%,45%)]" },
  English:           { icon: BookOpen,      bg: "bg-[hsl(340,65%,50%)]/10", text: "text-[hsl(340,65%,50%)]", badge: "bg-[hsl(340,65%,50%)]/15 text-[hsl(340,65%,50%)]" },
  Literature:        { icon: BookMarked,    bg: "bg-[hsl(320,50%,50%)]/10", text: "text-[hsl(320,50%,50%)]", badge: "bg-[hsl(320,50%,50%)]/15 text-[hsl(320,50%,50%)]" },
  Economics:         { icon: TrendingUp,    bg: "bg-[hsl(45,80%,45%)]/10",  text: "text-[hsl(45,80%,45%)]",  badge: "bg-[hsl(45,80%,45%)]/15 text-[hsl(45,80%,45%)]" },
  "Business Studies":{ icon: Briefcase,     bg: "bg-[hsl(215,25%,50%)]/10", text: "text-[hsl(215,25%,50%)]", badge: "bg-[hsl(215,25%,50%)]/15 text-[hsl(215,25%,50%)]" },
  Psychology:        { icon: Brain,         bg: "bg-[hsl(260,50%,55%)]/10", text: "text-[hsl(260,50%,55%)]", badge: "bg-[hsl(260,50%,55%)]/15 text-[hsl(260,50%,55%)]" },
  Philosophy:        { icon: GraduationCap, bg: "bg-[hsl(30,40%,50%)]/10",  text: "text-[hsl(30,40%,50%)]",  badge: "bg-[hsl(30,40%,50%)]/15 text-[hsl(30,40%,50%)]" },
  Art:               { icon: Palette,       bg: "bg-[hsl(0,84%,60%)]/10",   text: "text-destructive",        badge: "bg-[hsl(0,84%,60%)]/15 text-destructive" },
  Music:             { icon: Music,         bg: "bg-[hsl(290,45%,55%)]/10", text: "text-[hsl(290,45%,55%)]", badge: "bg-[hsl(290,45%,55%)]/15 text-[hsl(290,45%,55%)]" },
  "Foreign Languages":{ icon: Languages,    bg: "bg-[hsl(190,60%,45%)]/10", text: "text-[hsl(190,60%,45%)]", badge: "bg-[hsl(190,60%,45%)]/15 text-[hsl(190,60%,45%)]" },
  Law:               { icon: Scale,         bg: "bg-[hsl(210,30%,40%)]/10", text: "text-[hsl(210,30%,40%)]", badge: "bg-[hsl(210,30%,40%)]/15 text-[hsl(210,30%,40%)]" },
  Medicine:          { icon: HeartPulse,    bg: "bg-[hsl(0,70%,55%)]/10",   text: "text-[hsl(0,70%,55%)]",   badge: "bg-[hsl(0,70%,55%)]/15 text-[hsl(0,70%,55%)]" },
  Engineering:       { icon: Wrench,        bg: "bg-[hsl(25,70%,50%)]/10",  text: "text-[hsl(25,70%,50%)]",  badge: "bg-[hsl(25,70%,50%)]/15 text-[hsl(25,70%,50%)]" },
  "General Studies": { icon: HelpCircle,    bg: "bg-muted",                 text: "text-muted-foreground",   badge: "bg-muted text-muted-foreground" },
  Uncategorized:     { icon: FolderOpen,    bg: "bg-muted",                 text: "text-muted-foreground",   badge: "bg-muted text-muted-foreground" },
};

const getSubjectTheme = (subject: string) =>
  subjectTheme[subject] || subjectTheme["Uncategorized"];

const toolIcons: Record<string, typeof Lightbulb> = {
  "study-helper": Lightbulb,
  "note-organizer": FileText,
  "revision-planner": CalendarDays,
  "flashcard-generator": Layers,
  "pdf-export": FileDown,
  "pdf-summarizer": FileUp,
  "pdf-builder": FilePlus,
  "study-mode": BookOpen,
};

const toolLabels: Record<string, string> = {
  "study-helper": "Study Notes",
  "note-organizer": "Organized Notes",
  "revision-planner": "Revision Plan",
  "flashcard-generator": "Flashcards",
  "pdf-export": "PDF Export",
  "pdf-summarizer": "PDF Summary",
  "pdf-builder": "Custom PDF",
  "study-mode": "Study Session",
};

interface SavedItem {
  id: string;
  tool: string;
  input_data: any;
  output_text: string;
  created_at: string;
  subject: string | null;
  custom_title: string | null;
}

const StudyOrganizer = () => {
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [movingId, setMovingId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("saved_outputs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setItems((data as SavedItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const getTitle = (item: SavedItem): string => {
    if (item.custom_title) return item.custom_title;
    const input = item.input_data as any;
    if (item.tool === "study-helper") return input?.topic || "Study Notes";
    if (item.tool === "note-organizer") return "Organized Notes";
    if (item.tool === "revision-planner") return "Study Plan";
    if (item.tool === "flashcard-generator") return input?.topic || "Flashcards";
    if (item.tool === "pdf-summarizer") return input?.fileName || "PDF Summary";
    if (item.tool === "pdf-export") return input?.title || "PDF Export";
    if (item.tool === "pdf-builder") return input?.docTitle || "Custom PDF";
    return "Output";
  };

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => {
      const title = getTitle(item).toLowerCase();
      const subject = (item.subject || "").toLowerCase();
      const tool = (toolLabels[item.tool] || "").toLowerCase();
      const text = item.output_text.slice(0, 200).toLowerCase();
      return title.includes(q) || subject.includes(q) || tool.includes(q) || text.includes(q);
    });
  }, [items, search]);

  // Group by subject
  const grouped = useMemo(() => {
    const map: Record<string, SavedItem[]> = {};
    for (const item of filtered) {
      const subject = item.subject || "Uncategorized";
      if (!map[subject]) map[subject] = [];
      map[subject].push(item);
    }
    // Sort folders alphabetically, Uncategorized last
    const sorted = Object.entries(map).sort(([a], [b]) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    });
    return sorted;
  }, [filtered]);

  // Auto-open folders with results
  useEffect(() => {
    if (search.trim()) {
      setOpenFolders(new Set(grouped.map(([subject]) => subject)));
    }
  }, [search, grouped]);

  const toggleFolder = (subject: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      next.has(subject) ? next.delete(subject) : next.add(subject);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    await supabase.from("saved_outputs").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Deleted" });
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;
    await supabase
      .from("saved_outputs")
      .update({ custom_title: renameValue.trim() } as any)
      .eq("id", id);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, custom_title: renameValue.trim() } : i))
    );
    setRenamingId(null);
    toast({ title: "Renamed" });
  };

  const handleMove = async (id: string, newSubject: string) => {
    await supabase
      .from("saved_outputs")
      .update({ subject: newSubject } as any)
      .eq("id", id);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, subject: newSubject } : i))
    );
    setMovingId(null);
    toast({ title: `Moved to ${newSubject}` });
  };

  const handleDownloadPdf = (item: SavedItem) => {
    generatePdf({ title: getTitle(item), content: item.output_text, source: "custom", isPremium });
    toast({ title: "PDF downloaded!" });
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-2">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">Study Organizer</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          All your study materials, auto-organized by subject.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files, subjects, or content…"
          className="pl-9"
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2"
            onClick={() => setSearch("")}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Stats */}
      {!loading && (
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{items.length} files</span>
          <span>•</span>
          <span>{grouped.length} subjects</span>
          {search && (
            <>
              <span>•</span>
              <span>{filtered.length} matches</span>
            </>
          )}
        </div>
      )}

      {/* Folders */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {search ? "No matching files found." : "No saved files yet. Use any tool to get started!"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {grouped.map(([subject, subjectItems]) => {
            const isOpen = openFolders.has(subject);
            const theme = getSubjectTheme(subject);
            const SubjectIcon = theme.icon;
            return (
              <Card key={subject} className="overflow-hidden">
                {/* Folder header */}
                <button
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => toggleFolder(subject)}
                >
                  {isOpen ? (
                    <ChevronDown className={`h-4 w-4 shrink-0 ${theme.text}`} />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className={`rounded-lg p-1.5 ${theme.bg}`}>
                    <SubjectIcon className={`h-4 w-4 ${theme.text}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1">{subject}</span>
                  <span className={`text-[11px] rounded-full px-2 py-0.5 ${theme.badge}`}>
                    {subjectItems.length}
                  </span>
                </button>

                {/* Files */}
                {isOpen && (
                  <div className="border-t">
                    {subjectItems.map((item) => {
                      const Icon = toolIcons[item.tool] ?? FileText;
                      const title = getTitle(item);
                      const isExpanded = expandedId === item.id;
                      const isRenaming = renamingId === item.id;
                      const isMoving = movingId === item.id;

                      return (
                        <div key={item.id} className="border-b last:border-b-0">
                          {/* File row */}
                          <button
                            className="w-full flex items-start gap-3 p-3 pl-10 text-left hover:bg-muted/20 transition-colors"
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          >
                            <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                                  {toolLabels[item.tool] || item.tool}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </button>

                          {/* Expanded */}
                          {isExpanded && (
                            <div className="px-3 pb-3 pl-10 space-y-3">
                              {/* Rename inline */}
                              {isRenaming ? (
                                <div className="flex gap-2">
                                  <Input
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    className="h-8 text-sm"
                                    autoFocus
                                    onKeyDown={(e) => e.key === "Enter" && handleRename(item.id)}
                                  />
                                  <Button size="sm" variant="ghost" onClick={() => handleRename(item.id)}>
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : isMoving ? (
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">Move to subject:</p>
                                  <Select onValueChange={(val) => handleMove(item.id, val)}>
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue placeholder="Select subject…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {SUBJECTS.map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setMovingId(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div className="max-h-40 overflow-y-auto">
                                    <p className="text-xs text-foreground whitespace-pre-wrap">
                                      {item.output_text.slice(0, 500)}
                                      {item.output_text.length > 500 && "…"}
                                    </p>
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    {item.tool === "pdf-summarizer" && (
                                      <Button
                                        size="sm"
                                        className="gap-1.5 text-xs"
                                        onClick={() => {
                                          const input = item.input_data as any;
                                          navigate("/pdf-viewer", {
                                            state: {
                                              fileName: input?.fileName,
                                              page: input?.page ?? 1,
                                              openVideos: input?.tool === "related-videos",
                                            },
                                          });
                                        }}
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" /> Reopen
                                      </Button>
                                    )}
                                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleDownloadPdf(item)}>
                                      <FileDown className="h-3.5 w-3.5" /> PDF
                                    </Button>
                                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => copyToClipboard(item.output_text).then(() => toast({ title: "Copied!" }))}>
                                      <Copy className="h-3.5 w-3.5" /> Copy
                                    </Button>
                                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => { setRenamingId(item.id); setRenameValue(title); }}>
                                      <Pencil className="h-3.5 w-3.5" /> Rename
                                    </Button>
                                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setMovingId(item.id)}>
                                      <FolderInput className="h-3.5 w-3.5" /> Move
                                    </Button>
                                    <Button size="sm" variant="outline" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                      <Trash2 className="h-3.5 w-3.5" /> Delete
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudyOrganizer;
