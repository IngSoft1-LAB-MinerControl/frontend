/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GamePage from "./GamePage";

vi.mock("./TurnActions", () => ({
  default: () => <div data-testid="turn-actions"></div>,
}));
vi.mock("../../components/Opponent", () => ({
  default: ({ player }: any) => (
    <div data-testid={`opponent-${player.player_id}`}>{player.name}</div>
  ),
}));
vi.mock("../../components/Decks", () => ({
  default: () => <div data-testid="decks"></div>,
}));
vi.mock("../../components/MyHand", () => ({
  default: ({ player }: any) => <div data-testid="my-hand">{player.name}</div>,
}));
vi.mock("../../components/DraftPile", () => ({
  default: () => <div data-testid="draft-pile"></div>,
}));

let mockLocationState: any = {};
const mockNavigate = vi.fn();

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
  onmessage: (event: { data: string }) => void = () => {};

  constructor() {
    MockWebSocket.instances.push(this);
  }
  close() {}
}
vi.stubGlobal("WebSocket", MockWebSocket);

describe("GamePage", () => {
  const mockInitialGame = {
    game_id: 1,
    name: "Partida de Prueba",
    status: "in_course",
    current_turn: 1,
    cards_left: 40,
  };
  const mockInitialPlayer = {
    player_id: 10,
    name: "Jugador Actual",
    turn_order: 1,
  };

  const mockPlayersState = [
    {
      player_id: 10,
      name: "Jugador Actual",
      turn_order: 1,
      secrets: [],
      cards: [],
    },
    {
      player_id: 20,
      name: "Oponente 1",
      turn_order: 2,
      secrets: [],
      cards: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    MockWebSocket.instances = [];
    mockLocationState = {};
  });

  it("muestra error si no hay estado de partida en la ubicación", () => {
    mockLocationState = {};
    render(<GamePage />, { wrapper: MemoryRouter });
    expect(
      screen.getByText(/Falta el contexto de la partida/i)
    ).toBeInTheDocument();
  });

  it("renderiza el layout y espera la información de jugadores", () => {
    mockLocationState = { game: mockInitialGame, player: mockInitialPlayer };
    render(<GamePage />, { wrapper: MemoryRouter });

    expect(screen.getByTestId("decks")).toBeInTheDocument();
    expect(screen.getByTestId("draft-pile")).toBeInTheDocument();

    expect(screen.queryByTestId("my-hand")).not.toBeInTheDocument();
    expect(screen.queryByTestId("opponent-20")).not.toBeInTheDocument();
  });

  it("muestra los jugadores cuando se recibe el estado por WebSocket", async () => {
    mockLocationState = { game: mockInitialGame, player: mockInitialPlayer };
    render(<GamePage />, { wrapper: MemoryRouter });

    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.onmessage({
        data: JSON.stringify({ type: "playersState", data: mockPlayersState }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("my-hand")).toHaveTextContent("Jugador Actual");
      expect(screen.getByTestId("opponent-20")).toHaveTextContent("Oponente 1");
    });
  });

  it("muestra TurnActions cuando es el turno del jugador", async () => {
    mockLocationState = {
      game: { ...mockInitialGame, current_turn: 1 },
      player: { ...mockInitialPlayer, turn_order: 1 },
    };
    render(<GamePage />, { wrapper: MemoryRouter });

    const ws = MockWebSocket.instances[0];
    act(() => {
      ws.onmessage({
        data: JSON.stringify({ type: "playersState", data: mockPlayersState }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("turn-actions")).toBeInTheDocument();
    });
  });

  it("NO muestra TurnActions cuando NO es el turno del jugador", async () => {
    mockLocationState = {
      game: { ...mockInitialGame, current_turn: 2 },
      player: { ...mockInitialPlayer, turn_order: 1 },
    };
    render(<GamePage />, { wrapper: MemoryRouter });

    const ws = MockWebSocket.instances[0];
    act(() => {
      ws.onmessage({
        data: JSON.stringify({ type: "playersState", data: mockPlayersState }),
      });
    });

    await waitFor(() => {
      expect(screen.queryByTestId("turn-actions")).not.toBeInTheDocument();
    });
  });

  it("muestra la pantalla de victoria correctamente", async () => {
    mockLocationState = { game: mockInitialGame, player: mockInitialPlayer };
    render(<GamePage />, { wrapper: MemoryRouter });

    const ws = MockWebSocket.instances[0];
    const gameFinishedUpdate = {
      ...mockInitialGame,
      status: "finished",
      cards_left: 10,
    };

    act(() => {
      ws.onmessage({
        data: JSON.stringify({ type: "playersState", data: mockPlayersState }),
      });
      ws.onmessage({
        data: JSON.stringify({ type: "gameUpdated", data: gameFinishedUpdate }),
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText(/!Ganaste! !Descubriste al asesino!/i)
      ).toBeInTheDocument();
    });
  });

  it("muestra la pantalla de derrota correctamente", async () => {
    mockLocationState = { game: mockInitialGame, player: mockInitialPlayer };
    render(<GamePage />, { wrapper: MemoryRouter });

    const ws = MockWebSocket.instances[0];
    const gameFinishedUpdate = {
      ...mockInitialGame,
      status: "finished",
      cards_left: 0,
    };

    act(() => {
      ws.onmessage({
        data: JSON.stringify({ type: "playersState", data: mockPlayersState }),
      });
      ws.onmessage({
        data: JSON.stringify({ type: "gameUpdated", data: gameFinishedUpdate }),
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Perdiste. El asesino ganó la partida./i)
      ).toBeInTheDocument();
    });
  });
});
