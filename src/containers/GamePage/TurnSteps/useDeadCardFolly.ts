import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import eventService from "../../../services/eventService";

export const useDeadCardFolly = () => {
  const { state, dispatch } = useGameContext();
  const { game, myPlayerId, activeEventCard } = state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const confirmDeadCardFolly = async (direction: "left" | "right") => {
    if (lock) {
      setMessage("Debe seleccionar un jugador.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    if (!activeEventCard) {
      setMessage("Error interno: Falta jugador o carta de evento.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLock(true);
    try {
      dispatch({ type: "SET_TRADE_DIRECTION", payload: direction });
      await eventService.initiateDeadCardFolly(
        myPlayerId,
        game.game_id,
        activeEventCard.card_id
      );
      dispatch({ type: "SET_STEP", payload: "wait_trade_folly" });
      dispatch({ type: "SET_ACTIVE_EVENT", payload: null });
    } catch (err) {
      console.error("Error al iniciar intercambio:", err);
      setMessage(
        err instanceof Error
          ? err.message
          : "Error al iniciar intercambio. Intenta de nuevo."
      );

      dispatch({ type: "CLEAR_SELECTIONS" });
    } finally {
      setLock(false);
    }
  };

  return { lock, message, confirmDeadCardFolly };
};
