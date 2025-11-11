/// <reference types="vitest" />
// <--- CORRECCIÓN 1: ESTA LÍNEA ARREGLA EL ERROR DE 'vi'
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useGameWebSocket } from "./useGameWebSocket";
import { useGameContext } from "../context/GameContext";

// Mock de la config
vi.mock("../services/config", () => ({
  httpServerUrl: "http://mock-server.com",
}));

// Mock del Context
vi.mock("../context/GameContext");

// --- Mock del WebSocket Global ---
// Esta variable la usaremos en los tests para controlar el WS
let mockWebSocketInstance: {
  onopen: () => void;
  onmessage: (event: { data: string }) => void;
  onerror: (event: any) => void;
  onclose: () => void;
  close: ReturnType<typeof vi.fn>;
};

class MockWebSocket {
  close = vi.fn();
  // CORRECCIÓN 2: 'url' renombrado a '_url' para silenciar el warning
  constructor(_url: string) {
    // Almacenamos la instancia 'this' para controlarla desde el test
    mockWebSocketInstance = this as any;
  }
}
vi.stubGlobal("WebSocket", MockWebSocket);
// ---

let mockDispatch: ReturnType<typeof vi.fn>;

describe("useGameWebSocket Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch = vi.fn();

    // Mockeamos el hook del contexto para espiar el dispatch
    vi.mocked(useGameContext).mockReturnValue({
      dispatch: mockDispatch,
    } as any);
  });

  afterEach(() => {
    cleanup(); // Limpia los hooks renderizados
  });

  it("should not connect if gameId is undefined", () => {
    renderHook(() => useGameWebSocket(undefined));
    // Si no hay gameId, no debería ni intentar crear el WebSocket
    expect(mockWebSocketInstance).toBeUndefined();
  });

  it("should connect to the correct WebSocket URL", () => {
    renderHook(() => useGameWebSocket(123));
    // Verifica que la URL se construyó correctamente
    expect(vi.mocked(global.WebSocket)).toHaveBeenCalledWith(
      "ws://mock-server.com/ws/game/123"
    );
  });

  it("should dispatch SET_ERROR null on open", () => {
    renderHook(() => useGameWebSocket(123));
    // Simulamos la apertura de la conexión
    act(() => {
      mockWebSocketInstance.onopen();
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_ERROR",
      payload: null,
    });
  });

  it("should dispatch SET_ERROR on error", () => {
    renderHook(() => useGameWebSocket(123));
    // Simulamos un error
    act(() => {
      mockWebSocketInstance.onerror(new Event("error"));
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_ERROR",
      payload: expect.stringContaining("Error en la conexión"),
    });
  });

  it("should call ws.close on unmount", () => {
    const { unmount } = renderHook(() => useGameWebSocket(123));
    // El hook se desmonta
    unmount();
    expect(mockWebSocketInstance.close).toHaveBeenCalledTimes(1);
  });

  describe("onmessage handling (switch statement)", () => {
    // Helper para simular mensajes
    const simulateMessage = (type: string, data: any) => {
      // El hook espera que 'message.data' sea un string JSON
      // Y que 'data' (dataContent) también pueda ser un string JSON
      const dataString = JSON.stringify(data);
      const message = { type: type, data: dataString };
      act(() => {
        mockWebSocketInstance.onmessage({ data: JSON.stringify(message) });
      });
    };

    it("should dispatch SET_PLAYERS for 'playersState'", () => {
      const players = [{ player_id: 1 }];
      renderHook(() => useGameWebSocket(123));
      simulateMessage("playersState", players);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_PLAYERS",
        payload: players,
      });
    });

    it("should dispatch SET_GAME and SET_LOGS for 'gameUpdated'", () => {
      const gameData = { game_id: 123, status: "in course", log: [{ id: 1 }] };
      renderHook(() => useGameWebSocket(123));
      simulateMessage("gameUpdated", gameData);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_GAME",
        payload: gameData,
      });
      // Verifica el dispatch anidado
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_LOGS",
        payload: gameData.log,
      });
    });

    it("should dispatch SET_LAST_CANCELABLE_EVENT", () => {
      const log = { log_id: 10 };
      renderHook(() => useGameWebSocket(123));
      simulateMessage("lastCancelableEvent", log);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_LAST_CANCELABLE_EVENT",
        payload: log,
      });
    });

    it("should dispatch SET_LAST_CANCELABLE_SET", () => {
      const log = { log_id: 11 };
      renderHook(() => useGameWebSocket(123));
      simulateMessage("setResponse", log);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_LAST_CANCELABLE_SET",
        payload: log,
      });
    });

    it("should dispatch SET_DISCARD_PILE", () => {
      const cards = [{ card_id: 1 }];
      renderHook(() => useGameWebSocket(123));
      simulateMessage("droppedCards", cards);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_DISCARD_PILE",
        payload: cards,
      });
    });

    it("should dispatch SET_DRAFT_PILE", () => {
      const cards = [{ card_id: 2 }];
      renderHook(() => useGameWebSocket(123));
      simulateMessage("draftCards", cards);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_DRAFT_PILE",
        payload: cards,
      });
    });

    it("should dispatch SET_BLACKMAIL_SECRET", () => {
      const secret = { secret_id: 3 };
      renderHook(() => useGameWebSocket(123));
      simulateMessage("blackmailed", secret);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_BLACKMAIL_SECRET",
        payload: secret,
      });
    });

    it("should dispatch ADD_CHAT_MESSAGE", () => {
      const chatMsg = { sender_name: "Test", message: "Hola" };
      renderHook(() => useGameWebSocket(123));
      simulateMessage("Chat", chatMsg);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "ADD_CHAT_MESSAGE",
        payload: chatMsg,
      });
    });

    it("should handle data not being a string (dataContent = message.data)", () => {
      renderHook(() => useGameWebSocket(123));
      const chatMsg = { sender_name: "Test", message: "Hola" };
      // Esta vez 'data' NO es un string, es un objeto
      const message = { type: "Chat", data: chatMsg };
      act(() => {
        mockWebSocketInstance.onmessage({ data: JSON.stringify(message) });
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "ADD_CHAT_MESSAGE",
        payload: chatMsg,
      });
    });

    it("should ignore unknown message types", () => {
      renderHook(() => useGameWebSocket(123));
      simulateMessage("TIPO_DESCONOCIDO", { data: "test" });
      // El único dispatch debería ser el de onopen
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("should catch errors if JSON.parse fails", () => {
      renderHook(() => useGameWebSocket(123));
      act(() => {
        // Simulamos un onopen para limpiar el error
        mockWebSocketInstance.onopen();
        // Limpiamos ese dispatch
        mockDispatch.mockClear();
        // Enviamos basura
        mockWebSocketInstance.onmessage({ data: "esto no es json" });
      });
      // No debe crashear, y no debe llamar a dispatch
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
