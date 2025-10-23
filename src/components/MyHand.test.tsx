import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import You from "./MyHand"; // 'You' is the name of the default export
import { type PlayerStateResponse } from "../services/playerService";

// mock myhand
vi.mock("./Cards/Detectives", () => ({
  default: ({ name, onCardClick, isSelected }: any) => (
    <button
      data-testid="detective-card"
      onClick={() => onCardClick()}
      data-selected={isSelected}
    >
      {name}
    </button>
  ),
}));
vi.mock("./Cards/Events", () => ({
  default: ({ name, onCardClick, isSelected }: any) => (
    <button
      data-testid="event-card"
      onClick={() => onCardClick()}
      data-selected={isSelected}
    >
      {name}
    </button>
  ),
}));
vi.mock("./Cards/Secret", () => ({
  default: ({ onClick, isSelected }: any) => (
    <button
      data-testid="secret"
      onClick={onClick}
      data-selected={isSelected}
    ></button>
  ),
}));
vi.mock("./Set", () => ({
  default: ({ name }: any) => <div data-testid="set">{name}</div>,
}));

describe("MyHand (You) Component", () => {
  // mock player
  const mockPlayer: PlayerStateResponse = {
    player_id: 1,
    name: "Jugador",
    host: true,
    game_id: 1,
    birth_date: "2000-01-01",
    cards: [
      {
        card_id: 1,
        type: "detective",
        name: "Poirot",
        game_id: 1,
        player_id: 1,
        picked_up: true,
        dropped: false,
      },
      {
        card_id: 2,
        type: "event",
        name: "Ashes",
        game_id: 1,
        player_id: 1,
        picked_up: true,
        dropped: false,
      },
      {
        type: "event",
        name: "Card without ID",
        game_id: 1,
        player_id: 1,
        picked_up: true,
        dropped: false,
      } as any,
    ],
    secrets: [
      {
        secret_id: 10,
        revelated: true,
        murderer: false,
        accomplice: false,
        game_id: 1,
      },
      {
        secret_id: 11,
        revelated: false,
        murderer: false,
        accomplice: false,
        game_id: 1,
      },
    ],
    sets: [
      { set_id: 20, name: "Mi Set", detective: [], game_id: 1, player_id: 1 },
    ],
  };

  it("debería renderizar el nombre, cartas, secretos y sets del jugador", () => {
    render(
      <You
        player={mockPlayer}
        onCardsSelected={() => {}}
        selectedCardIds={[]}
        isMyTurn={true}
        selectedCard={null}
        onSecretClick={() => {}}
        selectedSecret={null}
        isSecretSelectionStep={false}
      />
    );

    expect(screen.getByText("Jugador")).toBeInTheDocument();
    expect(screen.getByText("Poirot")).toBeInTheDocument();
    expect(screen.getByText("Ashes")).toBeInTheDocument();
    expect(screen.getAllByTestId("secret")).toHaveLength(2);
    expect(screen.getByTestId("set")).toBeInTheDocument();
  });

  it("debería aplicar la clase 'myturn' cuando isMyTurn es true", () => {
    render(
      <You
        player={mockPlayer}
        onCardsSelected={() => {}}
        selectedCardIds={[]}
        isMyTurn={true}
        selectedCard={null}
        onSecretClick={() => {}}
        selectedSecret={null}
        isSecretSelectionStep={false}
      />
    );
    expect(screen.getByText("Jugador")).toHaveClass("myturn");
  });

  it("debería llamar a onCardsSelected con la carta correcta al hacer clic", async () => {
    const handleCardClick = vi.fn();
    render(
      <You
        player={mockPlayer}
        onCardsSelected={handleCardClick}
        selectedCardIds={[]}
        isMyTurn={true}
        selectedCard={null}
        onSecretClick={() => {}}
        selectedSecret={null}
        isSecretSelectionStep={false}
      />
    );

    const poirotCard = screen.getByText("Poirot");
    await userEvent.click(poirotCard);

    expect(handleCardClick).toHaveBeenCalledTimes(1);
    expect(handleCardClick).toHaveBeenCalledWith(mockPlayer.cards[0]); // Asserts it's called with the full card object
  });

  it("no debería renderizar una carta si su card_id es undefined", () => {
    render(
      <You
        player={mockPlayer}
        onCardsSelected={() => {}}
        selectedCardIds={[]}
        isMyTurn={true}
        selectedCard={null}
        onSecretClick={() => {}}
        selectedSecret={null}
        isSecretSelectionStep={false}
      />
    );
    expect(screen.queryByText("Card without ID")).not.toBeInTheDocument();
  });

  describe("Lógica de Selección de Secretos", () => {
    it("debería ser clickeable un secreto revelado si es el turno y el paso de selección", async () => {
      const handleSecretClick = vi.fn();
      render(
        <You
          player={mockPlayer}
          onCardsSelected={() => {}}
          selectedCardIds={[]}
          isMyTurn={true}
          selectedCard={null}
          onSecretClick={handleSecretClick}
          selectedSecret={null}
          isSecretSelectionStep={true}
        />
      );

      const revealedSecret = screen.getAllByTestId("secret")[0]; // El primer secreto está revelado
      await userEvent.click(revealedSecret);
      expect(handleSecretClick).toHaveBeenCalledTimes(1);
    });

    it("NO debería ser clickeable si no es el turno del jugador", async () => {
      const handleSecretClick = vi.fn();
      render(
        <You
          player={mockPlayer}
          onCardsSelected={() => {}}
          selectedCardIds={[]}
          isMyTurn={false}
          selectedCard={null}
          onSecretClick={handleSecretClick}
          selectedSecret={null}
          isSecretSelectionStep={true}
        />
      );

      const secret = screen.getAllByTestId("secret")[0];
      await userEvent.click(secret);
      expect(handleSecretClick).not.toHaveBeenCalled();
    });

    it("NO debería ser clickeable si no es el paso de selección de secretos", async () => {
      const handleSecretClick = vi.fn();
      render(
        <You
          player={mockPlayer}
          onCardsSelected={() => {}}
          selectedCardIds={[]}
          isMyTurn={true}
          selectedCard={null}
          onSecretClick={handleSecretClick}
          selectedSecret={null}
          isSecretSelectionStep={false}
        />
      );

      const secret = screen.getAllByTestId("secret")[0];
      await userEvent.click(secret);
      expect(handleSecretClick).not.toHaveBeenCalled();
    });

    it("NO debería ser clickeable un secreto que no está revelado", async () => {
      const handleSecretClick = vi.fn();
      render(
        <You
          player={mockPlayer}
          onCardsSelected={() => {}}
          selectedCardIds={[]}
          isMyTurn={true}
          selectedCard={null}
          onSecretClick={handleSecretClick}
          selectedSecret={null}
          isSecretSelectionStep={true}
        />
      );

      const unrevealedSecret = screen.getAllByTestId("secret")[1]; // El segundo secreto no está revelado
      await userEvent.click(unrevealedSecret);
      expect(handleSecretClick).not.toHaveBeenCalled();
    });
  });
});
