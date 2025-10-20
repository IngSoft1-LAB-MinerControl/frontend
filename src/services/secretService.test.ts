import { describe, it, expect, vi, beforeEach } from "vitest";
import secretService, { type SecretResponse } from "./secretService";
import { httpServerUrl } from "./config";

vi.stubGlobal("fetch", vi.fn());

const mockSecretResponse: SecretResponse = {
  secret_id: 1,
  player_id: 1,
  game_id: 1,
  revelated: false,
  murderer: false,
  accomplice: false,
};

describe("secretService", () => {
  // Limpiamos los mocks antes de cada test
  beforeEach(() => {
    vi.mocked(fetch).mockClear();
  });

  // getSecretsByPlayer
  describe("getSecretsByPlayer", () => {
    it("debería obtener y devolver los secretos de un jugador", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockSecretResponse],
      } as Response);

      const result = await secretService.getSecretsByPlayer(1);

      expect(result).toEqual([mockSecretResponse]);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/lobby/secrets/1`,
        expect.any(Object)
      );
    });
  });

  // revealSecret
  describe("revealSecret", () => {
    it("debería enviar una petición PUT para revelar un secreto y devolver su estado", async () => {
      const revealedSecret = { ...mockSecretResponse, revelated: true };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => revealedSecret,
      } as Response);

      const result = await secretService.revealSecret(1);

      expect(result).toEqual(revealedSecret);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/secrets/reveal/1`,
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  // hideSecret
  describe("hideSecret", () => {
    it("debería enviar una petición PUT para ocultar un secreto y devolver su estado", async () => {
      const hiddenSecret = { ...mockSecretResponse, revelated: false };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => hiddenSecret,
      } as Response);

      const result = await secretService.hideSecret(1);

      expect(result).toEqual(hiddenSecret);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/secrets/hide/1`,
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  // stealSecret
  describe("stealSecret", () => {
    it("debería enviar una petición PUT para robar un secreto y devolver su nuevo estado", async () => {
      const stolenSecret = { ...mockSecretResponse, player_id: 2 };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => stolenSecret,
      } as Response);

      const result = await secretService.stealSecret(1, 2);

      expect(result).toEqual(stolenSecret);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/secrets/steal/1,2`,
        expect.objectContaining({ method: "PUT" })
      );
    });
  });
});
