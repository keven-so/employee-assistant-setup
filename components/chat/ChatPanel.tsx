"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const STORAGE_KEY = "employee-assistant-chat";
const EXPIRY_HOURS = 24;

function loadMessages(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const { messages, timestamp } = JSON.parse(stored);
    if (Date.now() - timestamp > EXPIRY_HOURS * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return messages;
  } catch {
    return [];
  }
}

function saveMessages(messages: Message[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, timestamp: Date.now() }));
}

export function ChatPanel() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const { speak, stop, isSpeaking, muted, toggleMute } = useSpeechSynthesis();

  const displayName = session?.user?.name?.split(" ")[0] || "there";

  useEffect(() => {
    if (!initialized.current) {
      setMessages(loadMessages());
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (initialized.current && messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const formatTime = () =>
    new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const sendMessage = async (content: string) => {
    const userMessage: Message = { role: "user", content, timestamp: formatTime() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const text = await res.text();
      const lines = text.split("\n").filter((l) => l.startsWith("data: "));
      let fullText = "";
      for (const line of lines) {
        const data = line.replace("data: ", "");
        if (data === "[DONE]") break;
        try { const parsed = JSON.parse(data); fullText += parsed.text || ""; } catch { /* skip */ }
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: fullText || "Sorry, I couldn't process that.",
        timestamp: formatTime(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      speak(assistantMessage.content);
    } catch {
      const errMsg = "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: errMsg, timestamp: formatTime() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className="flex-[0_0_35%] border-l border-[hsl(var(--border))] bg-[hsl(var(--bg-panel))] flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[hsl(var(--border))] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-base">Assistant</span>
          <span className="text-[hsl(var(--primary))] text-sm">{"\u25CF"} Online</span>
          {isSpeaking && (
            <span className="text-xs text-[hsl(var(--text-dim))] animate-pulse">{"\uD83D\uDD0A"} Speaking{"\u2026"}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { stop(); toggleMute(); }}
            title={muted ? "Unmute voice" : "Mute voice"}
            className="text-lg hover:opacity-80 transition-opacity"
          >
            {muted ? "\uD83D\uDD07" : "\uD83D\uDD0A"}
          </button>

          {messages.length > 0 && (
            <button
              onClick={() => {
                stop();
                setMessages([]);
                if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
              }}
              className="text-sm text-[hsl(var(--text-dim))] hover:text-[hsl(var(--text-secondary))]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
        {messages.length === 0 && (
          <div className="text-base text-[hsl(var(--text-dim))] text-center mt-12 space-y-2">
            <p>Hi {displayName}! Ask me about your calendar, tasks, or anything I can help with.</p>
            <p className="text-xs">{"\uD83C\uDF99"} Tap the mic to speak {"\u2022"} {"\uD83D\uDD0A"} Tap the speaker to mute</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
        ))}
        {isLoading && (
          <div className="mb-4">
            <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border))] rounded-xl rounded-bl-sm px-5 py-4 max-w-[90%] text-base text-[hsl(var(--text-dim))]">
              <span className="animate-pulse">Thinking{"\u2026"}</span>
            </div>
          </div>
        )}
      </div>

      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </aside>
  );
}
