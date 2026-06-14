import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { CreditsWarningBanner } from "@/components/credits-warning-banner";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { email: "user@test.com" } },
      }),
    },
  }),
}));

const messages = {
  buyCredits: {
    urgent_banner: "Almost out of credits!",
    low_banner: "Running low — {count} credits left",
    low_credit_plan_hint: "You can still use free plan previews.",
    top_up: "Top up now",
    dismiss: "Close banner",
  },
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="de" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("CreditsWarningBanner", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders nothing when credits > 10", async () => {
    const { container } = renderWithIntl(<CreditsWarningBanner credits={50} />);
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it("shows warning banner when credits <= 10", async () => {
    renderWithIntl(<CreditsWarningBanner credits={8} />);
    expect(
      await screen.findByTestId("credits-warning-banner")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/8.*[Cc]redits|[Cc]redits.*8/i)
    ).toBeInTheDocument();
  });

  it("shows urgent banner when credits <= 3", async () => {
    renderWithIntl(<CreditsWarningBanner credits={2} />);
    const banner = await screen.findByTestId("credits-warning-banner");
    expect(banner).toHaveAttribute("data-variant", "critical");
  });

  it("shows blocking banner when credits = 0", async () => {
    renderWithIntl(<CreditsWarningBanner credits={0} />);
    const banner = await screen.findByTestId("credits-warning-banner");
    expect(banner).toHaveAttribute("data-variant", "critical");
    expect(screen.getByText(/Almost out of credits!/i)).toBeInTheDocument();
  });

  it("can be dismissed when credits > 0", async () => {
    const user = userEvent.setup();
    renderWithIntl(<CreditsWarningBanner credits={5} />);

    const dismissBtn = await screen.findByRole("button", {
      name: /schließen|close/i,
    });
    await user.click(dismissBtn);

    expect(
      screen.queryByTestId("credits-warning-banner")
    ).not.toBeInTheDocument();
  });
});
