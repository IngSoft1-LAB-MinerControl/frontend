/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListGames from "./ListGames";
import destinations from "../../navigation/destinations";

import gameService from "../../services/gameService";
import playerService from "../../services/playerService";

import { useNavigate, useLocation } from "react-router-dom";

// Mock de navigate
const mockedNavigate = vi.fn();

// Mock de react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
    useLocation: vi.fn(() => ({
      state: { playerName: "Alice", playerDate: "2000-01-01" },
    })),
  };
});

describe("ListGames", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza partidas disponibles correctamente", async () => {
    console.log("TEST: renderiza partidas disponibles correctamente");

    const partidasMock = [
      {
        game_id: 1,
        name: "Partida 1",
        min_players: 2,
        max_players: 4,
        players_amount: 2,
        status: "waiting",
      },
      {
        game_id: 2,
        name: "Partida 2",
        min_players: 2,
        max_players: 4,
        players_amount: 4,
        status: "waiting",
      },
      {
        game_id: 3,
        name: "Partida 3",
        min_players: 2,
        max_players: 4,
        players_amount: 1,
        status: "in-progress",
      },
    ];

    vi.spyOn(gameService, "getGames").mockResolvedValue(partidasMock);

    render(<ListGames />);

    expect(await screen.findByText("Partida 1")).toBeInTheDocument();
    expect(screen.getByText("Partida 2")).toBeInTheDocument();
    expect(screen.getByText("Partida 3")).toBeInTheDocument();
  });

  it("navega al lobby al unirse a una partida", async () => {
    console.log("TEST: navega al lobby al unirse a una partida");

    const partidasMock = [
      {
        game_id: 1,
        name: "Partida 1",
        min_players: 2,
        max_players: 4,
        players_amount: 2,
        status: "waiting",
      },
    ];

    vi.spyOn(gameService, "getGames").mockResolvedValue(partidasMock);
    vi.spyOn(playerService, "createPlayer").mockResolvedValue({ id: 1 });

    render(<ListGames />);

    const button = await screen.findByRole("button", { name: /Unirme/i });
    await userEvent.click(button);

    expect(playerService.createPlayer).toHaveBeenCalledWith({
      name: "Alice",
      birth_date: "2000-01-01",
      host: false,
      game_id: 1,
    });

    expect(mockedNavigate).toHaveBeenCalledWith(destinations.lobby, {
      state: {
        game: partidasMock[0],
        playerName: "Alice",
        playerDate: "2000-01-01",
      },
    });
  });

  it("muestra error si no hay info del jugador", async () => {
    console.log("TEST: muestra error si no hay info del jugador");

    // Cambiamos useLocation solo para este test
    (useLocation as any).mockReturnValue({ state: {} });

    const partidasMock = [
      {
        game_id: 1,
        name: "Partida 1",
        min_players: 2,
        max_players: 4,
        players_amount: 2,
        status: "waiting",
      },
    ];

    vi.spyOn(gameService, "getGames").mockResolvedValue(partidasMock);

    render(<ListGames />);
    const button = await screen.findByRole("button", { name: /Unirme/i });
    await userEvent.click(button);

    expect(
      await screen.findByText("No se encontró información del jugador")
    ).toBeInTheDocument();
    expect(mockedNavigate).not.toHaveBeenCalled();
  });
});
