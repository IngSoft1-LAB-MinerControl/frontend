import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import cardService from "../../../services/cardService";
import eventService from "../../../services/eventService";

export const usePlayEvent = () => {
  const { state, dispatch } = useGameContext();
  const { selectedCard, myPlayerId, game } = state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  // Guardamos la carta de evento activa aquí
  const playEvent = async () => {
    if (lock) return;
    setMessage("");
    if (!selectedCard || selectedCard.type !== "event") {
      setMessage(`Seleccione un evento valido.`);
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setLock(true);
    // Guardamos la carta activa en el estado del hook
    dispatch({ type: "SET_ACTIVE_EVENT", payload: selectedCard });

    try {
      switch (selectedCard.name) {
        // --- Eventos con paso propio ---
        case "Another Victim":
          dispatch({ type: "SET_STEP", payload: "another_victim" });
          setLock(false);
          return;
        case "Look into the ashes":
          dispatch({ type: "SET_STEP", payload: "look_into_the_ashes" });
          setLock(false);
          return;
        case "Cards off the table":
          dispatch({ type: "SET_STEP", payload: "cards_off_the_table" });
          setLock(false);
          return;
        case "And then there was one more...":
          dispatch({
            type: "SET_STEP",
            payload: "and_then_there_was_one_more",
          });
          setLock(false);
          return;
        case "Delay the murderer's escape!":
          dispatch({ type: "SET_STEP", payload: "delay_escape_selection" });
          setLock(false);
          return;
        case "Point your suspicions":
          dispatch({ type: "SET_STEP", payload: "point_your_suspicions" });

          setLock(false);
          return;
        case "Early train to paddington":
          await eventService.earlyTrainPaddington(game.game_id, myPlayerId);
          await cardService.discardSelectedList(myPlayerId, [
            selectedCard.card_id,
          ]);
          setMessage(
            "¡Evento ejecutado! 6 carta        // --- Eventos genéricos ---s movidas al descarte."
          );
          setTimeout(() => setMessage(""), 2000);
          dispatch({ type: "SET_SELECTED_CARD", payload: null });
          dispatch({ type: "SET_STEP", payload: "discard_op" });
          break;

        case "Card trade":
          dispatch({ type: "SET_STEP", payload: "card_trade" });
          setLock(false);
          return;
        default:
          console.log("Evento genérico descartado:", selectedCard.name);
          await cardService.discardSelectedList(myPlayerId, [
            selectedCard.card_id,
          ]);
          dispatch({ type: "SET_SELECTED_CARD", payload: null });
          dispatch({ type: "SET_STEP", payload: "discard_op" });
          break;
        case "Dead card folly":
          dispatch({ type: "SET_STEP", payload: "dead_card_folly" });
          setLock(false);
          return;
      }
    } catch (err) {
      console.error("Error al jugar evento:", err);
      setMessage(
        err instanceof Error ? err.message : "Evento inválido. Elija otro."
      );
      setTimeout(() => setMessage(""), 3000);
      dispatch({ type: "CLEAR_SELECTIONS" }); // Volver a 'start'
    }

    // Solo desbloquea si no es un paso que retorna
    setLock(false);
  };

  const cancel = () => {
    dispatch({ type: "CLEAR_SELECTIONS" });
  };

  // Devolvemos activeEventCard para que los sub-pasos puedan usarlo
  return { lock, message, playEvent, cancel };
};
