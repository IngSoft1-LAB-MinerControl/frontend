import { useEffect } from "react";
import { useGameContext } from "../../../context/GameContext";
import { usePrevious } from "../../../hooks/usePrevious"; // Asegúrate que la ruta sea correcta

export const useWaitingVotingToEnd = () => {
  const { state, dispatch, isMyTurn, currentPlayer } = useGameContext();
  const { currentStep } = state;
  const pendingAction = currentPlayer?.pending_action;
  const prevPendingAction = usePrevious(pendingAction);

  useEffect(() => {
    // Si no es mi turno o no estamos en este paso, no hacemos nada
    if (!isMyTurn || currentStep !== "wait_voting_to_end") {
      return;
    }

    if (prevPendingAction === "WAITING_VOTING_TO_END") {
      if (
        pendingAction !== "VOTE" &&
        pendingAction !== "WAITING_VOTING_TO_END"
      ) {
        console.log(
          "Votación completada (detectada por hook). Avanzando a 'discard_op'."
        );
        dispatch({ type: "SET_STEP", payload: "discard_op" });
      }
    }
  }, [isMyTurn, currentStep, pendingAction, prevPendingAction, dispatch]);
};
