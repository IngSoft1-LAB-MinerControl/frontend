import { useEffect, useMemo, useRef } from "react";
import { useGameContext } from "../context/GameContext";

// Importa todas las dependencias que vamos a MOVER de Gameboard
import TurnActions from "../containers/GamePage/TurnActions";
import TextType from "./TextType.tsx";
import secretService from "../services/secretService";
import playerService from "../services/playerService";
import eventService from "../services/eventService";
import logService from "../services/logService.ts";
import { VoteStep } from "../containers/GamePage/TurnSteps/VoteStep.tsx";
import { LogMessage } from "./LogMessage.tsx";

import "./GameLogPanel.css";

export const GameLogPanel = () => {
  const { state, dispatch, isMyTurn, currentPlayer } = useGameContext();

  // agg game para leer log
  const { myPlayerId, selectedCard, selectedSecret, currentStep, logs, game } =
    state;

  const pendingAction = currentPlayer?.pending_action;

  const isForcedToAct = useMemo(() => {
    // Es "acción forzada" si NO es mi turno Y tengo una acción pendiente
    return !isMyTurn && pendingAction === "REVEAL_SECRET";
  }, [isMyTurn, pendingAction]);

  const isForcedToTrade = useMemo(() => {
    // Es "trade forzado" si tengo cualquiera de estas acciones pendientes
    return (
      pendingAction === "SELECT_TRADE_CARD" ||
      pendingAction === "WAITING_FOR_TRADE_PARTNER"
    );
  }, [pendingAction]);

  const isForcedToVote = useMemo(() => {
    return (
      pendingAction === "VOTE" || pendingAction === "WAITING_VOTING_TO_END"
    );
  }, [pendingAction]);

  const showNotSoFastPrompt = useMemo(() => {
    const isDiscardStep =
      currentStep === "discard_op" || currentStep === "discard_skip";

    // 2. El prompt SÓLO se muestra si la carta es NSF Y NO estamos descartando
    return (
      selectedCard !== null &&
      selectedCard.name === "Not so fast" &&
      !isDiscardStep
    );
  }, [selectedCard, currentStep]);

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!game?.game_id) return;

    const fetchLogs = () => {
      console.log("Actualizando logs...");
      logService
        .getLogs(game.game_id)
        .then((newLogs) => {
          dispatch({ type: "SET_LOGS", payload: newLogs });
        })
        .catch((err) => console.error("Error al recargar logs:", err));
    };

    fetchLogs();
  }, [game?.current_turn, state.lastCancelableEvent, game?.game_id, dispatch]);

  return (
    <div className="game-log-panel-container">
      <div className="log-window">
        <h3>Registro de la Partida</h3>
        <div className="log-list">
          {logs.length === 0 ? (
            <p className="log-message">Aún no hay acciones en el registro.</p>
          ) : (
            logs.map((log) => <LogMessage key={log.log_id} log={log} />)
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      <div className="action-window">
        {showNotSoFastPrompt && (
          <div className="turn-actions-container">
            <div className="action-step-container">
              <TextType text={["¿Jugar 'Not So Fast!'?"]} typingSpeed={35} />
              <div className="action-buttons-group">
                <button
                  className="action-button" // Puedes darle un estilo especial
                  onClick={async () => {
                    if (!selectedCard) return;
                    try {
                      // 1. Llamamos al nuevo servicio
                      console.log("PLAY NOT SO FAST");
                      await logService.registerCancelableEvent(
                        selectedCard.card_id
                      );
                      // 2. Limpiamos la selección
                      dispatch({ type: "SET_SELECTED_CARD", payload: null });

                      // (El WebSocket se encargará de refrescar el estado)
                    } catch (err) {
                      console.error("Error al jugar Not So Fast:", err);
                      alert("No se puede jugar esta carta ahora.");
                    }
                  }}
                >
                  Confirmar
                </button>
                <button
                  className="action-button secondary" // (Necesitarás un estilo para "secondary")
                  onClick={() => {
                    // Simplemente deselecciona la carta
                    dispatch({ type: "SET_SELECTED_CARD", payload: null });
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {isForcedToAct && (
          <div className="turn-actions-container">
            <div className="action-step-container">
              <TextType
                text={[
                  "Te han seleccionado. Debes revelar uno de tus secretos.",
                ]}
                typingSpeed={35}
              />
              <div className="ac  // 2. Lógica para el auto-scroll del logtion-buttons-group">
                <button
                  className="action-button"
                  onClick={async () => {
                    if (!selectedSecret) {
                      alert("Por favor, selecciona un secreto para revelar.");
                      return;
                    }
                    if (selectedSecret.revelated) {
                      alert(
                        "Ese secreto ya está revelado. Debes elegir uno oculto."
                      );
                      return;
                    }
                    try {
                      await secretService.revealSecret(
                        selectedSecret.secret_id
                      );
                      await playerService.unselectPlayer(myPlayerId);
                      dispatch({
                        type: "SET_SELECTED_SECRET",
                        payload: null,
                      });
                    } catch (err) {
                      console.error("Error al revelar secreto forzado:", err);
                      alert("Error al revelar secreto.");
                    }
                  }}
                  disabled={!selectedSecret || selectedSecret.revelated}
                >
                  Revelar Secreto
                </button>
              </div>
            </div>
          </div>
        )}

        {isForcedToTrade && (
          <div className="turn-actions-container">
            <div className="action-step-container">
              <TextType
                text={
                  pendingAction === "SELECT_TRADE_CARD"
                    ? ["¡Intercambio! Selecciona una carta de tu mano..."]
                    : ["Carta seleccionada. Esperando al otro jugador..."]
                }
                typingSpeed={35}
              />
              <div className="action-buttons-group">
                <button
                  className="action-button"
                  onClick={async () => {
                    if (!selectedCard || !myPlayerId) return;
                    try {
                      await eventService.cardTrade(
                        myPlayerId,
                        selectedCard.card_id
                      );
                      dispatch({ type: "SET_SELECTED_CARD", payload: null });
                    } catch (err) {
                      console.error(
                        "Error al seleccionar carta para trade:",
                        err
                      );
                      alert("Error al seleccionar carta.");
                    }
                  }}
                  disabled={
                    !selectedCard ||
                    pendingAction === "WAITING_FOR_TRADE_PARTNER"
                  }
                >
                  {pendingAction === "WAITING_FOR_TRADE_PARTNER"
                    ? "Esperando..."
                    : "Confirmar Carta"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isForcedToVote && (
          <div className="turn-actions-container">
            <VoteStep />
          </div>
        )}

        {isMyTurn && (
          <div className="turn-actions-container">
            <TurnActions />
          </div>
        )}
      </div>
    </div>
  );
};
