import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import setService, { type SetResponse } from "../../../services/setService";

export const usePlaySet = () => {
  const { state, dispatch } = useGameContext();
  const { selectedCardIds } = state;

  // El estado local (lock, message) ahora vive aquí
  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const playSet = async () => {
    if (lock) return;
    setMessage("");

    if (!selectedCardIds || selectedCardIds.length < 2) {
      setMessage("Seleccione un set válido");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setLock(true);
    try {
      let playedSet: SetResponse | null = null;
      if (selectedCardIds.length === 2) {
        playedSet = await setService.playSet2(
          selectedCardIds[0],
          selectedCardIds[1]
        );
      } else if (selectedCardIds.length === 3) {
        playedSet = await setService.playSet3(
          selectedCardIds[0],
          selectedCardIds[1],
          selectedCardIds[2]
        );
      }
      setMessage("");
      // Limpiamos la selección
      dispatch({ type: "SET_SELECTED_CARD", payload: null });

      if (!playedSet) {
        dispatch({ type: "SET_STEP", payload: "discard_op" });
        return;
      }

      // Avanzamos al paso correspondiente
      switch (playedSet.name) {
        case "Hercule Poirot":
        case "Miss Marple":
          dispatch({ type: "SET_STEP", payload: "sel_reveal_secret" });
          break;
        case "Mr Satterthwaite":
        case "Lady Eileen 'Bundle' Brent":
        case "Tommy Beresford":
        case "Tuppence Beresford":
        case "Beresford brothers":
          dispatch({ type: "SET_STEP", payload: "sel_player_reveal" });
          break;
        case "Parker Pyne":
          dispatch({ type: "SET_STEP", payload: "sel_hide_secret" });
          break;
        default:
          dispatch({ type: "SET_STEP", payload: "discard_op" });
      }
    } catch (err) {
      setMessage("Set inválido. Elija otra combinación");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };
  const cancel = () => {
    dispatch({ type: "CLEAR_SELECTIONS" });
  };
  return { lock, message, playSet, cancel };
};
