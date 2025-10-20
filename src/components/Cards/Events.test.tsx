// src/components/Cards/Event.test.tsx

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Event from "./Events";

// 💡 Mock para manejar las importaciones de imágenes en los tests
vi.mock("/src/assets/01-card_back.png", () => ({
  default: "card_back.png",
}));
vi.mock("/src/assets/20-event_lookashes.png", () => ({
  default: "lookashes.png",
}));

describe("Event Component", () => {
  // Carta boca arriba
  it("debería renderizar la imagen correcta del evento cuando se muestra", () => {
    render(<Event name="Look into the ashes" card_id={201} shown={true} />);

    const img = screen.getByRole("img");
    // alt text
    expect(img).toHaveAttribute("alt", "card-201");
    // imagen
    expect(img).toHaveAttribute("src", "lookashes.png");
  });

  // Carta boca abajo
  it("debería renderizar el reverso de la carta cuando está oculta", () => {
    render(<Event name="Look into the ashes" card_id={201} shown={false} />);

    const img = screen.getByRole("img");
    // imagen
    expect(img).toHaveAttribute("src", "card_back.png");
  });

  // Estado visual 'seleccionado'
  it("debería aplicar la clase 'selected' cuando la prop isSelected es true", () => {
    render(
      <Event
        name="Look into the ashes"
        card_id={201}
        shown={true}
        isSelected={true}
      />
    );

    const cardContainer = screen.getByRole("img").parentElement;
    expect(cardContainer).toHaveClass("selected");
  });

  // Interacción del usuario
  it("debería llamar a la función onCardClick con el ID correcto al hacer clic", async () => {
    const handleClick = vi.fn();
    const cardId = 201;

    render(
      <Event
        name="Look into the ashes"
        card_id={cardId}
        shown={true}
        onCardClick={handleClick}
      />
    );

    const cardContainer = screen.getByRole("img").parentElement;
    await userEvent.click(cardContainer!);

    // Verificamos que la función fue llamada una vez con el ID correcto
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(cardId);
  });

  // Caso borde -no hay funcion de click
  it("no debería fallar si se hace clic pero no se proporciona onCardClick", async () => {
    render(<Event name="Look into the ashes" card_id={201} shown={true} />);

    const cardContainer = screen.getByRole("img").parentElement;

    // click no lanza error
    await expect(userEvent.click(cardContainer!)).resolves.not.toThrow();
  });
});
