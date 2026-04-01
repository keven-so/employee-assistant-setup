interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`mb-3 flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[90%] rounded-[14px] px-4 py-3 text-[12px] leading-relaxed ${
          isUser ? "rounded-br-sm" : "rounded-bl-sm"
        }`}
        style={
          isUser
            ? {
                background: "linear-gradient(135deg, var(--purple), var(--teal))",
                color: "white",
                fontWeight: 500,
              }
            : {
                background: "var(--glass)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }
        }
      >
        {content}
      </div>
      {timestamp && (
        <span className="text-[9px] mt-1" style={{ color: "var(--text-3)" }}>
          {timestamp}
        </span>
      )}
    </div>
  );
}
