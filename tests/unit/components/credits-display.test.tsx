import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CreditsDisplay } from "@/components/credits-display";

describe("CreditsDisplay", () => {
  it("renders credit amount", () => {
    render(<CreditsDisplay credits={47} />);
    expect(screen.getByText("47")).toBeInTheDocument();
  });

  it("shows warning styling when credits < 10", () => {
    render(<CreditsDisplay credits={5} />);
    const el = screen.getByTestId("credits-display");
    expect(el.className).toMatch(/amber/i);
  });

  it("shows normal styling when credits >= 10", () => {
    render(<CreditsDisplay credits={50} />);
    const el = screen.getByTestId("credits-display");
    expect(el.className).not.toMatch(/amber/i);
  });

  it("shows 0 credits state", () => {
    render(<CreditsDisplay credits={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
