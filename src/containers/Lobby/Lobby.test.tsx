/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import Lobby from "./Lobby";
import playerService from "../../services/playerService";

const spyGetPlayers = () => vi.spyOn(playerService, "getPlayersByGame");

const game = {
  game_id: 7,
  name: "Partida Demo",
  min_players: 3,
  max_players: 6,
  players_amount: 0,
  status: "waiting",
};

const mkPlayer = (over: Partial<any> = {}) => ({
  player_id: over.player_id ?? Math.floor(Math.random() * 1000),
  id: over.id ?? over.player_id ?? Math.floor(Math.random() * 1000),
  name: over.name ?? "Jugador",
  birth_date: over.birth_date ?? "2000-01-01",
  host: over.host ?? false,
  game_id: game.game_id,
});

function renderWithState(state: any) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: "/lobby", state } as any]}
      initialIndex={0}
    >
      <Routes>
        <Route path="/lobby" element={<Lobby />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Lobby", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra jugadores devueltos por el servicio", async () => {
    const players = [
      mkPlayer({ name: "Ulises" }),
      mkPlayer({ name: "Marple" }),
    ];
    spyGetPlayers().mockResolvedValue(players);

    const me = players[0];

    renderWithState({ game, player: me });

    expect(await screen.findByText("Ulises")).toBeInTheDocument();
    expect(screen.getByText("Marple")).toBeInTheDocument();
  });

  it("si el jugador actual es host, ve el botón Iniciar", async () => {
    const players = [
      mkPlayer({ name: "Host", host: true }),
      mkPlayer({ name: "Invitado" }),
    ];
    spyGetPlayers().mockResolvedValue(players);

    const me = players[0]; // host
    renderWithState({ game, player: me });

    await screen.findByText("Host");
    expect(screen.getByRole("button", { name: "Iniciar" })).toBeInTheDocument();
  });

  it("si NO es host, ve el mensaje de espera", async () => {
    const players = [
      mkPlayer({ name: "Host", host: true }),
      mkPlayer({ name: "NoHost" }),
    ];
    spyGetPlayers().mockResolvedValue(players);

    const me = players[1]; // no host
    renderWithState({ game, player: me });

    await screen.findByText("NoHost");
    expect(
      screen.getByText(/Esperando a que el anfitrión inicie la partida/i)
    ).toBeInTheDocument();
  });

  it("muestra error si intenta iniciar y no llega al mínimo de jugadores", async () => {
    const players = [mkPlayer({ name: "Host", host: true })]; // solo 1
    spyGetPlayers().mockResolvedValue(players);

    const me = players[0];
    renderWithState({ game: { ...game, min_players: 3 }, player: me });

    await screen.findByText("Host");
    screen.getByRole("button", { name: "Iniciar" }).click();

    expect(
      await screen.findByText(/La partida necesita al menos 3 jugadores/i)
    ).toBeInTheDocument();
  });
});
