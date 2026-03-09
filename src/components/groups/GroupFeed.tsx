import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, Calendar, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GroupFeedProps {
  groupId: string;
}

const GroupFeed = ({ groupId }: GroupFeedProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutput, setSelectedOutput] = useState<any>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    loadFeed();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`group-feed-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shared_content",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Fetch the full content with relations
          const { data: newContent } = await supabase
            .from("shared_content")
            .select(`
              *,
              saved_outputs(*),
              profiles:shared_by(display_name)
            `)
            .eq("id", payload.new.id)
            .single();

          if (newContent && newContent.shared_by !== user?.id) {
            // Only show toast if not shared by current user
            const sharer = newContent.profiles?.display_name || "Someone";
            const toolName = newContent.saved_outputs?.tool?.replace(/-/g, " ") || "content";
            
            toast({
              title: "New content shared",
              description: `${sharer} shared ${toolName}`,
            });
          }

          if (newContent) {
            setContent((prev) => [newContent, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user]);

  const loadFeed = async () => {
    const { data } = await supabase
      .from("shared_content")
      .select(`
        *,
        saved_outputs(*),
        profiles:shared_by(display_name)
      `)
      .eq("group_id", groupId)
      .order("shared_at", { ascending: false });

    if (data) setContent(data);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center text-sm text-muted-foreground">Loading feed...</div>;
  }

  if (content.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="rounded-full p-3 bg-muted w-fit mx-auto">
          <Share2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-sm mb-1">No shared content yet</h3>
          <p className="text-xs text-muted-foreground">
            Share notes, flashcards, and study materials from your library
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {content.map((item) => {
          const output = item.saved_outputs;
          const sharer = item.profiles?.display_name || "Unknown";
          const initial = sharer[0]?.toUpperCase() || "?";

          return (
            <Card key={item.id} className="cursor-pointer hover:bg-accent/30 transition-colors">
              <CardContent className="p-4" onClick={() => setSelectedOutput(output)}>
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{sharer}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.shared_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <FileText className="h-3 w-3" />
                      <span className="capitalize">{output?.tool?.replace(/-/g, " ")}</span>
                      {output?.subject && (
                        <>
                          <span>•</span>
                          <span>{output.subject}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2">{output?.output_text?.slice(0, 150)}...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedOutput} onOpenChange={() => setSelectedOutput(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedOutput?.custom_title || "Shared Content"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOutput?.subject && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{selectedOutput.subject}</span>
              </div>
            )}
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {selectedOutput?.output_text}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GroupFeed;
