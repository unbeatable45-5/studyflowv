import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function GroupChat({ groupId }: { groupId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`group_messages:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          fetchMessageDetails(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("group_messages")
      .select(`
        *,
        profiles (
          display_name,
          avatar_url
        )
      `)
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
  };

  const fetchMessageDetails = async (messageId: string) => {
    const { data, error } = await supabase
      .from("group_messages")
      .select(`
        *,
        profiles (
          display_name,
          avatar_url
        )
      `)
      .eq("id", messageId)
      .single();

    if (!error && data) {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const text = newMessage;
    setNewMessage("");

    await supabase.from("group_messages").insert({
      group_id: groupId,
      user_id: user.id,
      message_text: text,
    });
  };

  if (loading) return <div className="p-4 text-center">Loading chat...</div>;

  return (
    <div className="flex flex-col h-[500px] bg-card rounded-lg border">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground pt-4">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 ${msg.user_id === user?.id ? "flex-row-reverse" : "flex-row"}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={msg.profiles?.avatar_url} />
                <AvatarFallback>
                  {msg.profiles?.display_name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className={`flex flex-col ${msg.user_id === user?.id ? "items-end" : "items-start"} max-w-[70%]`}>
                <span className="text-xs text-muted-foreground mb-1">
                  {msg.profiles?.display_name || "User"} • {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </span>
                <div 
                  className={`px-3 py-2 rounded-lg text-sm ${
                    msg.user_id === user?.id 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted rounded-tl-none"
                  }`}
                >
                  {msg.message_text}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
