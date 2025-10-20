/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Secret from "./Secret";

describe("Secret Component", () => {
  const defaultProps = {
    mine: false,
    revealed: false,
    murderer: false,
    accomplice: false,
    isSelected: false,
    onClick: undefined,
  };

  beforeEach(() => {
    cleanup();
  });

  // Usamos it.each para probar eficientemente las combinaciones de props
  it.each([
    // Mis secretos
    {
      props: { mine: true, murderer: false, accomplice: false },
      expectedImage: "06-secret_front.png",
      description: "shows my base secret (front)",
    },
    {
      props: { mine: true, murderer: true, accomplice: false },
      expectedImage: "03-secret_murderer.png",
      description: "shows my murderer secret (front)",
    },
    {
      props: { mine: true, murderer: false, accomplice: true },
      expectedImage: "04-secret_accomplice.png",
      description: "shows my accomplice secret (front)",
    },

    // Secretos de oponentes
    {
      props: { mine: false, revealed: false },
      expectedImage: "05-secret_back.png",
      description: "shows opponent's unrevealed secret (back)",
    },
    {
      props: {
        mine: false,
        revealed: true,
        murderer: false,
        accomplice: false,
      },
      expectedImage: "06-secret_front.png",
      description: "shows opponent's revealed base secret (front)",
    },
    {
      props: { mine: false, revealed: true, murderer: true },
      expectedImage: "03-secret_murderer.png",
      description: "shows opponent's revealed murderer secret (front)",
    },
    {
      props: { mine: false, revealed: true, accomplice: true },
      expectedImage: "04-secret_accomplice.png",
      description: "shows opponent's revealed accomplice secret (front)",
    },
  ])("$description", ({ props, expectedImage }) => {
    render(<Secret {...defaultProps} {...props} />);
    const img = screen.getByRole("img") as HTMLImageElement;
    // Verificamos que el `src` del `img` contenga el nombre de archivo esperado
    expect(img.src).toContain(expectedImage);
  });

  it("calls onClick handler when clicked", async () => {
    const onClickMock = vi.fn();
    render(<Secret {...defaultProps} onClick={onClickMock} />);

    // El componente entero es el div clickeable
    const secretElement = screen.getByRole("img").parentElement;
    await userEvent.click(secretElement!);

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it("applies correct CSS classes based on props", () => {
    const onClickMock = vi.fn();
    render(
      <Secret
        {...defaultProps}
        mine={true}
        revealed={false}
        isSelected={true}
        onClick={onClickMock}
      />
    );

    const secretElement = screen.getByRole("img").parentElement;

    expect(secretElement).toHaveClass("mine");
    expect(secretElement).toHaveClass("unrevealed");
    expect(secretElement).toHaveClass("selected");
    expect(secretElement).toHaveClass("clickable");
  });
});
