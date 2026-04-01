import { useState, useRef, useEffect } from "react";
import { Bot, Send, Trash2, Sparkles, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import MarkdownWithMath from "@/components/MarkdownWithMath";
import AIThinking from "@/components/AIThinking";
import { cn } from "@/lib/utils";
import { usePremium } from "@/contexts/PremiumContext";
import { useUsageLimitCheck } from "@/components/UsageLimitToast";

type Message = { role: "user" | "assistant"; content: string; deepThink?: boolean; ts?: number };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const CHAT_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

const starterPrompts = [
  "Explain photosynthesis like I'm 10",
  "Help me understand quadratic equations",
  "Quiz me on the French Revolution",
  "What are the best study techniques?",
];

const AiTutor = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { promptUpgrade } = usePremium();
  const { checkAndPrompt } = useUsageLimitCheck();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-expire chat messages older than 10 minutes
  useEffect(() => {
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setMessages(prev => {
        const filtered = prev.filter(m => !m.ts || (now - m.ts) < CHAT_EXPIRY_MS);
        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Check deep think limit
    if (deepThink && !checkAndPrompt("deep_think", "Deep Think")) return;

    const now = Date.now();
    const userMsg: Message = { role: "user", content: text.trim(), ts: now };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    const isDeep = deepThink;
    let assistantSoFar = "";
    const endpoint = isDeep ? "ai-tutor-deep" : "ai-tutor";

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          toast({ title: "Too many requests", description: "Please wait a moment and try again.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        if (resp.status === 402) {
          toast({ title: "Usage limit reached", description: "Upgrade to Pro for higher limits.", variant: "destructive" });
          setTimeout(() => promptUpgrade(), 500);
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to get response");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar, deepThink: isDeep, ts: Date.now() }];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch { /* ignore */ }
        }
      }

      // Show upgrade prompt after deep think usage
      if (isDeep) {
        setTimeout(() => {
          checkAndPrompt("deep_think", "Deep Think");
        }, 1000);
      }
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100vh-4rem)] max-w-3xl mx-auto px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between px-1 py-2.5 sm:py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-1.5 sm:p-2 bg-primary/10 text-primary shrink-0">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-display font-bold text-foreground truncate">AI Tutor</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Your personal study assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground gap-1 h-8 px-2 text-xs">
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 px-1 pb-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 sm:gap-6 py-6 sm:py-8">
            <div className="rounded-2xl sm:rounded-3xl p-3 sm:p-4 bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="text-center space-y-1 px-4">
              <h2 className="font-display font-bold text-foreground text-base sm:text-lg">What would you like to learn?</h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">Ask me anything — I'll explain, quiz you, or help you study.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md px-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-card hover:bg-accent text-xs sm:text-sm text-foreground transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="rounded-lg p-1 sm:p-1.5 bg-primary/10 text-primary h-fit mt-1 shrink-0">
                  {msg.deepThink ? <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </div>
              )}
              <div className="flex flex-col gap-1 max-w-[88%] sm:max-w-[85%] min-w-0">
                {msg.role === "assistant" && msg.deepThink && (
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5 w-fit border border-primary/20">
                    <Brain className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Deep Think
                  </span>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <MarkdownWithMath className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-1.5 prose-ul:my-1 prose-li:my-0.5 prose-p:text-xs sm:prose-p:text-sm prose-headings:text-sm sm:prose-headings:text-base break-words overflow-hidden">
                      {msg.content}
                    </MarkdownWithMath>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-2">
            <div className="rounded-lg p-1 sm:p-1.5 bg-primary/10 text-primary h-fit mt-1 shrink-0">
              {deepThink ? <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </div>
            <AIThinking message={deepThink ? "Deep thinking" : "Thinking"} className="flex-1 min-w-0" />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background pt-2 sm:pt-3 pb-1 px-1">
        <div className="flex gap-1.5 sm:gap-2 items-end">
          <button
            onClick={() => setDeepThink(!deepThink)}
            className={cn(
              "shrink-0 flex items-center gap-1 px-2 sm:px-3 py-2 rounded-xl text-[10px] sm:text-xs font-medium transition-all border",
              deepThink
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
            )}
            title={deepThink ? "Deep Think ON – slower but more thorough" : "Deep Think OFF – quick answers"}
          >
            <Brain className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", deepThink && "animate-pulse")} />
            <span className="hidden xs:inline">Deep</span>
          </button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={deepThink ? "Ask for a deep answer..." : "Ask me anything..."}
            className="min-h-[40px] sm:min-h-[44px] max-h-28 sm:max-h-32 resize-none rounded-xl text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="shrink-0 rounded-xl h-10 w-10 sm:h-11 sm:w-11"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {deepThink && (
          <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 sm:mt-1.5 ml-1 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-warning shrink-0" />
            <span className="truncate">Deep Think uses advanced reasoning — responses take longer</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default AiTutor;
