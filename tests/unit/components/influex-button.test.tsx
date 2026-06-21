import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { InfluexButton } from "@/components/shared/influex/InfluexButton";

describe("InfluexButton", () => {
  it("forwards onClick to native button elements", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <InfluexButton type="button" onClick={onClick}>
        Plan auswählen
      </InfluexButton>
    );

    await user.click(screen.getByRole("button", { name: "Plan auswählen" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("forwards title and aria attributes used by pricing CTAs", () => {
    render(
      <InfluexButton type="button" title="Abo erforderlich" aria-label="Credits kaufen">
        Credits kaufen
      </InfluexButton>
    );

    const button = screen.getByRole("button", { name: "Credits kaufen" });
    expect(button).toHaveAttribute("title", "Abo erforderlich");
  });
});
