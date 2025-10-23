import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Detective from "./Detectives";

// mock imagenes
vi.mock("/src/assets/01-card_back.png", () => ({ default: "card_back.png" }));
vi.mock("/src/assets/07-detective_poirot.png", () => ({
  default: "poirot.png",
}));
vi.mock("/src/assets/08-detective_marple.png", () => ({
  default: "marple.png",
}));
vi.mock("/src/assets/09-detective_satterthwaite.png", () => ({
  default: "satterthwaite.png",
}));
vi.mock("/src/assets/10-detective_pyne.png", () => ({ default: "pyne.png" }));
vi.mock("/src/assets/11-detective_brent.png", () => ({ default: "brent.png" }));
vi.mock("/src/assets/12-detective_tommyberesford.png", () => ({
  default: "tommy.png",
}));
vi.mock("/src/assets/13-detective_tuppenceberesford.png", () => ({
  default: "tuppence.png",
}));
vi.mock("/src/assets/14-detective_quin.png", () => ({ default: "quin.png" }));
vi.mock("/src/assets/15-detective_oliver.png", () => ({
  default: "oliver.png",
}));

describe("Detective Component", () => {
  const detectives = [
    { name: "Hercule Poirot", imgSrc: "poirot.png" },
    { name: "Miss Marple", imgSrc: "marple.png" },
    { name: "Mr Satterthwaite", imgSrc: "satterthwaite.png" },
    { name: "Parker Pyne", imgSrc: "pyne.png" },
    { name: "Lady Eileen 'Bundle' Brent", imgSrc: "brent.png" },
    { name: "Tommy Beresford", imgSrc: "tommy.png" },
    { name: "Tuppence Beresford", imgSrc: "tuppence.png" },
    { name: "Harley Quin Wildcard", imgSrc: "quin.png" },
    { name: "Adriane Oliver", imgSrc: "oliver.png" },
  ];

  // case: detectives
  detectives.forEach((detective) => {
    it(`debería renderizar la imagen correcta para ${detective.name}`, () => {
      render(<Detective name={detective.name} card_id={1} shown={true} />);
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", detective.imgSrc);
    });
  });

  // case: default
  it("debería renderizar el reverso si el nombre no coincide (default case)", () => {
    render(<Detective name="Nombre Desconocido" card_id={1} shown={true} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "card_back.png");
  });

  // funcionalidad
  it("debería renderizar el reverso de la carta cuando está oculta", () => {
    render(<Detective name="Hercule Poirot" card_id={101} shown={false} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "card_back.png");
  });

  it("debería aplicar la clase 'selected' cuando la prop isSelected es true", () => {
    render(
      <Detective
        name="Hercule Poirot"
        card_id={101}
        shown={true}
        isSelected={true}
      />
    );
    const cardContainer = screen.getByRole("img").parentElement;
    expect(cardContainer).toHaveClass("selected");
  });

  it("debería llamar a la función onCardClick con el ID correcto al hacer clic", async () => {
    const handleClick = vi.fn();
    render(
      <Detective
        name="Hercule Poirot"
        card_id={101}
        shown={true}
        onCardClick={handleClick}
      />
    );
    const cardContainer = screen.getByRole("img").parentElement;
    await userEvent.click(cardContainer!);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(101);
  });

  it("no debería fallar si se hace clic pero no se proporciona onCardClick", async () => {
    render(<Detective name="Hercule Poirot" card_id={101} shown={true} />);
    const cardContainer = screen.getByRole("img").parentElement;
    await expect(userEvent.click(cardContainer!)).resolves.not.toThrow();
  });
});
