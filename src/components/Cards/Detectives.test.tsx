// src/components/Cards/Detectives.test.tsx

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Detective from "./Detectives";

vi.mock("/src/assets/01-card_back.png", () => ({
  default: "card_back.png", // Devuelve un string simple
}));
vi.mock("/src/assets/07-detective_poirot.png", () => ({
  default: "poirot.png", // Devuelve un string simple
}));

describe("Detective Component", () => {
  // Renderizado carta boca arriba
  it("debería renderizar la imagen correcta del detective cuando se muestra", () => {
    render(<Detective name="Hercule Poirot" card_id={101} shown={true} />);

    const img = screen.getByRole("img");
    // alt text correcto
    expect(img).toHaveAttribute("alt", "card-101");
    // imagen
    expect(img).toHaveAttribute("src", "poirot.png");
  });

  // Renderizado carta boca abajo
  it("debería renderizar el reverso de la carta cuando está oculta", () => {
    render(<Detective name="Hercule Poirot" card_id={101} shown={false} />);

    const img = screen.getByRole("img");
    // imagen
    expect(img).toHaveAttribute("src", "card_back.png");
  });

  // Estado visual 'seleccionado'
  it("debería aplicar la clase 'selected' cuando la prop isSelected es true", () => {
    render(
      <Detective
        name="Hercule Poirot"
        card_id={101}
        shown={true}
        isSelected={true}
      />
    );

    // El elemento clickeable es el div que contiene la imagen
    const cardContainer = screen.getByRole("img").parentElement;
    expect(cardContainer).toHaveClass("selected");
  });

  // Interacción del usuario
  it("debería llamar a la función onCardClick con el ID correcto al hacer clic", async () => {
    const handleClick = vi.fn();
    const cardId = 101;

    render(
      <Detective
        name="Hercule Poirot"
        card_id={cardId}
        shown={true}
        onCardClick={handleClick}
      />
    );

    const cardContainer = screen.getByRole("img").parentElement;
    await userEvent.click(cardContainer!); // click div

    // La función fue llamada una vez
    expect(handleClick).toHaveBeenCalledTimes(1);
    // argumento correcto (card_id)
    expect(handleClick).toHaveBeenCalledWith(cardId);
  });

  // Caso borde: no hay funcion de click
  it("no debería fallar si se hace clic pero no se proporciona onCardClick", async () => {
    render(<Detective name="Hercule Poirot" card_id={101} shown={true} />);

    const cardContainer = screen.getByRole("img").parentElement;

    // clicK no lanza error
    const clickAction = async () => await userEvent.click(cardContainer!);

    await expect(clickAction()).resolves.not.toThrow();
  });
});
