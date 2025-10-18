/// <reference types="vitest" />
import { describe, it, vi, beforeEach, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ListGames from "./ListGames";
import playerService from "../../services/playerService";
import { act } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";

// --- Mock WebSocket ---
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

// --- MOCK playerService ---
vi.mock("../../services/playerService", () => ({
  default: {
    createPlayer: vi.fn(),
  },
}));

// --- MOCK useNavigate ---
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("ListGames", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.clearAllMocks();
  });

  it("renderiza partidas disponibles correctamente", async () => {
    render(
      <MemoryRouter>
        <ListGames />
      </MemoryRouter>
    );

    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.onopen?.();
      ws.onmessage?.({
        data: JSON.stringify([
          {
            game_id: 1,
            name: "Partida 1",
            min_players: 2,
            max_players: 4,
            players_amount: 1,
            status: "waiting players",
            avatar: "ana.png",
          },
          {
            game_id: 2,
            name: "Partida 2",
            min_players: 2,
            max_players: 4,
            players_amount: 2,
            status: "bootable",
            avatar: "juan.png",
          },
        ]),
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Partida 1")).toBeInTheDocument();
      expect(screen.getByText("Partida 2")).toBeInTheDocument();
    });
  });

  it("navega al lobby al unirse a una partida", async () => {
    (
      playerService.createPlayer as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      player_id: 1,
      name: "JugadorTest",
      birth_date: "2000-01-01",
      host: false,
      game_id: 1,
      avatar: "ana.png",
    });

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/list",
            state: {
              playerName: "JugadorTest",
              playerDate: "2000-01-01",
              playerAvatar: "ana.png",
            },
          },
        ]}
      >
        <Routes>
          <Route path="/list" element={<ListGames />} />
        </Routes>
      </MemoryRouter>
    );

    const ws = MockWebSocket.instances[0];

    // Simular mensaje WebSocket con partida joinable
    await act(async () => {
      ws.onopen?.();
      ws.onmessage?.({
        data: JSON.stringify([
          {
            game_id: 1,
            name: "Partida 1",
            min_players: 2,
            max_players: 4,
            players_amount: 1,
            status: "waiting players",
            avatar: "ana.png",
          },
        ]),
      });
    });

    const button = await screen.findByRole("button", { name: /Unirme/i });

    await act(async () => {
      await userEvent.click(button);
    });

    await waitFor(() => {
      expect(playerService.createPlayer).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalled();
    });
  });

  it("muestra error si no hay info del jugador", async () => {
    render(
      <MemoryRouter>
        <ListGames />
      </MemoryRouter>
    );

    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.onopen?.();
      ws.onmessage?.({
        data: JSON.stringify([
          {
            game_id: 1,
            name: "Partida 1",
            min_players: 2,
            max_players: 4,
            players_amount: 1,
            status: "waiting players",
            avatar: "ana.png",
          },
        ]),
      });
    });

    const button = await screen.findByRole("button", { name: /Unirme/i });

    await act(async () => {
      await userEvent.click(button);
    });

    await waitFor(() => {
      expect(
        screen.getByText("No se encontró información del jugador")
      ).toBeInTheDocument();
    });
  });

  it("ordena las partidas según getOrder", async () => {
    render(
      <MemoryRouter>
        <ListGames />
      </MemoryRouter>
    );

    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.onopen?.();
      ws.onmessage?.({
        data: JSON.stringify([
          {
            game_id: 1,
            name: "Partida InCourse",
            min_players: 2,
            max_players: 4,
            players_amount: 2,
            status: "in_course",
            avatar: "a.png",
          },
          {
            game_id: 2,
            name: "Partida Full",
            min_players: 2,
            max_players: 4,
            players_amount: 4,
            status: "full",
            avatar: "b.png",
          },
          {
            game_id: 3,
            name: "Partida Waiting",
            min_players: 2,
            max_players: 4,
            players_amount: 1,
            status: "waiting players",
            avatar: "c.png",
          },
          {
            game_id: 4,
            name: "Partida Bootable",
            min_players: 2,
            max_players: 4,
            players_amount: 2,
            status: "bootable",
            avatar: "d.png",
          },
        ]),
      });
    });

    await waitFor(() => {
      const items = screen.getAllByRole("listitem");
      const names = items.map(
        (li) => li.querySelector(".item-title")?.textContent
      );
      expect(names).toEqual([
        "Partida Waiting",
        "Partida Bootable",
        "Partida Full",
        "Partida InCourse",
      ]);
    });
  });

  it("deshabilita el botón Unirme si la partida no está en estado joinable", async () => {
    render(
      <MemoryRouter>
        <ListGames />
      </MemoryRouter>
    );

    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.onopen?.();
      ws.onmessage?.({
        data: JSON.stringify([
          {
            game_id: 1,
            name: "Partida Full",
            min_players: 2,
            max_players: 4,
            players_amount: 4,
            status: "full",
            avatar: "x.png",
          },
          {
            game_id: 2,
            name: "Partida InCourse",
            min_players: 2,
            max_players: 4,
            players_amount: 2,
            status: "in_course",
            avatar: "y.png",
          },
        ]),
      });
    });

    await waitFor(() => {
      const buttons = screen.getAllByRole("button", { name: /Unirme/i });
      buttons.forEach((btn) => expect(btn).toBeDisabled());
    });
  });

  it("habilita el botón Unirme si la partida está joinable", async () => {
    render(
      <MemoryRouter>
        <ListGames />
      </MemoryRouter>
    );

    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.onopen?.();
      ws.onmessage?.({
        data: JSON.stringify([
          {
            game_id: 1,
            name: "Partida Waiting",
            min_players: 2,
            max_players: 4,
            players_amount: 1,
            status: "waiting players",
            avatar: "a.png",
          },
          {
            game_id: 2,
            name: "Partida Bootable",
            min_players: 2,
            max_players: 4,
            players_amount: 2,
            status: "bootable",
            avatar: "b.png",
          },
        ]),
      });
    });

    await waitFor(() => {
      const buttons = screen.getAllByRole("button", { name: /Unirme/i });
      buttons.forEach((btn) => expect(btn).toBeEnabled());
    });
  });
});
