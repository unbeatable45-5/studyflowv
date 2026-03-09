import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar, Share2, Search, Lightbulb, CalendarDays, Layers, FileUp, X, MessageCircle, Send, Trash2 } from "lucide-react";
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

const toolFilters = [
  { value: "all", label: "All", icon: null },
  { value: "study-helper", label: "Study", icon: Lightbulb },
  { value: "note-organizer", label: "Notes", icon: FileText },
  { value: "revision-planner", label: "Plans", icon: CalendarDays },
  { value: "flashcard-generator", label: "Cards", icon: Layers },
  { value: "pdf-summarizer", label: "PDFs", icon: FileUp },
];

const GroupFeed = ({ groupId }: GroupFeedProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutput, setSelectedOutput] = useState<any>(null);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toolFilter, setToolFilter] = useState("all");
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
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
              saved_outputs(*)
            `)
            .eq("id", payload.new.id)
            .single();

          if (newContent && newContent.shared_by !== user?.id) {
            // Fetch sharer's profile separately
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("user_id", newContent.shared_by)
              .single();

            const sharer = profile?.display_name || "Someone";
            const toolName = newContent.saved_outputs?.tool?.replace(/-/g, " ") || "content";
            
            toast({
              title: "New content shared",
              description: `${sharer} shared ${toolName}`,
            });

            // Add profile to the content object for display
            const contentWithProfile = {
              ...newContent,
              profiles: profile,
            };
            setContent((prev) => [contentWithProfile, ...prev]);
          } else if (newContent) {
            setContent((prev) => [newContent, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user]);

  // Load comments when output is selected
  useEffect(() => {
    if (selectedContentId) {
      loadComments(selectedContentId);

      // Subscribe to new comments
      const channel = supabase
        .channel(`comments-${selectedContentId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "comments",
            filter: `shared_content_id=eq.${selectedContentId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              loadComments(selectedContentId);
            } else if (payload.eventType === "DELETE") {
              setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedContentId]);

  const loadFeed = async () => {
    // Fetch shared content
    const { data: sharedData } = await supabase
      .from("shared_content")
      .select("*")
      .eq("group_id", groupId)
      .order("shared_at", { ascending: false });

    if (sharedData && sharedData.length > 0) {
      // Fetch related outputs and profiles
      const outputIds = sharedData.map((s) => s.output_id);
      const sharerIds = sharedData.map((s) => s.shared_by);

      const [{ data: outputs }, { data: profiles }] = await Promise.all([
        supabase.from("saved_outputs").select("*").in("id", outputIds),
        supabase.from("profiles").select("user_id, display_name").in("user_id", sharerIds),
      ]);

      // Combine the data
      const combined = sharedData.map((shared) => ({
        ...shared,
        saved_outputs: outputs?.find((o) => o.id === shared.output_id),
        profiles: profiles?.find((p) => p.user_id === shared.shared_by),
      }));

      setContent(combined);
    } else {
      setContent([]);
    }

    setLoading(false);
    initialLoadRef.current = false;
  };

  const loadComments = async (contentId: string) => {
    const { data: commentsData } = await supabase
      .from("comments")
      .select("*")
      .eq("shared_content_id", contentId)
      .order("created_at", { ascending: true });

    if (commentsData && commentsData.length > 0) {
      const userIds = [...new Set(commentsData.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const commentsWithProfiles = commentsData.map((comment) => ({
        ...comment,
        profile: profiles?.find((p) => p.user_id === comment.user_id),
      }));

      setComments(commentsWithProfiles);
    } else {
      setComments([]);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !selectedContentId || !user) return;
    setPostingComment(true);

    const { error } = await supabase.from("comments").insert({
      shared_content_id: selectedContentId,
      user_id: user.id,
      comment_text: commentText.trim(),
    });

    if (error) {
      toast({ title: "Failed to post comment", variant: "destructive" });
    } else {
      setCommentText("");
      toast({ title: "Comment posted!" });
    }

    setPostingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (!error) {
      toast({ title: "Comment deleted" });
    }
  };

  const handleOpenContent = (item: any) => {
    setSelectedOutput(item.saved_outputs);
    setSelectedContentId(item.id);
  };

  const handleCloseDialog = () => {
    setSelectedOutput(null);
    setSelectedContentId(null);
    setComments([]);
    setCommentText("");
  };

  // Filter content based on search and tool filter
  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      const output = item.saved_outputs;
      const sharer = item.profiles?.display_name || "";
      
      // Tool filter
      if (toolFilter !== "all" && output?.tool !== toolFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = output?.output_text?.toLowerCase().includes(query);
        const matchesSubject = output?.subject?.toLowerCase().includes(query);
        const matchesSharer = sharer.toLowerCase().includes(query);
        const matchesTool = output?.tool?.replace(/-/g, " ").toLowerCase().includes(query);
        
        if (!matchesText && !matchesSubject && !matchesSharer && !matchesTool) {
          return false;
        }
      }
      
      return true;
    });
  }, [content, searchQuery, toolFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setToolFilter("all");
  };

  const hasActiveFilters = searchQuery.trim() || toolFilter !== "all";

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
      {/* Search and filters */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content, subjects, or members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {toolFilters.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={toolFilter === filter.value ? "default" : "outline"}
              className="shrink-0 text-xs gap-1.5 h-7 px-2.5"
              onClick={() => setToolFilter(filter.value)}
            >
              {filter.icon && <filter.icon className="h-3 w-3" />}
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Results info */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">
            {filteredContent.length} result{filteredContent.length !== 1 ? "s" : ""} found
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs h-6 px-2"
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Feed content */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <Search className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No matching content found</p>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredContent.map((item) => {
            const output = item.saved_outputs;
            const sharer = item.profiles?.display_name || "Unknown";
            const initial = sharer[0]?.toUpperCase() || "?";

            return (
              <Card key={item.id} className="cursor-pointer hover:bg-accent/30 transition-colors">
                <CardContent className="p-4" onClick={() => handleOpenContent(item)}>
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
      )}

      <Dialog open={!!selectedOutput} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedOutput?.custom_title || "Shared Content"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4">
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

            <Separator />

            {/* Comments section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">
                  Comments ({comments.length})
                </h3>
              </div>

              {/* Comment list */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                ) : (
                  comments.map((comment) => {
                    const commenterName = comment.profile?.display_name || "Unknown";
                    const initial = commenterName[0]?.toUpperCase() || "?";
                    const isOwn = comment.user_id === user?.id;

                    return (
                      <div key={comment.id} className="flex gap-2 group">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-xs">{commenterName}</p>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                            {isOwn && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {comment.comment_text}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add comment */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px] text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handlePostComment();
                    }
                  }}
                />
                <Button
                  onClick={handlePostComment}
                  disabled={!commentText.trim() || postingComment}
                  size="icon"
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Press Cmd/Ctrl + Enter to post
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GroupFeed;
