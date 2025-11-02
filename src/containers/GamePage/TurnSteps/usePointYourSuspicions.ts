import { useState } from "react";
import cardService from "../../../services/cardService";
import { useGameContext } from "../../../context/GameContext";

export const usePointYourSuspicions = () => {
  const { state, dispatch } = useGameContext();
  const { activeEventCard, myPlayerId } = state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const PointYourSuspicions = async () => {
    if (lock) return;
    setMessage("");

    setLock(true);
    try {
      await cardService.pointYourSuspicions(state.game.game_id);

      if (activeEventCard) {
        await cardService.discardSelectedList(myPlayerId, [
          activeEventCard.card_id,
        ]);
      }
      setMessage("Evento ejecutado exitosamente.");
      setTimeout(() => {
        dispatch({ type: "CLEAR_SELECTIONS" });
        dispatch({ type: "SET_STEP", payload: "discard_op" });
      }, 2000);
    } catch (err) {
      console.error("Error al ejecutar evento:", err);
      setMessage("Error al ejecutar el evento.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  const cancel = () => {
    dispatch({ type: "CLEAR_SELECTIONS" });
  };

  return { lock, message, PointYourSuspicions, cancel };
};
