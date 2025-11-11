/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Lobby from "./Lobby";
import { useLocation, useNavigate } from "react-router-dom";
import gameService from "../../services/gameService";
import type { PlayerResponse } from "../../services/playerService";

// Mock del WebSocket Global
let mockWebSocketInstance: {
  onopen: () => void;
  onmessage: (event: { data: string }) => void;
  onerror: (event: any) => void;
  onclose: () => void;
  close: Mock; // CORRECCIÓN: 'Mock' es el tipo correcto de vitest
};

class MockWebSocket {
  close = vi.fn();
  // CORRECCIÓN: 'url' se marca como '_url' para evitar el warning
  constructor(_url: string) {
    mockWebSocketInstance = this as any;
  }
}
vi.stubGlobal("WebSocket", MockWebSocket);

// Mock de React Router
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

// Mock de Servicios y Config
vi.mock("../../services/gameService");
vi.mock("../../services/config", () => ({
  httpServerUrl: "http://localhost:8000",
}));

const mockNavigate = vi.fn();
// CORRECCIÓN: Eliminada la variable 'mockStartGame' no leída

// --- Datos base para useLocation ---
const mockGame = {
  game_id: 123,
  name: "Lobby Test",
  min_players: 2,
};
const mockPlayer: PlayerResponse = {
  player_id: 1,
  name: "Host Player",
  host: true,
  birth_date: "2000-01-01",
  avatar: "avatar.png",
  game_id: 123, // CORRECCIÓN: 'game_id' faltante
};
const mockGuestPlayer: PlayerResponse = {
  player_id: 2,
  name: "Guest Player",
  host: false,
  birth_date: "2000-02-02",
  avatar: "avatar2.png",
  game_id: 123, // CORRECCIÓN: 'game_id' faltante
};

describe("Lobby Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);
    vi.mocked(gameService.startGame).mockResolvedValue({} as any);

    // Por defecto, simulamos ser el HOST
    (useLocation as ReturnType<typeof vi.fn>).mockReturnValue({
      state: {
        game: mockGame,
        player: mockPlayer,
      },
    });
  });

  it("should connect to WebSocket and show loading", () => {
    render(<Lobby />);
    // Verifica que se conectó al WS correcto
    expect(global.WebSocket).toHaveBeenCalledWith(
      "ws://localhost:8000/ws/lobby/123"
    );
    // Muestra "Cargando" antes de recibir el primer mensaje
    expect(screen.getByText("Cargando jugadores...")).toBeInTheDocument();
  });

  it("should render players and 'Iniciar' button for Host", () => {
    render(<Lobby />);

    // Simula la llegada de jugadores
    const wsMessage = {
      type: "players",
      data: JSON.stringify([mockPlayer, mockGuestPlayer]), // data es un string JSON
    };
    act(() => {
      mockWebSocketInstance.onmessage({ data: JSON.stringify(wsMessage) });
    });

    // Se renderizan los jugadores
    expect(screen.getByText("Host Player")).toBeInTheDocument();
    expect(screen.getByText("(HOST)")).toBeInTheDocument();
    expect(screen.getByText("Guest Player")).toBeInTheDocument();

    // El host ve el botón "Iniciar"
    expect(screen.getByRole("button", { name: "Iniciar" })).toBeInTheDocument();
    expect(
      screen.queryByText("Esperando a que el anfitrión...")
    ).not.toBeInTheDocument();
  });

  it("should render players and 'Waiting' text for Guest", () => {
    // Sobreescribimos useLocation para ser el GUEST
    (useLocation as ReturnType<typeof vi.fn>).mockReturnValue({
      state: {
        game: mockGame,
        player: mockGuestPlayer, // Soy el invitado
      },
    });
    render(<Lobby />);

    const wsMessage = {
      type: "players",
      data: JSON.stringify([mockPlayer, mockGuestPlayer]),
    };
    act(() => {
      mockWebSocketInstance.onmessage({ data: JSON.stringify(wsMessage) });
    });

    // Se renderizan los jugadores
    expect(screen.getByText("Host Player")).toBeInTheDocument();
    expect(screen.getByText("Guest Player")).toBeInTheDocument();

    // El invitado NO ve el botón "Iniciar"
    expect(
      screen.queryByRole("button", { name: "Iniciar" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Esperando a que el anfitrión inicie la partida ...")
    ).toBeInTheDocument();
  });

  it("should show validation error if host clicks 'Iniciar' too early", async () => {
    render(<Lobby />);

    // Simula la llegada de 1 solo jugador (insuficiente)
    const wsMessage = {
      type: "players",
      data: JSON.stringify([mockPlayer]),
    };
    act(() => {
      mockWebSocketInstance.onmessage({ data: JSON.stringify(wsMessage) });
    });

    const startButton = screen.getByRole("button", { name: "Iniciar" });
    await userEvent.click(startButton);

    // Muestra error, no llama al servicio
    expect(
      screen.getByText("La partida necesita al menos 2 jugadores para iniciar.")
    ).toBeInTheDocument();
    expect(gameService.startGame).not.toHaveBeenCalled();
  });

  it("should call startGame if host clicks 'Iniciar' with enough players", async () => {
    render(<Lobby />);

    // Simula la llegada de 2 jugadores (suficiente)
    const wsMessage = {
      type: "players",
      data: JSON.stringify([mockPlayer, mockGuestPlayer]),
    };
    act(() => {
      mockWebSocketInstance.onmessage({ data: JSON.stringify(wsMessage) });
    });

    const startButton = screen.getByRole("button", { name: "Iniciar" });
    await userEvent.click(startButton);

    // No muestra error y llama al servicio
    expect(
      screen.queryByText("La partida necesita al menos 2 jugadores...")
    ).not.toBeInTheDocument();
    expect(gameService.startGame).toHaveBeenCalledWith(mockGame.game_id);
  });

  it("should navigate to /game when 'in course' message is received", () => {
    render(<Lobby />);

    // Simula mensaje de inicio de partida
    const gameData = { ...mockGame, status: "in course" };
    const wsMessage = {
      type: "game",
      data: JSON.stringify(gameData), // data es un string JSON
    };
    act(() => {
      mockWebSocketInstance.onmessage({ data: JSON.stringify(wsMessage) });
    });

    // Debe navegar
    expect(mockNavigate).toHaveBeenCalledWith("/game", {
      state: {
        game: gameData,
        player: mockPlayer,
      },
    });
  });
});
