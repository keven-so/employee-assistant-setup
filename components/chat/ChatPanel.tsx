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
    <div
      className="glass-card flex flex-col flex-1 min-h-0 overflow-hidden"
      style={{ animation: "fadeLeft 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both" }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-[28px] h-[28px] rounded-[10px] flex items-center justify-center text-white text-[11px] font-bold"
            style={{ background: "linear-gradient(135deg, var(--purple), var(--teal))" }}
          >
            AI
          </div>
          <div>
            <div className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>Assistant</div>
            <div className="flex items-center gap-1">
              <div
                className="w-[6px] h-[6px] rounded-full"
                style={{ background: "var(--green)", animation: "pulse 2s ease infinite" }}
              />
              <span className="text-[9px]" style={{ color: "var(--text-3)" }}>Online</span>
              {isSpeaking && (
                <span className="text-[9px]" style={{ color: "var(--text-3)", animation: "pulse 1.5s ease infinite" }}>
                  {" · \uD83D\uDD0A"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { stop(); toggleMute(); }}
            title={muted ? "Unmute voice" : "Mute voice"}
            className="text-[14px] transition-opacity hover:opacity-70"
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
              className="text-[10px] font-medium px-2 py-1 rounded-[8px] cursor-pointer"
              style={{ color: "var(--text-3)", background: "rgba(155,170,191,0.12)" }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="text-center mt-8" style={{ color: "var(--text-3)" }}>
            <p className="text-[12px]">Hi {displayName}! Ask me anything.</p>
            <p className="text-[10px] mt-1">{"\uD83C\uDF99"} Tap mic to speak</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
        ))}
        {isLoading && (
          <div className="mb-3">
            <div
              className="rounded-[14px] rounded-bl-sm px-4 py-3 max-w-[90%] text-[12px]"
              style={{
                background: "var(--glass)",
                border: "1px solid var(--border)",
                color: "var(--text-3)",
              }}
            >
              <span style={{ animation: "pulse 1.5s infinite" }}>Thinking{"\u2026"}</span>
            </div>
          </div>
        )}
      </div>

      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
