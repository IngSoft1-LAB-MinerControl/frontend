import { describe, it, expect, vi, beforeEach } from "vitest";
import gameService, { type Game, type GameResponse } from "./gameService";
import { httpServerUrl } from "./config";

vi.stubGlobal("fetch", vi.fn());

const mockGameResponse: GameResponse = {
  game_id: 1,
  name: "Partida de Prueba",
  status: "LOBBY",
  min_players: 4,
  max_players: 8,
  players_amount: 1,
  current_turn: 0,
  cards_left: 50,
};

describe("gameService", () => {
  // Limpiamos los mocks antes de cada test
  beforeEach(() => {
    vi.mocked(fetch).mockClear();
  });

  // createGame
  describe("createGame", () => {
    it("debería enviar una petición POST y devolver los datos del juego creado", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGameResponse,
      } as Response);

      const newGame: Game = {
        name: "Partida de Prueba",
        min_players: 4,
        max_players: 8,
        status: "LOBBY",
      };

      const result = await gameService.createGame(newGame);

      expect(result).toEqual(mockGameResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/games`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(newGame),
        })
      );
    });
  });

  // getGames
  describe("getGames", () => {
    it("debería obtener y devolver un array de juegos", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockGameResponse],
      } as Response);

      const result = await gameService.getGames();

      expect(result).toEqual([mockGameResponse]);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/games`,
        expect.any(Object)
      );
    });
  });

  // startGame
  describe("startGame", () => {
    it("debería enviar una petición POST para iniciar el juego y devolver su estado", async () => {
      const startedGameResponse = {
        ...mockGameResponse,
        status: "IN_PROGRESS",
      };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => startedGameResponse,
      } as Response);

      const result = await gameService.startGame(1);

      expect(result).toEqual(startedGameResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/game/beginning/1`,
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  // getGameById
  describe("getGameById", () => {
    it("debería obtener y devolver los datos de un juego específico", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGameResponse,
      } as Response);

      const result = await gameService.getGameById(1);

      expect(result).toEqual(mockGameResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/games/1`,
        expect.any(Object)
      );
    });
  });

  // updateTurn
  describe("updateTurn", () => {
    it("debería enviar una petición PUT para actualizar el turno y devolver el estado del juego", async () => {
      const updatedGameResponse = { ...mockGameResponse, current_turn: 1 };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedGameResponse,
      } as Response);

      const result = await gameService.updateTurn(1);

      expect(result).toEqual(updatedGameResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/game/update_turn/1`,
        expect.objectContaining({ method: "PUT" })
      );
    });
  });
});
