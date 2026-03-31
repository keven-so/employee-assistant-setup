"use client";

import { useState, useRef, useCallback, useEffect } from "react";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }, []);

  const start = useCallback(
    (
      onResult: (interim: string, final: boolean) => void,
      onEnd?: () => void
    ) => {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) return;

      recognitionRef.current?.abort();

      const recognition = new SpeechRecognitionAPI();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;
        const isFinal = result.isFinal;
        onResult(text, isFinal);
      };

      recognition.onend = () => {
        setIsListening(false);
        onEnd?.();
      };

      recognition.onerror = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    },
    []
  );

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, start, stop, supported };
}
