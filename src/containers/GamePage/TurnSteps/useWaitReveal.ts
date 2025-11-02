import { useEffect } from "react";
import { useGameContext } from "../../../context/GameContext";

/**
 * Este hook no devuelve nada. Su único trabajo es ejecutar un efecto
 * que "escuche" los cambios en el estado 'players' (que viene por WS)
 * para saber cuándo el oponente ha terminado de actuar.
 */
export const useWaitReveal = () => {
  const { state, dispatch } = useGameContext();
  const { players, selectedTargetPlayer } = state;

  useEffect(() => {
    // Si no hay un jugador objetivo, no hacer nada
    if (!selectedTargetPlayer) {
      return;
    }

    // Buscar el estado actualizado de ese jugador en la lista 'players'
    const updatedTargetState = players.find(
      (p) => p.player_id === selectedTargetPlayer.player_id
    );

    // Si encontramos al jugador y su bandera 'isSelected' es false,
    // significa que ya completó la acción (reveló su secreto).
    if (updatedTargetState && !updatedTargetState.isSelected) {
      console.log(
        `El jugador ${updatedTargetState.name} ha revelado. Avanzando.`
      );
      // Limpiamos el jugador objetivo
      dispatch({ type: "SET_SELECTED_TARGET_PLAYER", payload: null });
      // Avanzamos al siguiente paso (descartar)
      dispatch({ type: "SET_STEP", payload: "discard_op" });
    }

    // Dependemos de 'players' (que se actualiza por WS)
  }, [players, selectedTargetPlayer, dispatch]);

  // Este hook no necesita devolver nada a la UI
};
