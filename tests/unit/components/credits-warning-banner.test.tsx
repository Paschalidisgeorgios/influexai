import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { CreditsWarningBanner } from "@/components/credits-warning-banner";

describe("CreditsWarningBanner", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders nothing when credits > 10", () => {
    const { container } = render(<CreditsWarningBanner credits={50} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows warning banner when credits <= 10", () => {
    render(<CreditsWarningBanner credits={8} />);
    expect(screen.getByTestId("credits-warning-banner")).toBeInTheDocument();
    expect(
      screen.getByText(/8.*[Cc]redits|[Cc]redits.*8/i)
    ).toBeInTheDocument();
  });

  it("shows urgent banner when credits <= 3", () => {
    render(<CreditsWarningBanner credits={2} />);
    const banner = screen.getByTestId("credits-warning-banner");
    expect(banner).toHaveAttribute("data-variant", "urgent");
  });

  it("shows blocking banner when credits = 0", () => {
    render(<CreditsWarningBanner credits={0} />);
    const banner = screen.getByTestId("credits-warning-banner");
    expect(banner).toHaveAttribute("data-variant", "empty");
    expect(
      screen.queryByRole("button", { name: /schließen|close/i })
    ).not.toBeInTheDocument();
  });

  it("can be dismissed when credits > 0", async () => {
    const user = userEvent.setup();
    render(<CreditsWarningBanner credits={5} />);

    const dismissBtn = screen.getByRole("button", { name: /schließen|close/i });
    await user.click(dismissBtn);

    expect(
      screen.queryByTestId("credits-warning-banner")
    ).not.toBeInTheDocument();
  });
});
