import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Event from "./Events";

// mock imagenes
vi.mock("/src/assets/01-card_back.png", () => ({ default: "card_back.png" }));
vi.mock("/src/assets/17-event_cardsonthetable.png", () => ({
  default: "cardsoff.png",
}));
vi.mock("/src/assets/18-event_anothervictim.png", () => ({
  default: "anothervictim.png",
}));
vi.mock("/src/assets/19-event_deadcardfolly.png", () => ({
  default: "deadcardfolly.png",
}));
vi.mock("/src/assets/20-event_lookashes.png", () => ({
  default: "lookashes.png",
}));
vi.mock("/src/assets/21-event_cardtrade.png", () => ({
  default: "cardtrade.png",
}));
vi.mock("/src/assets/22-event_onemore.png", () => ({ default: "onemore.png" }));
vi.mock("/src/assets/23-event_delayescape.png", () => ({
  default: "delayescape.png",
}));
vi.mock("/src/assets/24-event_earlytrain.png", () => ({
  default: "earlytrain.png",
}));
vi.mock("/src/assets/25-event_pointsuspicions.png", () => ({
  default: "pointsuspicions.png",
}));
vi.mock("/src/assets/16-Instant_notsofast.png", () => ({
  default: "notsofast.png",
}));
vi.mock("/src/assets/27-devious_fauxpas.png", () => ({
  default: "fauxpas.png",
}));
vi.mock("/src/assets/26-devious_blackmailed.png", () => ({
  default: "blackmailed.png",
}));

describe("Event Component", () => {
  const events = [
    { name: "Cards off the table", imgSrc: "cardsoff.png" },
    { name: "Another Victim", imgSrc: "anothervictim.png" },
    { name: "Dead card folly", imgSrc: "deadcardfolly.png" },
    { name: "Look into the ashes", imgSrc: "lookashes.png" },
    { name: "Card trade", imgSrc: "cardtrade.png" },
    { name: "And then there was one more...", imgSrc: "onemore.png" },
    { name: "Delay the murderer's escape!", imgSrc: "delayescape.png" },
    { name: "Early train to paddington", imgSrc: "earlytrain.png" },
    { name: "Point your suspicions", imgSrc: "pointsuspicions.png" },
    { name: "Not so fast", imgSrc: "notsofast.png" },
    { name: "Social Faux Pas", imgSrc: "fauxpas.png" },
    { name: "Blackmailed", imgSrc: "blackmailed.png" },
  ];

  // case: events
  events.forEach((event) => {
    it(`debería renderizar la imagen correcta para ${event.name}`, () => {
      render(<Event name={event.name} card_id={1} shown={true} />);
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", event.imgSrc);
    });
  });

  // case: default
  it("debería renderizar el reverso si el nombre no coincide (default case)", () => {
    render(<Event name="Nombre Desconocido" card_id={1} shown={true} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "card_back.png");
  });

  // funcionalidad
  it("debería renderizar el reverso de la carta cuando está oculta", () => {
    render(<Event name="Look into the ashes" card_id={201} shown={false} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "card_back.png");
  });

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

  it("debería llamar a la función onCardClick con el ID correcto al hacer clic", async () => {
    const handleClick = vi.fn();
    render(
      <Event
        name="Look into the ashes"
        card_id={201}
        shown={true}
        onCardClick={handleClick}
      />
    );
    const cardContainer = screen.getByRole("img").parentElement;
    await userEvent.click(cardContainer!);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(201);
  });

  it("no debería fallar si se hace clic pero no se proporciona onCardClick", async () => {
    render(<Event name="Look into the ashes" card_id={201} shown={true} />);
    const cardContainer = screen.getByRole("img").parentElement;
    await expect(userEvent.click(cardContainer!)).resolves.not.toThrow();
  });
});
