/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import GamePage from "./GamePage";

// vi.mock("./TurnActions", () => ({
//   default: () => <div data-testid="turn-actions"></div>,
// }));
// vi.mock("../../components/Opponent", () => ({
//   default: ({ player }: any) => (
//     <div data-testid={`opponent-${player.player_id}`}>{player.name}</div>
//   ),
// }));
// vi.mock("../../components/MyHand", () => ({
//   default: ({ player }: any) => <div data-testid="my-hand">{player.name}</div>,
// }));

// Mock de los componentes de cartas/sets/secretos para que sean botones simples
vi.mock("../../components/Cards/Detectives", () => ({
  default: ({ name, onCardClick, isSelected }: any) => (
    // Usamos un div clickeable, que es más fiel al componente real
    <div
      onClick={() => onCardClick({ name })} // Simulamos el click
      data-testid={`card-${name}`} // El identificador para nuestro test
      data-selected={isSelected} // Para verificar si está seleccionada
    >
      {name} {/* texto para debug */}
    </div>
  ),
}));

vi.mock("../../components/Cards/Events", () => ({
  default: ({ name, onCardClick, isSelected }: any) => (
    <div
      onClick={() => onCardClick({ name })}
      data-testid={`card-${name}`}
      data-selected={isSelected}
    >
      {name}
    </div>
  ),
}));

vi.mock("../../components/Set", () => ({
  default: ({ name, onSetClick, isSelected, set_id }: any) => (
    <button
      onClick={() => onSetClick({ name, set_id })}
      data-testid={`set-${name}`}
      data-selected={isSelected}
    >
      {name}
    </button>
  ),
}));

// Mock inteligente para TurnActions: nos permite cambiar el 'step' desde el test
vi.mock("./TurnActions", () => ({
  default: ({ setStep }: any) => (
    <div data-testid="turn-actions">
      <button onClick={() => setStep("p_event")}>Modo Evento</button>
      <button onClick={() => setStep("p_set")}>Modo Set</button>
      <button onClick={() => setStep("another_victim")}>Modo Robar Set</button>
    </div>
  ),
}));

vi.mock("../../components/Decks", () => ({
  default: () => <div data-testid="decks"></div>,
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
      sets: [],
    },
    {
      player_id: 20,
      name: "Oponente 1",
      turn_order: 2,
      secrets: [],
      cards: [],
      sets: [],
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

    await expect(
      screen.findByText("Jugador Actual")
    ).resolves.toBeInTheDocument();
    await expect(screen.findByText("Oponente 1")).resolves.toBeInTheDocument();
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

  describe("Interacciones del Jugador", () => {
    // Datos base para estos tests con nombres de cartas reales
    const playersWithCards = [
      {
        player_id: 10,
        name: "Jugador Actual",
        turn_order: 1,
        secrets: [],
        cards: [
          { card_id: 101, name: "Hercule Poirot", type: "detective" },
          { card_id: 102, name: "Look into the ashes", type: "event" },
          { card_id: 103, name: "Miss Marple", type: "detective" },
        ],
        sets: [],
      },
      {
        player_id: 20,
        name: "Oponente 1",
        turn_order: 2,
        secrets: [],
        cards: [],
        sets: [{ set_id: 1, name: "Set del Oponente", detective: [] }],
      },
    ];

    it("debe seleccionar UNA SOLA carta en modo 'Evento'", async () => {
      const user = userEvent.setup();
      mockLocationState = {
        game: { ...mockInitialGame, current_turn: 1 },
        player: mockInitialPlayer,
      };
      render(<GamePage />, { wrapper: MemoryRouter });

      act(() => {
        MockWebSocket.instances[0].onmessage({
          data: JSON.stringify({
            type: "playersState",
            data: playersWithCards,
          }),
        });
      });

      // El usuario cambia a modo 'Jugar Evento'
      const modoEventoBtn = await screen.findByRole("button", {
        name: /Modo Evento/i,
      });
      await user.click(modoEventoBtn);

      // Usamos getByTestId con los nombres reales de las cartas
      const cartaAshes = screen.getByTestId("card-Look into the ashes");
      const cartaPoirot = screen.getByTestId("card-Hercule Poirot");

      expect(cartaAshes).toHaveAttribute("data-selected", "false");
      expect(cartaPoirot).toHaveAttribute("data-selected", "false");

      // 1. Click en la carta de evento -> Se selecciona
      await user.click(cartaAshes);
      expect(cartaAshes).toHaveAttribute("data-selected", "true");
      expect(cartaPoirot).toHaveAttribute("data-selected", "false");

      // 2. Click en la carta de detective -> Esta se selecciona, la otra se deselecciona
      await user.click(cartaPoirot);
      expect(cartaAshes).toHaveAttribute("data-selected", "false");
      expect(cartaPoirot).toHaveAttribute("data-selected", "true");
    });

    it("debe seleccionar MÚLTIPLES cartas en modo 'Set'", async () => {
      const user = userEvent.setup();
      mockLocationState = {
        game: { ...mockInitialGame, current_turn: 1 },
        player: mockInitialPlayer,
      };
      render(<GamePage />, { wrapper: MemoryRouter });

      act(() => {
        MockWebSocket.instances[0].onmessage({
          data: JSON.stringify({
            type: "playersState",
            data: playersWithCards,
          }),
        });
      });

      const modoSetBtn = await screen.findByRole("button", {
        name: /Modo Set/i,
      });
      await user.click(modoSetBtn);

      const cartaPoirot = screen.getByTestId("card-Hercule Poirot");
      const cartaMarple = screen.getByTestId("card-Miss Marple");

      // 1. Click en Poirot -> Se selecciona
      await user.click(cartaPoirot);
      expect(cartaPoirot).toHaveAttribute("data-selected", "true");
      expect(cartaMarple).toHaveAttribute("data-selected", "false");

      // 2. Click en Marple -> Ambas se seleccionan
      await user.click(cartaMarple);
      expect(cartaPoirot).toHaveAttribute("data-selected", "true");
      expect(cartaMarple).toHaveAttribute("data-selected", "true");

      // 3. Click de nuevo en Poirot -> Se deselecciona, Marple sigue seleccionada
      await user.click(cartaPoirot);
      expect(cartaPoirot).toHaveAttribute("data-selected", "false");
      expect(cartaMarple).toHaveAttribute("data-selected", "true");
    });

    it("debe permitir seleccionar un set de un oponente en modo 'Robar Set'", async () => {
      const user = userEvent.setup();
      mockLocationState = {
        game: { ...mockInitialGame, current_turn: 1 },
        player: mockInitialPlayer,
      };
      render(<GamePage />, { wrapper: MemoryRouter });

      act(() => {
        MockWebSocket.instances[0].onmessage({
          data: JSON.stringify({
            type: "playersState",
            data: playersWithCards,
          }),
        });
      });

      const modoRobarBtn = await screen.findByRole("button", {
        name: /Modo Robar Set/i,
      });
      await user.click(modoRobarBtn);

      const opponentSet = screen.getByTestId("set-Set del Oponente");
      expect(opponentSet).toHaveAttribute("data-selected", "false");

      await user.click(opponentSet);
      expect(opponentSet).toHaveAttribute("data-selected", "true");
    });
  });
});
