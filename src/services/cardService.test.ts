import { describe, it, expect, vi, beforeEach } from "vitest";
import cardService, { type CardResponse } from "./cardService";
import { httpServerUrl } from "./config";

vi.stubGlobal("fetch", vi.fn());

const mockCard: CardResponse = {
  card_id: 1,
  game_id: 1,
  player_id: 1,
  type: "Detective",
  name: "Test Card",
  picked_up: false,
  dropped: false,
};

const mockCardsArray: CardResponse[] = [mockCard];

describe("cardService", () => {
  // Limpiamos los mocks antes de cada test
  beforeEach(() => {
    vi.mocked(fetch).mockClear();
  });

  // getCardsByPlayer
  describe("getCardsByPlayer", () => {
    it("debería devolver un array de cartas en caso de éxito", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCardsArray,
      } as Response);

      const result = await cardService.getCardsByPlayer(1);
      expect(result).toEqual(mockCardsArray);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/lobby/list/cards/1`,
        expect.any(Object)
      );
    });
  });

  // discardAuto
  describe("discardAuto", () => {
    it("debería devolver las cartas actualizadas en caso de éxito", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCardsArray,
      } as Response);

      const result = await cardService.discardAuto(1);
      expect(result).toEqual(mockCardsArray);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/cards/drop/1`,
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("debería lanzar un error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "API Error" }),
      } as Response);

      await expect(cardService.discardAuto(1)).rejects.toThrow("API Error");
    });
  });

  // discardSelectedList
  describe("discardSelectedList", () => {
    it("debería descartar la lista de cartas en caso de éxito", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCardsArray,
      } as Response);

      const cardIds = [1, 2];
      const result = await cardService.discardSelectedList(1, cardIds);

      expect(result).toEqual(mockCardsArray);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/cards/game/drop_list/1`,
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ card_ids: cardIds }),
        })
      );
    });

    it("debería lanzar un error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Failed to discard" }),
      } as Response);

      await expect(cardService.discardSelectedList(1, [1, 2])).rejects.toThrow(
        "Failed to discard"
      );
    });
  });

  // drawCard
  describe("drawCard", () => {
    it("debería devolver la carta robada en caso de éxito", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCard,
      } as Response);

      const result = await cardService.drawCard(1, 1);
      expect(result).toEqual(mockCard);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/cards/pick_up/1,1`,
        expect.any(Object)
      );
    });

    it("debería lanzar un error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "No cards left" }),
      } as Response);

      await expect(cardService.drawCard(1, 1)).rejects.toThrow("No cards left");
    });
  });

  // getDraftPile
  describe("getDraftPile", () => {
    it("debería devolver el draft pile en caso de éxito", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCardsArray,
      } as Response);

      const result = await cardService.getDraftPile(1);
      expect(result).toEqual(mockCardsArray);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/cards/draft/1`,
        expect.any(Object)
      );
    });

    it("debería devolver un array vacío si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

      const result = await cardService.getDraftPile(1);
      expect(result).toEqual([]);
    });
  });

  // pickUpDraftCard
  describe("pickUpDraftCard", () => {
    it("debería devolver la carta del draft en caso de éxito", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCard,
      } as Response);

      const result = await cardService.pickUpDraftCard(1, 1, 1);
      expect(result).toEqual(mockCard);
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/cards/draft_pickup/1,1,1`,
        expect.any(Object)
      );
    });

    it("debería lanzar un error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Card not in draft" }),
      } as Response);

      await expect(cardService.pickUpDraftCard(1, 1, 1)).rejects.toThrow(
        "Card not in draft"
      );
    });
  });

  // pickUpFromDiscard
  describe("pickUpFromDiscard", () => {
    it("debería completarse sin errores en caso de éxito", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await expect(
        cardService.pickUpFromDiscard(1, 10)
      ).resolves.toBeUndefined();
      expect(fetch).toHaveBeenCalledWith(
        `${httpServerUrl}/event/look_into_ashes/1,10`,
        expect.any(Object)
      );
    });

    it("debería lanzar un error si la respuesta no es ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Cannot pick up" }),
      } as Response);

      await expect(cardService.pickUpFromDiscard(1, 10)).rejects.toThrow(
        "Fallo al robar del descarte: Cannot pick up"
      );
    });
  });
});
