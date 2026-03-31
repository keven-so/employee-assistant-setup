"use client";

import { useState, useCallback, useEffect } from "react";

const MUTE_KEY = "assistant-tts-muted";

function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MUTE_KEY);
      if (stored === "true") setMuted(true);
    } catch {
      // ignore
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (muted || typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const clean = cleanForSpeech(text);
      if (!clean) return;
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.name.includes("Samantha") ||
          v.name.includes("Google US English") ||
          v.name.includes("Microsoft Zira") ||
          (v.lang === "en-US" && !v.name.includes("Compact"))
      );
      if (preferred) utterance.voice = preferred;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [muted]
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      try { localStorage.setItem(MUTE_KEY, String(next)); } catch { /* ignore */ }
      if (next && typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
      }
      return next;
    });
  }, []);

  return { speak, stop, isSpeaking, muted, toggleMute };
}
