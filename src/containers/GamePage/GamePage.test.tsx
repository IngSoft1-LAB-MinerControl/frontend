/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import GamePage from "./GamePage";
import playerService from "../../services/playerService";

const spyGetPlayers = () => vi.spyOn(playerService, "getPlayersByGame");

const game = { game_id: 10, name: "Mesa", min_players: 2, max_players: 6 };

const me = {
  player_id: 1,
  id: 1,
  name: "Ulises",
  birth_date: "2001-01-01",
  host: true,
  game_id: game.game_id,
};

const mkOpponent = (i: number) => ({
  player_id: i + 2,
  id: i + 2,
  name: `P${i + 1}`,
  birth_date: `199${i}-01-01`,
  host: false,
  game_id: game.game_id,
});

function renderWithState(state: any) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: "/game", state } as any]}
      initialIndex={0}
    >
      <Routes>
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("GamePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("si no viene state, muestra el mensaje de contexto faltante", async () => {
    spyGetPlayers().mockResolvedValue([]);
    // No pasamos state
    render(
      <MemoryRouter initialEntries={[{ pathname: "/game" } as any]}>
        <Routes>
          <Route path="/game" element={<GamePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/Falta el contexto de la partida/i)
    ).toBeInTheDocument();
  });

  it("llama al servicio con el game_id correcto y muestra jugadores", async () => {
    const players = [me, mkOpponent(0)];
    const spy = spyGetPlayers().mockResolvedValue(players);

    renderWithState({ game, player: me });

    expect(spy).toHaveBeenCalledWith(game.game_id);
    expect(await screen.findByText(me.name)).toBeInTheDocument();
    expect(screen.getByText("P1")).toBeInTheDocument();
  });

  it("hace polling cada 3s", async () => {
    vi.useFakeTimers();
    const players = [me, mkOpponent(0)];
    const spy = spyGetPlayers().mockResolvedValue(players);

    renderWithState({ game, player: me });

    expect(spy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(3000);
    expect(spy).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(3000);
    expect(spy).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  it("cuando solo juego yo: 6 cartas visibles en mi mano y 3 secretos", async () => {
    const players = [me];
    spyGetPlayers().mockResolvedValue(players);

    const { container } = renderWithState({ game, player: me });

    await screen.findByText(me.name);

    const myHand = container.querySelector(".you-hand");
    const mySecrets = container.querySelector(".you-secrets");

    const handCards = myHand?.querySelectorAll(".card") ?? [];
    const secrets = mySecrets?.children ?? [];

    expect(handCards.length).toBe(6);
    expect(secrets.length).toBe(3);
  });

  it("con 6 jugadores: se renderizan 5 oponentes (yo abajo + 5 restantes)", async () => {
    const players = [
      me,
      mkOpponent(0),
      mkOpponent(1),
      mkOpponent(2),
      mkOpponent(3),
      mkOpponent(4),
    ];
    spyGetPlayers().mockResolvedValue(players);

    const { container } = renderWithState({ game, player: me });

    await screen.findByText(me.name);

    const opponents = container.querySelectorAll(".opponent");
    expect(opponents.length).toBe(5);
  });
});
