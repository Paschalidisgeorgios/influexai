"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CreatorGoalPlan } from "@/lib/tools/agent-tool-capability-planner";
import { planCreatorGoal } from "@/lib/tools/agent-recommendation-ui";

export function useAgentToolRecommendations(initialGoal = "") {
  const [goal, setGoal] = useState(initialGoal);
  const [plan, setPlan] = useState<CreatorGoalPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialPlanned = useRef(false);

  const suggestWorkflow = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Bitte beschreibe zuerst dein Creator-Ziel.");
      setPlan(null);
      return false;
    }

    setLoading(true);
    setError(null);
    setGoal(trimmed);

    try {
      const nextPlan = planCreatorGoal(trimmed);
      if (!nextPlan || nextPlan.recommendations.length === 0) {
        setPlan(nextPlan);
        setError(
          "Kein passendes Tool gefunden. Formuliere dein Ziel konkreter — z. B. TikTok-Video mit AI-Influencer."
        );
        return false;
      }
      setPlan(nextPlan);
      return true;
    } catch {
      setError("Der Workflow-Vorschlag konnte nicht erstellt werden.");
      setPlan(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPlan = useCallback(() => {
    setPlan(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (initialGoal.trim() && !initialPlanned.current) {
      initialPlanned.current = true;
      void suggestWorkflow(initialGoal);
    }
  }, [initialGoal, suggestWorkflow]);

  return {
    goal,
    plan,
    loading,
    error,
    suggestWorkflow,
    clearPlan,
    hasPlan: plan !== null,
  };
}
