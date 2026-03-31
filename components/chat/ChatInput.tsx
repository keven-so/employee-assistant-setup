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
    <div className="px-6 py-5 border-t border-[hsl(var(--border))]">
      <div
        className={`flex items-center gap-3 bg-[hsl(var(--bg-card))] rounded-xl px-5 py-4 border transition-colors ${
          isListening
            ? "border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
            : "border-[hsl(var(--border))] focus-within:border-[hsl(var(--primary))]"
        }`}
      >
        {supported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={disabled}
            title={isListening ? "Stop recording" : "Speak a message"}
            className={`text-lg transition-all disabled:opacity-30 ${
              isListening
                ? "text-red-500 animate-pulse scale-110"
                : "text-[hsl(var(--text-dim))] hover:text-[hsl(var(--primary))]"
            }`}
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
          className="flex-1 bg-transparent text-base outline-none placeholder:text-[hsl(var(--text-dim))]"
        />

        <button
          onClick={() => handleSubmit()}
          disabled={disabled || !value.trim()}
          className="text-[hsl(var(--primary))] text-xl hover:opacity-80 disabled:opacity-30 transition-opacity"
        >
          \u2192
        </button>
      </div>

      {isListening && (
        <p className="text-xs text-red-400 mt-2 text-center animate-pulse">
          \uD83C\uDF99 Listening\u2026 speak now, then pause to send
        </p>
      )}
    </div>
  );
}
