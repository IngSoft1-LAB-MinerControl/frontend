import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Set from "./Set";
import { type SetResponse } from "../services/setService";

// Mockeamos el componente <Detective> para aislar nuestro test.
// Solo nos importa que <Set> lo renderice, no cómo se ve <Detective>.
vi.mock("./Cards/Detectives", () => ({
  default: ({ name }: { name: string }) => (
    <div data-testid="detective-card">{name}</div>
  ),
}));

describe("Set Component", () => {
  // Datos de prueba completos y reutilizables
  const mockSet: SetResponse = {
    game_id: 1,
    player_id: 1,
    set_id: 101,
    name: "Set de Prueba",
    detective: [
      {
        card_id: 1,
        name: "Poirot",
        type: "detective",
        game_id: 1,
        player_id: 1,
        picked_up: true,
        dropped: false,
      },
      {
        card_id: 2,
        name: "Marple",
        type: "detective",
        game_id: 1,
        player_id: 1,
        picked_up: true,
        dropped: false,
      },
    ],
  };

  it("debería renderizar todas las cartas que recibe por props", () => {
    render(<Set {...mockSet} cards={mockSet.detective} isSelected={false} />);

    // Verificamos que se renderizó la cantidad correcta de cartas
    const renderedCards = screen.getAllByTestId("detective-card");
    expect(renderedCards).toHaveLength(2);

    // Verificamos que el contenido de las cartas es el correcto
    expect(screen.getByText("Poirot")).toBeInTheDocument();
    expect(screen.getByText("Marple")).toBeInTheDocument();
  });

  it("debería aplicar la clase 'selected' cuando isSelected es true", () => {
    render(<Set {...mockSet} cards={mockSet.detective} isSelected={true} />);

    // Buscamos el componente por su rol y nombre accesible
    const setElement = screen.getByRole("button", {
      name: `Set ${mockSet.name}`,
    });
    expect(setElement).toHaveClass("selected");
    expect(setElement).not.toHaveClass("table");
  });

  it("debería aplicar la clase 'table' cuando isSelected es false", () => {
    render(<Set {...mockSet} cards={mockSet.detective} isSelected={false} />);

    const setElement = screen.getByRole("button", {
      name: `Set ${mockSet.name}`,
    });
    expect(setElement).toHaveClass("table");
    expect(setElement).not.toHaveClass("selected");
  });

  it("debería llamar a onSetClick con los datos correctos al hacer clic", async () => {
    const handleClick = vi.fn();
    render(
      <Set
        {...mockSet}
        cards={mockSet.detective}
        isSelected={false}
        onSetClick={handleClick}
      />
    );

    const setElement = screen.getByRole("button", {
      name: `Set ${mockSet.name}`,
    });
    await userEvent.click(setElement);

    // Verificamos que la función fue llamada una vez
    expect(handleClick).toHaveBeenCalledTimes(1);
    // Verificamos que fue llamada con el objeto SetResponse completo
    expect(handleClick).toHaveBeenCalledWith(mockSet);
  });

  it("no debería fallar si se hace clic pero no se proporciona onSetClick", async () => {
    render(
      <Set
        {...mockSet}
        cards={mockSet.detective}
        isSelected={false}
        // No pasamos la prop onSetClick a propósito
      />
    );

    const setElement = screen.getByRole("button", {
      name: `Set ${mockSet.name}`,
    });
    // La prueba pasa si esta acción no genera un error
    await expect(userEvent.click(setElement)).resolves.not.toThrow();
  });
});
