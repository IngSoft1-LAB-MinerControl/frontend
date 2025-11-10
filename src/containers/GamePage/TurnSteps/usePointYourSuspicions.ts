import { useState } from "react";
import cardService from "../../../services/cardService";
import { useGameContext } from "../../../context/GameContext";
import eventService from "../../../services/eventService";

export const usePointYourSuspicions = () => {
  const { state, dispatch } = useGameContext();
  const { activeEventCard, myPlayerId, game } = state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const PointYourSuspicions = async () => {
    if (lock) return;
    setMessage("");

    setLock(true);
    try {
      await eventService.pointYourSuspicions(game.game_id);
      dispatch({ type: "SET_STEP", payload: "wait_voting_to_end" });
      dispatch({ type: "SET_ACTIVE_EVENT", payload: null });

      if (activeEventCard) {
        await cardService.discardSelectedList(myPlayerId, [
          activeEventCard.card_id,
        ]);
      }
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
