// Ubicación: src/hooks/useGameWebSocket.ts

import { useEffect } from "react";
import { useGameContext } from "../context/GameContext";
import { httpServerUrl } from "../services/config";

/**
 * Hook personalizado para manejar la conexión WebSocket de la partida.
 * Se conecta, escucha mensajes y actualiza el estado global usando dispatch.
 */
export const useGameWebSocket = (gameId: number | undefined) => {
  const { dispatch } = useGameContext();

  useEffect(() => {
    if (!gameId) return;

    const wsURL = `${httpServerUrl.replace("http", "ws")}/ws/game/${gameId}`;
    const ws = new WebSocket(wsURL);

    ws.onopen = () => {
      console.log(`Conectado al WebSocket de la partida: ${wsURL}`);
      // Limpiamos cualquier error de conexión previo
      dispatch({ type: "SET_ERROR", payload: null });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const dataContent =
          typeof message.data === "string"
            ? JSON.parse(message.data)
            : message.data;

        // Despacha acciones al reducer en lugar de llamar 'setters'
        switch (message.type) {
          case "playersState":
            dispatch({ type: "SET_PLAYERS", payload: dataContent });
            break;
          case "gameUpdated":
            dispatch({ type: "SET_GAME", payload: dataContent });
            break;
          case "droppedCards":
            dispatch({ type: "SET_DISCARD_PILE", payload: dataContent });
            break;
          case "draftCards":
            dispatch({ type: "SET_DRAFT_PILE", payload: dataContent });
            break;
          default:
            console.log("Mensaje WS recibido sin tipo conocido:", message);
        }
      } catch (err) {
        console.error("Error procesando mensaje WS:", err);
      }
    };

    ws.onerror = (event) => {
      console.error("Error en WebSocket:", event);
      dispatch({
        type: "SET_ERROR",
        payload:
          "Error en la conexión en tiempo real. Intenta recargar la página.",
      });
    };

    ws.onclose = () => {
      console.log("Conexión WebSocket de la partida cerrada.");
    };

    // Cierra la conexión cuando el componente se desmonta
    return () => {
      ws.close();
    };
    // 'dispatch' es estable y no causará reconexiones
  }, [gameId, dispatch]);

  // Este hook no necesita devolver nada, ya que su trabajo
  // es "inyectar" datos en el GameContext.
};
