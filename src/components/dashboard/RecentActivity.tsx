import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Lightbulb, FileText, CalendarDays, Layers, BookOpen, FileUp, FileDown, FilePlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecentOutputs } from "@/lib/saved-outputs";
import { formatDistanceToNow } from "date-fns";
import { MotionCard, StaggerContainer, StaggerItem } from "@/components/ui/motion";

const toolMeta: Record<string, { icon: typeof Lightbulb; color: string; label: string; to: string }> = {
  "study-helper": { icon: Lightbulb, color: "text-primary", label: "Study Helper", to: "/study" },
  "note-organizer": { icon: FileText, color: "text-success", label: "Note Organizer", to: "/notes" },
  "revision-planner": { icon: CalendarDays, color: "text-warning", label: "Revision Planner", to: "/planner" },
  "flashcard-generator": { icon: Layers, color: "text-primary", label: "Flashcards", to: "/flashcards" },
  "study-mode": { icon: BookOpen, color: "text-accent-foreground", label: "Study Mode", to: "/study-mode" },
  "pdf-summarizer": { icon: FileUp, color: "text-success", label: "PDF Summary", to: "/pdf-summarizer" },
  "pdf-export": { icon: FileDown, color: "text-destructive", label: "PDF Export", to: "/pdf-export" },
  "pdf-builder": { icon: FilePlus, color: "text-warning", label: "PDF Builder", to: "/pdf-builder" },
};

interface SavedOutput {
  id: string;
  tool: string;
  input_data: any;
  output_text: string;
  created_at: string;
  custom_title?: string;
  subject?: string;
}

const RecentActivity = () => {
  const [recents, setRecents] = useState<SavedOutput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentOutputs(undefined, 5).then((data) => {
      setRecents(data as SavedOutput[]);
      setLoading(false);
    });
  }, []);

  const getLabel = (item: SavedOutput) => {
    if (item.custom_title) return item.custom_title;
    if (item.subject) return item.subject;
    if (item.tool === "study-helper") return (item.input_data as any)?.topic || "Study Session";
    return toolMeta[item.tool]?.label || "Output";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent Activity</h2>
        </div>
        <Link to="/history" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">View all</Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      ) : recents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            No results yet — try a tool above to get started!
          </CardContent>
        </Card>
      ) : (
        <StaggerContainer className="space-y-2" delay={0.05}>
          {recents.map((item) => {
            const meta = toolMeta[item.tool];
            if (!meta) return null;
            const Icon = meta.icon;
            const preview = item.output_text.slice(0, 60).replace(/\n/g, " ");

            return (
              <StaggerItem key={item.id}>
                <Link to={meta.to}>
                  <MotionCard className="cursor-pointer">
                    <Card className="border-border/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={`rounded-xl p-2 bg-muted ${meta.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{getLabel(item)}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{preview}…</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </CardContent>
                    </Card>
                  </MotionCard>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </div>
  );
};

export default RecentActivity;
