import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./GamePage.css"; // Sigue usando los mismos estilos
import type { PlayerStateResponse } from "../../services/playerService";
// Ya no importamos 'httpServerUrl' aquí, el hook se encarga
// import { httpServerUrl } from "../../services/config";

import TurnActions from "./TurnActions";
import Opponent from "../../components/Opponent";
import Decks from "../../components/Decks";
import You from "../../components/MyHand";
import type { GameResponse } from "../../services/gameService";
import type { CardResponse } from "../../services/cardService";
import DraftPile from "../../components/DraftPile";
import type { SetResponse } from "../../services/setService";
import type { Steps } from "./TurnActionsTypes";
import type { SecretResponse } from "../../services/secretService";
import secretService from "../../services/secretService";
import playerService from "../../services/playerService";
import TextType from "../../components/TextType";
import destinations from "../../navigation/destinations";

// --- ¡Imports Clave! ---
import { useGameContext } from "../../context/GameContext";
import { useGameWebSocket } from "../../hooks/useGameWebSocket"; // 1. Importamos el nuevo hook

// Este componente CONTIENE la lógica que antes estaba en GamePage
export default function Gameboard() {
  const navigate = useNavigate();

  // Obtenemos todo del contexto
  const { state, dispatch, currentPlayer, isMyTurn, isSocialDisgrace } =
    useGameContext();

  // Desestructuramos el 'state' para un acceso más fácil en el JSX
  const {
    game,
    players,
    discardPile,
    draftPile,
    currentStep,
    selectedCard,
    selectedCardIds,
    selectedSecret,
    selectedSet,
    selectedTargetPlayer,
    myPlayerId,
    error,
  } = state;

  // 2. ¡Lógica de WebSocket reemplazada por una sola línea!
  // El hook se encarga automáticamente de conectarse y
  // actualizar el 'GameContext' a través de 'dispatch'.
  useGameWebSocket(game?.game_id);

  // 3. El useEffect del WebSocket (de 50 líneas) se ELIMINÓ de aquí.

  // 4. El useEffect de navegación (se mantiene igual)
  useEffect(() => {
    if (game.status === "finished") {
      navigate(destinations.endGame, {
        replace: true,
        state: {
          players: players,
          game: game,
          myPlayerId: myPlayerId,
        },
      });
    }
  }, [game, players, myPlayerId, navigate]);

  // 5. El useEffect que resetea el step si no es tu turno (se mantiene igual)
  useEffect(() => {
    if (!isMyTurn) {
      dispatch({ type: "SET_STEP", payload: "start" });
    }
  }, [isMyTurn, dispatch]);

  // --- Lógica de UI y Valores Calculados (se mantienen igual) ---

  const cardCount = currentPlayer ? currentPlayer.cards.length : 0;

  const distribution = useMemo(() => {
    if (!players.length)
      return {
        bottom: null as PlayerStateResponse | null,
        opponents: [] as PlayerStateResponse[],
      };

    const me = currentPlayer ?? players[0];
    const opponents = players.filter((p) => p !== me);

    return { bottom: me, opponents };
  }, [players, currentPlayer]);

  const isForcedToAct = useMemo(() => {
    return !isMyTurn && (currentPlayer?.isSelected ?? false);
  }, [isMyTurn, currentPlayer]);

  const pysWinner = useMemo(() => {
    return players.find((p) => p.isSelected === true) || null;
  }, [players]);

  // --- 6. Handlers de UI ---
  // (se mantienen igual, despachan acciones al reducer)

  const handleSetSelect = (set: SetResponse | undefined) => {
    const newSet =
      selectedSet && set && selectedSet.set_id === set.set_id
        ? null
        : set ?? null;
    dispatch({ type: "SET_SELECTED_SET", payload: newSet });
  };

  const handleHandCardSelect = (card: CardResponse) => {
    if (
      currentStep === "p_set" ||
      currentStep === "discard_op" ||
      currentStep === "discard_skip"
    ) {
      dispatch({ type: "TOGGLE_HAND_CARD_ID", payload: card.card_id });
    } else if (currentStep === "p_event") {
      const newCard = selectedCard?.card_id === card.card_id ? null : card;
      dispatch({ type: "SET_SELECTED_CARD", payload: newCard });
    }
  };

  const handleSecretSelect = (secret: SecretResponse | undefined) => {
    const newSecret =
      selectedSecret && secret && selectedSecret.secret_id === secret.secret_id
        ? null
        : secret ?? null;
    dispatch({ type: "SET_SELECTED_SECRET", payload: newSecret });
  };

  const handleSelectPlayer = (targetPlayer: PlayerStateResponse) => {
    const selectableSteps: Steps[] = [
      "cards_off_the_table",
      "and_then_there_was_one_more",
      "sel_player_reveal",
    ];

    if (selectableSteps.includes(currentStep)) {
      const newTarget =
        selectedTargetPlayer?.player_id === targetPlayer.player_id
          ? null
          : targetPlayer;
      dispatch({ type: "SET_SELECTED_TARGET_PLAYER", payload: newTarget });
    } else {
      console.log("No es un paso válido para seleccionar jugador.");
    }
  };

  const handleDraftSelect = (card: CardResponse) => {
    const newCard = selectedCard === card ? null : card;
    dispatch({ type: "SET_SELECTED_CARD", payload: newCard });
  };

  // Gameboard.tsx - Nuevo useEffect de Transición PYS

  useEffect(() => {
    const winner = pysWinner;
    const isPlayerWhoPlayedCard = myPlayerId === game.current_turn;

    // 1. GUARDA: Solo actuamos si hay un ganador (marcado con isSelected=true)
    if (!winner || currentStep !== "point_your_suspicions") {
      return;
    }

    // --- TRANSICIÓN POST-VOTACIÓN PYS ---

    // A. Si SOY el jugador de turno (quien jugó PYS)
    if (isPlayerWhoPlayedCard) {
      if (winner.player_id === myPlayerId) {
        // Gané el PYS: Paso a revelar mi secreto
        dispatch({ type: "SET_STEP", payload: "sel_reveal_secret" });
      } else {
        // Perdí el PYS: Paso a esperar que el ganador revele
        dispatch({ type: "SET_STEP", payload: "wait_reveal_secret" });
      }

      // CRÍTICO: Limpiamos la bandera de voto de sessionStorage para todos (backend ya limpió el isSelected)
      sessionStorage.removeItem(`voted_${myPlayerId}`);

      // No necesitamos `return` explícito si estamos seguros de que el cambio de step es la acción final
    }

    // B. Si SOY el ganador, pero NO SOY el de turno (Ganador Forzado)
    const isWinnerNotCurrentPlayer =
      winner.player_id === myPlayerId && !isPlayerWhoPlayedCard;

    if (isWinnerNotCurrentPlayer) {
      // Me fuerzo a revelar. El JSX ya mostrará la UI de forzado (isForcedToAct).
      // Sin embargo, para fines de paso interno, podríamos usar un paso específico
      // Pero dado que `isForcedToAct` ya maneja la UI, no necesitamos cambiar el step aquí,
      // simplemente dejamos que el JSX lo fuerce.

      // **Alternativa más limpia:** Forzar el step y limpiar `isForcedToAct`
      // dispatch({ type: "SET_STEP", payload: "sel_reveal_secret" });
      return;
    }

    // C. Jugador Neutral: El ganador fue determinado, vuelven a 'start'
    if (!isPlayerWhoPlayedCard && winner.player_id !== myPlayerId) {
      dispatch({ type: "SET_STEP", payload: "start" });
      sessionStorage.removeItem(`voted_${myPlayerId}`);
    }
  }, [
    pysWinner, // Trigger principal
    myPlayerId,
    game.current_turn,
    currentStep, // Dependencia para asegurar que solo se dispara desde la votación
    dispatch,
  ]);
  // --- 7. El RENDER (JSX) ---
  // (Exactamente igual que antes)

  return (
    <div className="game-page">
      {error && <div className="game-error-banner">{error}</div>}

      <main className="table-grid">
        <section className="area-top">
          <div className="opponents-row">
            {distribution.opponents.map((p) => (
              <Opponent
                key={p.player_id}
                player={p}
                isMyTurn={p.turn_order === game?.current_turn}
                onSetClick={handleSetSelect}
                selectedSet={selectedSet}
                isSetSelectionStep={currentStep === "another_victim"}
                onSecretClick={handleSecretSelect}
                selectedSecret={selectedSecret}
                isSecretSelectionStep={
                  currentStep === "and_then_there_was_one_more" ||
                  currentStep === "sel_reveal_secret" ||
                  currentStep === "sel_hide_secret"
                }
                onClick={() => handleSelectPlayer(p)}
                selectable={
                  currentStep === "cards_off_the_table" ||
                  currentStep === "and_then_there_was_one_more" ||
                  currentStep === "sel_player_reveal"
                }
                isSelected={selectedTargetPlayer?.player_id === p.player_id}
              />
            ))}
          </div>
        </section>

        <section className="area-center">
          <DraftPile
            cards={draftPile}
            selectedCard={selectedCard}
            onCardSelect={handleDraftSelect}
            isMyTurn={isMyTurn}
          />
          <Decks
            cardsLeftCount={game?.cards_left ?? null}
            discardedCards={discardPile}
          />
        </section>
        <section className="area-bottom">
          {distribution.bottom ? (
            <You
              player={distribution.bottom}
              selectedCardIds={selectedCardIds}
              onCardsSelected={handleHandCardSelect}
              isMyTurn={isMyTurn}
              selectedCard={selectedCard}
              onSecretClick={handleSecretSelect}
              selectedSecret={selectedSecret}
              isSecretSelectionStep={
                currentStep === "sel_reveal_secret" ||
                currentStep === "sel_hide_secret" ||
                currentStep === "and_then_there_was_one_more" ||
                isForcedToAct
              }
              onClick={() => {
                if (
                  currentStep === "and_then_there_was_one_more" &&
                  distribution.bottom
                ) {
                  handleSelectPlayer(distribution.bottom);
                }
              }}
              selectable={currentStep === "and_then_there_was_one_more"}
              isSelected={selectedTargetPlayer?.player_id === myPlayerId}
              isSocialDisgrace={isSocialDisgrace}
            />
          ) : (
            <div className="empty-hint">Esperando jugadores…</div>
          )}

          {((isMyTurn &&
            currentStep !== "wait_reveal_secret" && // Exclusión para el jugador de turno
            currentStep !== "sel_reveal_secret") ||
            currentStep === "point_your_suspicions") && ( // Inclusión para todos
            <div className="turn-actions-container">
              {/* TurnActions ya no recibe props, usa los hooks */}
              <TurnActions />
            </div>
          )}

          {/* Lógica de acción forzada (revelar secreto) */}
          {isForcedToAct && (
            <div className="turn-actions-container">
              <div className="action-step-container">
                <TextType
                  text={[
                    "Te han seleccionado. Debes revelar uno de tus secretos.",
                  ]}
                  typingSpeed={35}
                />
                <div className="action-buttons-group">
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

                        // Limpiamos el estado local usando dispatch
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
        </section>
      </main>
    </div>
  );
}
