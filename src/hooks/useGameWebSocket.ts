// Ubicación: src/hooks/useGameWebSocket.ts

import { useRef, useEffect } from "react";
import { useGameContext } from "../context/GameContext";
import { httpServerUrl } from "../services/config";
import { data } from "react-router-dom";

/**
 * Hook personalizado para manejar la conexión WebSocket de la partida.
 * Se conecta, escucha mensajes y actualiza el estado global usando dispatch.
 */
export const useGameWebSocket = (gameId: number | undefined) => {
  const { dispatch } = useGameContext();
  const previousStatusRef = useRef<string | null>(null); // estado anterior del juego

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
            const previousStatus = previousStatusRef.current; // lee el estado anterior
            const newStatus = dataContent.status; // estado nuevo recibido
            dispatch({ type: "SET_GAME", payload: dataContent });
            if (previousStatus === "in course" && newStatus === "Voting") {
              dispatch({ type: "SET_STEP", payload: "vote" });
            } else if (
              previousStatus === "Voting" &&
              newStatus === "in course"
            ) {
              // buscamos al jugador más votado
              const players = dataContent.players || [];
              if (players.length > 0) {
                const maxVotes = Math.max(
                  ...players.map((p: any) => p.votes_received)
                );
                const mostVoted = players.find(
                  (p: any) => p.votes_received === maxVotes
                );

                if (mostVoted) {
                  // Guardamos al ganador como selectedTargetPlayer
                  dispatch({
                    type: "SET_SELECTED_TARGET_PLAYER",
                    payload: mostVoted,
                  });

                  //dispatch({ type: "SET_STEP", payload: "start" });
                }
              }
            }

            previousStatusRef.current = newStatus;
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
