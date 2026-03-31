interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`mb-5 flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[90%] rounded-xl px-5 py-4 text-base leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-muted))] text-[hsl(var(--bg-base))] font-medium rounded-br-sm"
            : "bg-[hsl(var(--bg-card))] border border-[hsl(var(--border))] rounded-bl-sm"
        }`}
      >
        {content}
      </div>
      {timestamp && (
        <span className="text-xs text-[hsl(var(--text-dim))] mt-1.5">
          {timestamp}
        </span>
      )}
    </div>
  );
}
