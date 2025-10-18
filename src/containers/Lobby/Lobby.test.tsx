/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Lobby from "./Lobby";
import gameService from "../../services/gameService";

// ✅ Mock de servicios
vi.mock("../../services/gameService", () => ({
  default: {
    startGame: vi.fn(),
  },
}));

// ✅ Mock de React Router DOM
const mockNavigate = vi.fn();
let mockLocationState: any = {};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
  };
});

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;

  onopen = () => {};
  onmessage = (_: any) => {};
  onerror = () => {};
  onclose = () => {};

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send() {}
  close() {}
}

vi.stubGlobal("WebSocket", MockWebSocket);

describe("Lobby", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockWebSocket.instances = [];
  });

  const mockGame = {
    game_id: 1,
    name: "Test Game",
    status: "waiting for players",
    min_players: 3,
    max_players: 6,
    players_amount: 0,
    current_turn: 0,
    cards_left: 49,
  };

  const playersMock = [
    {
      player_id: 1,
      name: "Ana",
      host: true,
      game_id: 1,
      birth_date: "2000-02-01",
      avatar: "ana.png",
    },
    {
      player_id: 2,
      name: "Juan",
      host: false,
      game_id: 1,
      birth_date: "1998-03-12",
      avatar: "juan.png",
    },
  ];

  it("muestra 'Cargando jugadores...' cuando no hay jugadores", () => {
    mockLocationState = { game: mockGame, player: playersMock[0] };

    render(
      <MemoryRouter>
        <Lobby />
      </MemoryRouter>
    );

    expect(screen.getByText("Cargando jugadores...")).toBeInTheDocument();
  });

  it("muestra mensaje de espera si no es host", async () => {
    mockLocationState = { game: mockGame, player: playersMock[1] };

    render(
      <MemoryRouter>
        <Lobby />
      </MemoryRouter>
    );

    // Simular llegada de jugadores por WebSocket
    const ws = MockWebSocket.instances[0];
    ws.onmessage({
      data: JSON.stringify({ type: "players", data: playersMock }),
    });

    await waitFor(() =>
      expect(
        screen.getByText("Esperando a que el anfitrión inicie la partida ...")
      ).toBeInTheDocument()
    );
  });

  it("muestra botón Iniciar si es host", async () => {
    mockLocationState = { game: mockGame, player: playersMock[0] };

    render(
      <MemoryRouter>
        <Lobby />
      </MemoryRouter>
    );

    const ws = MockWebSocket.instances[0];
    ws.onmessage({
      data: JSON.stringify({ type: "players", data: playersMock }),
    });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Iniciar" })
      ).toBeInTheDocument()
    );
  });

  it("muestra error si intenta iniciar sin cumplir min_players", async () => {
    mockLocationState = { game: mockGame, player: playersMock[0] };

    render(
      <MemoryRouter>
        <Lobby />
      </MemoryRouter>
    );

    const ws = MockWebSocket.instances[0];
    ws.onmessage({
      data: JSON.stringify({ type: "players", data: playersMock }),
    });

    const startBtn = await screen.findByRole("button", { name: "Iniciar" });
    await userEvent.click(startBtn);

    await waitFor(() =>
      expect(
        screen.getByText(
          "La partida necesita al menos 3 jugadores para iniciar."
        )
      ).toBeInTheDocument()
    );
  });

  it("llama a startGame si hay jugadores suficientes", async () => {
    mockLocationState = {
      game: { ...mockGame, min_players: 2 },
      player: playersMock[0],
    };

    vi.mocked(gameService.startGame).mockResolvedValue({
      game_id: 1,
      name: "PartidaTest",
      status: "in course",
      min_players: 2,
      max_players: 4,
      players_amount: 2,
      current_turn: 0,
      cards_left: 0,
    });

    render(
      <MemoryRouter>
        <Lobby />
      </MemoryRouter>
    );

    const ws = MockWebSocket.instances[0];
    ws.onmessage({
      data: JSON.stringify({ type: "players", data: playersMock }),
    });

    const startBtn = await screen.findByRole("button", { name: "Iniciar" });
    await userEvent.click(startBtn);

    await waitFor(() => {
      expect(gameService.startGame).toHaveBeenCalledWith(1);
    });
  });
});
