"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type BadgeMessage = { text: string; priority: number; duration: number };

const FADE_MS = 280;
const DEFAULT_DURATION = 4000;

export function useSentientBadge(isTyping: boolean) {
  const [message, setMessage] = useState("● AI CORE: ACTIVE");
  const [isVisible, setIsVisible] = useState(true);
  const queueRef = useRef<BadgeMessage[]>([]);
  const activeRef = useRef<BadgeMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPriorityRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const displayMessage = useCallback((item: BadgeMessage) => {
    activeRef.current = item;
    currentPriorityRef.current = item.priority;
    setIsVisible(false);
    timerRef.current = setTimeout(() => {
      setMessage(item.text);
      setIsVisible(true);
      timerRef.current = setTimeout(() => {
        activeRef.current = null;
        currentPriorityRef.current = 0;
        const next = queueRef.current.sort((a, b) => b.priority - a.priority).shift();
        if (next && !isTyping) displayMessage(next);
        else if (queueRef.current.length && !isTyping) {
          const queued = queueRef.current.sort((a, b) => b.priority - a.priority).shift();
          if (queued) displayMessage(queued);
        }
      }, item.duration);
    }, FADE_MS);
  }, [isTyping]);

  const showMessage = useCallback(
    (text: string, duration = DEFAULT_DURATION, priority = 1) => {
      const item: BadgeMessage = { text, priority, duration };

      if (isTyping) {
        queueRef.current.push(item);
        queueRef.current.sort((a, b) => b.priority - a.priority);
        return;
      }

      if (activeRef.current && priority <= currentPriorityRef.current) {
        queueRef.current.push(item);
        queueRef.current.sort((a, b) => b.priority - a.priority);
        return;
      }

      clearTimer();
      queueRef.current = queueRef.current.filter((q) => q.priority > priority);
      displayMessage(item);
    },
    [isTyping, displayMessage]
  );

  useEffect(() => {
    if (!isTyping && queueRef.current.length && !activeRef.current) {
      const next = queueRef.current.sort((a, b) => b.priority - a.priority).shift();
      if (next) displayMessage(next);
    }
  }, [isTyping, displayMessage]);

  useEffect(() => () => clearTimer(), []);

  return {
    message,
    badgeText: message,
    badgeVisible: isVisible,
    isVisible,
    showMessage,
    setBadge: showMessage,
  };
}
