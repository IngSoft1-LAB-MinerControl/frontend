// src/components/Opponent.test.tsx (Archivo completo y corregido)

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Opponent from "./Opponent";
import { type PlayerStateResponse } from "../services/playerService";

// --- Mocks de los componentes hijos ---
vi.mock("./Cards/Detectives", () => ({
  default: ({ name }: any) => <div data-testid="detective-card">{name}</div>,
}));
vi.mock("./Cards/Events", () => ({
  default: ({ name }: any) => <div data-testid="event-card">{name}</div>,
}));
vi.mock("./Cards/Secret", () => ({
  default: ({ onClick }: any) => (
    <button data-testid="secret" onClick={onClick}></button>
  ),
}));
vi.mock("./Set", () => ({
  default: ({ onSetClick }: any) => (
    <button data-testid="set" onClick={onSetClick}></button>
  ),
}));

describe("Opponent Component", () => {
  const mockPlayer: PlayerStateResponse = {
    player_id: 2,
    name: "Oponente",
    host: false,
    game_id: 1,
    birth_date: "2000-01-01",
    cards: [
      {
        card_id: 10,
        type: "detective",
        name: "Poirot",
        game_id: 1,
        player_id: 2,
        picked_up: false,
        dropped: false,
      },
      {
        card_id: 11,
        type: "event",
        name: "Ashes",
        game_id: 1,
        player_id: 2,
        picked_up: false,
        dropped: false,
      },
    ],
    secrets: [
      {
        secret_id: 20,
        revelated: false,
        murderer: false,
        accomplice: false,
        game_id: 1,
      },
      {
        secret_id: 21,
        revelated: true,
        murderer: false,
        accomplice: false,
        game_id: 1,
      },
    ],
    sets: [
      {
        set_id: 30,
        name: "Opponent's Set",
        detective: [],
        game_id: 1,
        player_id: 2,
      },
    ],
  };

  it("debería renderizar el nombre, cartas, secretos y sets del oponente", () => {
    render(
      <Opponent
        player={mockPlayer}
        isMyTurn={false}
        onSetClick={() => {}}
        selectedSet={null}
        isSetSelectionStep={false}
        onSecretClick={() => {}}
        selectedSecret={null}
        isSecretSelectionStep={false}
      />
    );

    expect(screen.getByText("Oponente")).toBeInTheDocument();

    // renderiza 1 detective y 1 evento
    expect(screen.getByTestId("detective-card")).toBeInTheDocument();
    expect(screen.getByTestId("event-card")).toBeInTheDocument();

    expect(screen.getAllByTestId("secret")).toHaveLength(2);
    expect(screen.getByTestId("set")).toBeInTheDocument();
  });

  it("debería aplicar la clase 'myturn' cuando sea su turno", () => {
    render(
      <Opponent
        player={mockPlayer}
        isMyTurn={true}
        onSetClick={() => {}}
        selectedSet={null}
        isSetSelectionStep={false}
        onSecretClick={() => {}}
        selectedSecret={null}
        isSecretSelectionStep={false}
      />
    );
    expect(screen.getByText("Oponente")).toHaveClass("myturn");
  });

  it("debería renderizar sin errores si el oponente no tiene cartas, secretos o sets", () => {
    const emptyPlayer = { ...mockPlayer, cards: [], secrets: [], sets: [] };
    render(
      <Opponent
        player={emptyPlayer}
        isMyTurn={false}
        onSetClick={() => {}}
        selectedSet={null}
        isSetSelectionStep={false}
        onSecretClick={() => {}}
        selectedSecret={null}
        isSecretSelectionStep={false}
      />
    );
    expect(screen.queryByTestId("detective-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("event-card")).not.toBeInTheDocument();
  });

  describe("Interacción con Sets", () => {
    it("debería ser clickeable un set si isSetSelectionStep es true", async () => {
      const handleSetClick = vi.fn();
      render(
        <Opponent
          player={mockPlayer}
          isMyTurn={true}
          onSetClick={handleSetClick}
          selectedSet={null}
          isSetSelectionStep={true}
          onSecretClick={() => {}}
          selectedSecret={null}
          isSecretSelectionStep={false}
        />
      );
      await userEvent.click(screen.getByTestId("set"));
      expect(handleSetClick).toHaveBeenCalledTimes(1);
    });

    it("NO debería ser clickeable un set si isSetSelectionStep es false", async () => {
      const handleSetClick = vi.fn();
      render(
        <Opponent
          player={mockPlayer}
          isMyTurn={true}
          onSetClick={handleSetClick}
          selectedSet={null}
          isSetSelectionStep={false}
          onSecretClick={() => {}}
          selectedSecret={null}
          isSecretSelectionStep={false}
        />
      );
      await userEvent.click(screen.getByTestId("set"));
      expect(handleSetClick).not.toHaveBeenCalled();
    });
  });

  describe("Interacción con Secretos (isSecretClickable)", () => {
    it("debería ser clickeable un secreto (revelado o no) si isSecretSelectionStep es true", async () => {
      const handleSecretClick = vi.fn();
      render(
        <Opponent
          player={mockPlayer}
          isMyTurn={true}
          onSetClick={() => {}}
          selectedSet={null}
          isSetSelectionStep={false}
          onSecretClick={handleSecretClick}
          selectedSecret={null}
          isSecretSelectionStep={true}
        />
      );
      const unrevealedSecret = screen.getAllByTestId("secret")[0];
      const revealedSecret = screen.getAllByTestId("secret")[1];
      await userEvent.click(unrevealedSecret);
      expect(handleSecretClick).toHaveBeenCalledTimes(1);
      await userEvent.click(revealedSecret);
      expect(handleSecretClick).toHaveBeenCalledTimes(2);
    });

    it("NO debería ser clickeable ningún secreto si isSecretSelectionStep es false", async () => {
      const handleSecretClick = vi.fn();
      render(
        <Opponent
          player={mockPlayer}
          isMyTurn={true}
          onSetClick={() => {}}
          selectedSet={null}
          isSetSelectionStep={false}
          onSecretClick={handleSecretClick}
          selectedSecret={null}
          isSecretSelectionStep={false}
        />
      );
      const unrevealedSecret = screen.getAllByTestId("secret")[0];
      const revealedSecret = screen.getAllByTestId("secret")[1];
      await userEvent.click(unrevealedSecret);
      await userEvent.click(revealedSecret);
      expect(handleSecretClick).not.toHaveBeenCalled();
    });
  });
});
