/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GamePage from "./GamePage";

// Mock del servicio real de players
vi.mock("../../services/playerService", () => {
  return {
    __esModule: true,
    default: {
      getPlayersByGame: vi.fn(),
    },
  };
});
import playerService from "../../services/playerService";

// helper para renderizar con state (lo que normalmente te pasa el Lobby)
const baseState = {
  game: { game_id: "42", min_players: 2, name: "Mesa" },
  playerName: "Ulises",
  playerDate: "2000-01-01",
};
const renderWithState = (state?: any) =>
  render(
    <MemoryRouter
      initialEntries={[{ pathname: "/game", state: state ?? baseState }]}
    >
      <GamePage />
    </MemoryRouter>
  );

describe("GamePage (sin modificar TSX)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra error si falta location.state", () => {
    renderWithState(undefined);
    expect(
      screen.getByText(/Falta el contexto de la partida/i)
    ).toBeInTheDocument();
  });

  it("llama al servicio con el game_id correcto y muestra jugadores", async () => {
    const mockPlayers = [
      { id: "1", name: "Ulises", birth_date: "2000-01-01", host: true },
      { id: "2", name: "Marple", birth_date: "1970-11-11" },
    ];
    (playerService.getPlayersByGame as any).mockResolvedValueOnce(mockPlayers);

    renderWithState();

    await waitFor(() =>
      expect(playerService.getPlayersByGame).toHaveBeenCalledWith("42")
    );

    // nombres visibles (get/findByText)
    expect(await screen.findByText("Ulises")).toBeInTheDocument();
    expect(screen.getByText("Marple")).toBeInTheDocument();
  });

  it("hace polling cada 3s (setInterval)", async () => {
    vi.useFakeTimers();
    (playerService.getPlayersByGame as any).mockResolvedValue([]);

    renderWithState();

    await waitFor(() =>
      expect(playerService.getPlayersByGame).toHaveBeenCalledTimes(1)
    );

    vi.advanceTimersByTime(3000);
    await waitFor(() =>
      expect(playerService.getPlayersByGame).toHaveBeenCalledTimes(2)
    );
  });

  it("cuando solo juego yo: mano con 6 cartas, 3 secretos y 2 mazos", async () => {
    // Devolvemos UN solo jugador (yo). Así el conteo no se contamina con cartas de oponentes.
    (playerService.getPlayersByGame as any).mockResolvedValueOnce([
      { id: "me", name: "Ulises", birth_date: "2000-01-01", host: true },
    ]);

    const { container } = renderWithState();

    // espero a que renderice mi nombre
    await screen.findByText("Ulises");

    // sin testid: consultamos por clases existentes en tu TSX/CSS
    const youHand = container.querySelector(".you-hand");
    const youSecrets = container.querySelector(".you-secrets");
    const decks = container.querySelector(".decks");

    expect(youHand).toBeTruthy();
    expect(youSecrets).toBeTruthy();
    expect(decks).toBeTruthy();

    // contamos <img> dentro de cada bloque
    expect(youHand!.querySelectorAll("img").length).toBe(6);
    expect(youSecrets!.querySelectorAll("img").length).toBe(3);
    expect(decks!.querySelectorAll("img").length).toBe(2);

    // alternativa general (todas las cartas visibles en la página)
    const allCards = screen.getAllByAltText("card");
    // 6 (mano) + 3 (secretos) + 2 (mazos) = 11
    expect(allCards.length).toBe(11);
  });

  it("con 6 jugadores: se renderizan 5 oponentes (yo abajo + 5 restantes)", async () => {
    const mockPlayers = [
      { id: "me", name: "Ulises", birth_date: "2000-01-01", host: true },
      { id: "2", name: "A", birth_date: "x" },
      { id: "3", name: "B", birth_date: "x" },
      { id: "4", name: "C", birth_date: "x" },
      { id: "5", name: "D", birth_date: "x" },
      { id: "6", name: "E", birth_date: "x" },
    ];
    (playerService.getPlayersByGame as any).mockResolvedValueOnce(mockPlayers);

    const { container } = renderWithState();

    await screen.findByText("Ulises");

    // sin testid: contamos contenedores de oponentes por clase
    const opponents = container.querySelectorAll(".opponent");
    expect(opponents.length).toBe(5);

    // y además los nombres están visibles
    ["A", "B", "C", "D", "E"].forEach((n) =>
      expect(screen.getByText(n)).toBeInTheDocument()
    );
  });
});
