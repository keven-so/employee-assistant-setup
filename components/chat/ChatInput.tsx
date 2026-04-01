"use client";

import { useState, useRef, useEffect } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { isListening, start, stop, supported } = useSpeechRecognition();

  useEffect(() => {
    if (!isListening) inputRef.current?.focus();
  }, [disabled, isListening]);

  const handleSubmit = (text?: string) => {
    const trimmed = (text ?? value).trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleMicClick = () => {
    if (isListening) { stop(); return; }

    let interim = "";
    start(
      (transcript, isFinal) => {
        interim = transcript;
        setValue(transcript);
        if (isFinal) {
          setValue("");
          handleSubmit(transcript);
        }
      },
      () => {
        if (interim.trim()) {
          setValue("");
          handleSubmit(interim);
        }
      }
    );
  };

  return (
    <div className="px-3 py-3" style={{ borderTop: "1px solid var(--border)" }}>
      <div
        className="flex items-center gap-2 rounded-[12px] px-3 py-2.5 transition-all"
        style={{
          background: "var(--glass-b)",
          border: isListening
            ? "1.5px solid var(--red-dot)"
            : "1.5px solid var(--border)",
          boxShadow: isListening ? "0 0 0 3px rgba(239,68,68,0.15)" : "none",
        }}
      >
        {supported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={disabled}
            title={isListening ? "Stop recording" : "Speak a message"}
            className="text-[14px] transition-all disabled:opacity-30"
            style={{
              color: isListening ? "var(--red-dot)" : "var(--text-3)",
              animation: isListening ? "pulse 1.5s infinite" : "none",
            }}
          >
            {isListening ? "\uD83D\uDD34" : "\uD83C\uDF99\uFE0F"}
          </button>
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={isListening ? "Listening\u2026" : "Ask anything\u2026"}
          disabled={disabled}
          className="flex-1 bg-transparent text-[12px] outline-none"
          style={{ color: "var(--text-1)" }}
        />

        <button
          onClick={() => handleSubmit()}
          disabled={disabled || !value.trim()}
          className="text-[16px] transition-opacity disabled:opacity-30"
          style={{ color: "var(--purple)" }}
        >
          {"\u2192"}
        </button>
      </div>

      {isListening && (
        <p className="text-[9px] mt-1.5 text-center" style={{ color: "var(--red-dot)", animation: "pulse 1.5s infinite" }}>
          {"\uD83C\uDF99"} Listening{"\u2026"} speak now, then pause to send
        </p>
      )}
    </div>
  );
}
