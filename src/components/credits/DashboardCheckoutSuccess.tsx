"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/** Inline success hint on /dashboard after Stripe redirect (?success=true). */
export function DashboardCheckoutSuccess() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") !== "true") return;
    setVisible(true);
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="mb-4 rounded-xl border border-[rgba(180,255,0,0.25)] bg-[rgba(180,255,0,0.08)] px-4 py-3 text-sm text-[#F0EFE8]"
    >
      Zahlung erfolgreich — Credits werden in Kürze gutgeschrieben.
    </div>
  );
}
