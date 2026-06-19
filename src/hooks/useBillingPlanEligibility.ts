"use client";

import { useEffect, useState } from "react";
import { getCreditsPageStats } from "@/app/actions/credits-page";

export type BillingPlanEligibilityState = {
  loaded: boolean;
  loggedIn: boolean;
  hasBillingPlan: boolean;
};

export function useBillingPlanEligibility(): BillingPlanEligibilityState {
  const [state, setState] = useState<BillingPlanEligibilityState>({
    loaded: false,
    loggedIn: false,
    hasBillingPlan: false,
  });

  useEffect(() => {
    let cancelled = false;

    getCreditsPageStats()
      .then((stats) => {
        if (cancelled) return;
        if (stats === null) {
          setState({ loaded: true, loggedIn: false, hasBillingPlan: false });
          return;
        }
        setState({
          loaded: true,
          loggedIn: true,
          hasBillingPlan: stats.hasActivePlan,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ loaded: true, loggedIn: false, hasBillingPlan: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
