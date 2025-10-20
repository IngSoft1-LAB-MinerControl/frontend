import { describe, it, expect, vi, beforeEach } from "vitest";
import setService, { type SetResponse } from "./setService";
import { httpServerUrl } from "./config";

vi.stubGlobal("fetch", vi.fn());

const mockSetResponse: SetResponse = {
  game_id: 1,
  player_id: 1,
  set_id: 1,
  name: "Set de Prueba",
  detective: [],
};

describe("setService", () => {
  // Limpiamos los mocks antes de cada test
  beforeEach(() => {
    vi.mocked(fetch).mockClear();
  });

  // getSets
  describe("getSets", () => {
    it("debería obtener y devolver los sets de un jugador en caso de éxito", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockSetResponse],
      } as Response);

      const result = await setService.getSets(1);

      expect(result).toEqual([mockSetResponse]);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/sets/list/1`,
        expect.any(Object)
      );
    });

    it("debería lanzar un error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Error al obtener sets" }),
      } as Response);

      await expect(setService.getSets(1)).rejects.toThrow(
        "Error al obtener sets"
      );
    });
  });

  // playSet2
  describe("playSet2", () => {
    it("debería enviar una petición POST para jugar un set y devolver su estado", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetResponse,
      } as Response);

      const result = await setService.playSet2(1, 2);

      expect(result).toEqual(mockSetResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/sets_of2/1,2`,
        expect.objectContaining({ method: "POST" })
      );
    });

    it("debería lanzar un error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Error al jugar set" }),
      } as Response);

      await expect(setService.playSet2(1, 2)).rejects.toThrow(
        "Error al jugar set"
      );
    });
  });

  // playSet3
  describe("playSet3", () => {
    it("debería enviar una petición POST para jugar un set y devolver su estado", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetResponse,
      } as Response);

      const result = await setService.playSet3(1, 2, 3);

      expect(result).toEqual(mockSetResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/sets_of3/1,2,3`,
        expect.objectContaining({ method: "POST" })
      );
    });

    it("debería lanzar un error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Error al jugar set" }),
      } as Response);

      await expect(setService.playSet3(1, 2, 3)).rejects.toThrow(
        "Error al jugar set"
      );
    });
  });

  // stealSet
  describe("stealSet", () => {
    it("debería enviar una petición PUT para robar un set y devolver su nuevo estado", async () => {
      const stolenSet = { ...mockSetResponse, player_id: 2 };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => stolenSet,
      } as Response);

      const result = await setService.stealSet(2, 1);

      expect(result).toEqual(stolenSet);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/sets/steal/2/1`,
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("debería lanzar un error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Error al robar set" }),
      } as Response);

      await expect(setService.stealSet(2, 1)).rejects.toThrow(
        "Error al robar set"
      );
    });
  });
});
