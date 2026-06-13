"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface CapsuleMessage {
  text: string;
  priority: number;
  duration: number;
}

export function useSmartCapsule() {
  const [displayText, setDisplayText] = useState("AI CORE: ACTIVE");
  const [textOpacity, setTextOpacity] = useState(1);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const queueRef = useRef<CapsuleMessage[]>([]);
  const isShowingRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  const processQueueRef = useRef<() => void>(() => {});

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0) {
      isShowingRef.current = false;
      return;
    }
    isShowingRef.current = true;
    const next = queueRef.current.shift()!;
    setTextOpacity(0);
    window.setTimeout(() => {
      setDisplayText(next.text);
      setTextOpacity(1);
      setIsFlashing(true);
      window.setTimeout(() => setIsFlashing(false), 600);
    }, 200);
    timerRef.current = window.setTimeout(() => {
      setTextOpacity(0);
      window.setTimeout(() => {
        setDisplayText("AI CORE: ACTIVE");
        setTextOpacity(1);
        processQueueRef.current();
      }, 200);
    }, next.duration);
  }, []);

  processQueueRef.current = processQueue;

  const showMessage = useCallback(
    (text: string, duration = 4000, priority = 1) => {
      queueRef.current = queueRef.current.filter((m) => m.priority >= priority);
      queueRef.current.push({ text, priority, duration });
      queueRef.current.sort((a, b) => b.priority - a.priority);
      if (!isShowingRef.current) processQueueRef.current();
    },
    []
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return { displayText, textOpacity, isFlashing, isScrolled, showMessage };
}

export type SmartCapsuleApi = ReturnType<typeof useSmartCapsule>;
