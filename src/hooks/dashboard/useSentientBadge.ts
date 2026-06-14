"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CapsuleMessage = {
  text: string;
  duration: number;
  priority: number;
};

const DEFAULT_MSG = "AI CORE: ACTIVE [MODEL_COMPUTING]";

export function useSentientBadge(initialMessage = DEFAULT_MSG) {
  const [message, setMessage] = useState(initialMessage);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const queueRef = useRef<CapsuleMessage[]>([]);
  const activeRef = useRef<CapsuleMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const priorityRef = useRef(0);
  const showMessageRef = useRef<
    (text: string, duration?: number, priority?: number) => void
  >(() => {});

  const showMessage = useCallback((text: string, duration = 4000, priority = 5) => {
    const item: CapsuleMessage = { text, duration, priority };

    if (activeRef.current && priority <= priorityRef.current) {
      queueRef.current.push(item);
      queueRef.current.sort((a, b) => b.priority - a.priority);
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }

    setIsFlashing(true);
    setIsVisible(false);

    timerRef.current = setTimeout(() => {
      setMessage(text);
      setIsVisible(true);
      activeRef.current = item;
      priorityRef.current = priority;

      timerRef.current = setTimeout(() => {
        setIsFlashing(false);
        activeRef.current = null;
        priorityRef.current = 0;
        const next = queueRef.current.shift();
        if (next) {
          showMessageRef.current(next.text, next.duration, next.priority);
        } else {
          setMessage(DEFAULT_MSG);
        }
      }, duration);
    }, 200);
  }, []);

  useEffect(() => {
    showMessageRef.current = showMessage;
  }, [showMessage]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { message, isFlashing, isVisible, showMessage };
}
