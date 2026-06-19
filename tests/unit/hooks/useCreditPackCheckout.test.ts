import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCreditPackCheckout } from "@/hooks/useCreditPackCheckout";
import { CHECKOUT_USER_MESSAGES } from "@/lib/checkout-messages";

describe("useCreditPackCheckout plan gate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not call checkout API when hasActivePlan is false", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useCreditPackCheckout({ hasActivePlan: false })
    );

    await act(async () => {
      await result.current.checkout("small");
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.error).toBe(CHECKOUT_USER_MESSAGES.planRequired);
  });

  it("calls checkout API when hasActivePlan is true", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ url: "https://checkout.stripe.test/session" }),
    }));
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });

    const { result } = renderHook(() =>
      useCreditPackCheckout({ hasActivePlan: true })
    );

    await act(async () => {
      await result.current.checkout("small");
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/credits/checkout",
      expect.objectContaining({ method: "POST" })
    );
  });
});
