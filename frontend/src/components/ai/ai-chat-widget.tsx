"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Send, X, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { askAI, getAIChatHistory } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function AIChatWidget() {
  const { isAuthenticated, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load history when chat opens
  useEffect(() => {
    if (isOpen && (isAuthenticated || token)) {
      loadHistory();
    }
  }, [isOpen, isAuthenticated, token]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const history = await getAIChatHistory();
      setMessages(history);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const [isCooldown, setIsCooldown] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const body = input.trim();
    if (!body || isTyping || isCooldown) return;

    const tempId = `local-${Date.now()}`;
    const userMsg: Message = {
      id: tempId,
      role: "user",
      content: body,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setIsCooldown(true);

    try {
      // Get only the most recent context to keep it fast
      const context = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { answer, id } = await askAI(body, context);

      if (!id) {
        // Error response not saved to DB — show as toast, remove temp user msg
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error(answer);
        return;
      }

      const aiMsg: Message = {
        id,
        role: "assistant",
        content: answer,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI chat error:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsTyping(false);
      // Cooldown for 3 seconds to prevent spamming
      setTimeout(() => setIsCooldown(false), 3000);
    }
  };

  if (!mounted || (!isAuthenticated && !token)) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-6 z-[9999] flex flex-col items-end gap-4 pointer-events-none">
      {/* Chat Window */}
      <div
        className={cn(
          "flex h-[550px] w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300 ease-in-out",
          isOpen
            ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
            : "pointer-events-none translate-y-10 opacity-0 scale-95"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-primary px-4 py-4 text-primary-foreground shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
              <Bot className="size-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">SyncBot AI</h3>
              <p className="text-[10px] font-medium opacity-90 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Assistant
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="size-8 rounded-full hover:bg-white/10 text-primary-foreground"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-surface p-4 space-y-4">
          {isLoading && messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-8 animate-spin text-primary/40" />
                <span className="text-xs text-muted-foreground font-medium">Loading history...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="bg-primary-soft p-5 rounded-full text-primary shadow-sm">
                <MessageSquare className="size-10" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Welcome to SyncTalk AI!</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  I'm your intelligent assistant. Ask me anything about the platform or for help with your tasks.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[88%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === "user" ? "ml-auto items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-surface-container-highest border border-border text-foreground rounded-tl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
                <span className="mt-1.5 text-[10px] text-muted-foreground font-medium px-1">
                  {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="flex items-start animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="bg-surface-container-highest border border-border rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" />
                <span className="ml-2 text-[10px] font-bold text-primary/60 uppercase tracking-wider">SyncBot is thinking</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="p-4 bg-surface border-t border-border/50"
        >
          <div className="relative flex items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 bg-surface-container-low rounded-xl border border-border/60 pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
            />
            <Button
              disabled={!input.trim() || isTyping || isCooldown}
              size="icon"
              className={cn(
                "absolute right-1.5 size-9 rounded-lg transition-all",
                (input.trim() && !isCooldown)
                  ? "bg-primary text-primary-foreground hover:scale-105 active:scale-95" 
                  : "bg-muted text-muted-foreground opacity-50"
              )}
            >
              {isTyping ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </form>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "pointer-events-auto group flex h-14 w-14 items-center justify-center rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all duration-500 hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] active:scale-90 overflow-hidden relative",
          isOpen 
            ? "bg-destructive text-destructive-foreground rotate-90" 
            : "bg-primary text-primary-foreground hover:scale-110"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {isOpen ? <X className="size-6" /> : <Bot className="size-7" />}
      </button>
    </div>
  );
}
