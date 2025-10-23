import { describe, it, expect, vi, beforeEach } from "vitest";
import playerService, {
  type Player,
  type PlayerStateResponse,
} from "./playerService";
import { httpServerUrl } from "./config";

vi.stubGlobal("fetch", vi.fn());

const mockPlayerStateResponse: PlayerStateResponse = {
  player_id: 1,
  name: "Jugador de Prueba",
  host: true,
  game_id: 1,
  birth_date: "2000-10-20",
  turn_order: 1,
  cards: [],
  secrets: [],
  sets: [],
};

describe("playerService", () => {
  // Limpiamos los mocks antes de cada test
  beforeEach(() => {
    vi.mocked(fetch).mockClear();
  });

  // createPlayer
  describe("createPlayer", () => {
    it("debería enviar una petición POST y devolver el estado del jugador creado", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlayerStateResponse,
      } as Response);

      const newPlayer: Player = {
        name: "Jugador de Prueba",
        host: true,
        game_id: 1,
        birth_date: "2000-10-20",
        avatar: "avatar1",
      };

      const result = await playerService.createPlayer(newPlayer);

      expect(result).toEqual(mockPlayerStateResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/players`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(newPlayer),
        })
      );
    });
  });

  // getPlayersByGame
  describe("getPlayersByGame", () => {
    it("debería obtener y devolver un array de jugadores de una partida", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockPlayerStateResponse],
      } as Response);

      const result = await playerService.getPlayersByGame(1);

      expect(result).toEqual([mockPlayerStateResponse]);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/lobby/players/1`,
        expect.any(Object)
      );
    });
  });
});
