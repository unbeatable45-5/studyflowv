import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Lightbulb, FileText, CalendarDays, GraduationCap, ArrowRight, Clock, Layers, FileDown, FileUp, FilePlus, FolderOpen, BookOpen, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecentOutputs } from "@/lib/saved-outputs";
import { formatDistanceToNow } from "date-fns";

const tools = [
  {
    to: "/study-mode",
    icon: BookOpen,
    title: "Study Mode",
    description: "Generate a full study session with summary, flashcards, quiz & plan",
    color: "bg-accent text-accent-foreground",
    tool: "study-mode",
  },
  {
    to: "/study",
    icon: Lightbulb,
    title: "Quick Study Helper",
    description: "Get concise explanations and practice questions on any topic",
    color: "bg-primary/10 text-primary",
    tool: "study-helper",
  },
  {
    to: "/notes",
    icon: FileText,
    title: "Mini Note Organizer",
    description: "Paste your notes and get organized bullet-point summaries",
    color: "bg-success/10 text-success",
    tool: "note-organizer",
  },
  {
    to: "/planner",
    icon: CalendarDays,
    title: "Revision Planner",
    description: "Create a personalized daily/weekly study schedule",
    color: "bg-warning/10 text-warning",
    tool: "revision-planner",
  },
  {
    to: "/flashcards",
    icon: Layers,
    title: "Flashcard Generator",
    description: "Create interactive flashcards on any topic",
    color: "bg-accent text-accent-foreground",
    tool: "flashcard-generator",
  },
  {
    to: "/pdf-export",
    icon: FileDown,
    title: "PDF Export",
    description: "Download your study notes as a professional PDF",
    color: "bg-destructive/10 text-destructive",
    tool: "pdf-export",
  },
  {
    to: "/pdf-summarizer",
    icon: FileUp,
    title: "PDF Summarizer",
    description: "Upload a PDF and get an AI-powered summary",
    color: "bg-success/10 text-success",
    tool: "pdf-summarizer",
  },
  {
    to: "/pdf-builder",
    icon: FilePlus,
    title: "Custom PDF Builder",
    description: "Create multi-page PDFs with your own notes",
    color: "bg-warning/10 text-warning",
    tool: "pdf-builder",
  },
  {
    to: "/organizer",
    icon: FolderOpen,
    title: "Study Organizer",
    description: "Browse all your materials organized by subject",
    color: "bg-primary/10 text-primary",
    tool: "organizer",
  },
];

const toolMeta: Record<string, { icon: typeof Lightbulb; color: string; label: string; to: string }> = {
  "study-helper": { icon: Lightbulb, color: "text-primary", label: "Study Helper", to: "/study" },
  "note-organizer": { icon: FileText, color: "text-success", label: "Note Organizer", to: "/notes" },
  "revision-planner": { icon: CalendarDays, color: "text-warning", label: "Revision Planner", to: "/planner" },
};

interface SavedOutput {
  id: string;
  tool: string;
  input_data: any;
  output_text: string;
  created_at: string;
}

const Index = () => {
  const [recents, setRecents] = useState<SavedOutput[]>([]);
  const [loadingRecents, setLoadingRecents] = useState(true);

  useEffect(() => {
    getRecentOutputs(undefined, 5).then((data) => {
      setRecents(data as SavedOutput[]);
      setLoadingRecents(false);
    });
  }, []);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Welcome */}
      <div className="space-y-1">
        <h1 className="text-2xl font-display font-bold text-foreground">
          Welcome back! 👋
        </h1>
        <p className="text-muted-foreground">
          Pick a tool to start studying smarter.
        </p>
      </div>

      {/* Tool Cards */}
      <div className="space-y-3">
        {tools.map(({ to, icon: Icon, title, description, color }) => (
          <Link key={to} to={to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-border/60 mb-3">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`rounded-xl p-3 ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display font-semibold text-foreground">Recent Activity</h2>
        </div>

        {loadingRecents ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : recents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              No results yet. Try one of the tools above!
            </CardContent>
          </Card>
        ) : (
          recents.map((item) => {
            const meta = toolMeta[item.tool];
            if (!meta) return null;
            const Icon = meta.icon;
            const preview = item.output_text.slice(0, 80).replace(/\n/g, " ");
            const inputLabel =
              item.tool === "study-helper"
                ? (item.input_data as any)?.topic
                : item.tool === "note-organizer"
                ? "Notes"
                : "Study Plan";

            return (
              <Link key={item.id} to={meta.to}>
                <Card className="hover:shadow-sm transition-shadow cursor-pointer mb-2">
                  <CardContent className="p-3 flex items-start gap-3">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${meta.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {inputLabel}
                        </p>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {preview}…
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>

      {/* Tutorial Link */}
      <Link to="/tutorial">
        <Card className="bg-accent border-accent hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl p-3 bg-primary/10 text-primary">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-accent-foreground">Getting Started Tutorial</h3>
              <p className="text-sm text-muted-foreground">Learn how to use Student Hub effectively</p>
            </div>
            <ArrowRight className="h-5 w-5 text-accent-foreground shrink-0" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default Index;
