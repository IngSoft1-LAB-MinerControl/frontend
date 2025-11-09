import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./GamePage.css"; // Sigue usando los mismos estilos
import type { PlayerStateResponse } from "../../services/playerService";

import TurnActions from "./TurnActions";
import Opponent from "../../components/Opponent";
import Decks from "../../components/Decks";
import You from "../../components/MyHand";
import type { CardResponse } from "../../services/cardService";
import DraftPile from "../../components/DraftPile";
import type { SetResponse } from "../../services/setService";
import type { Steps } from "./TurnActionsTypes";
import type { SecretResponse } from "../../services/secretService";
import secretService from "../../services/secretService";
import playerService from "../../services/playerService";
import TextType from "../../components/TextType";
import destinations from "../../navigation/destinations";
import Chat from "../../components/Chat";

import { useGameContext } from "../../context/GameContext";
import { useGameWebSocket } from "../../hooks/useGameWebSocket"; // 1. Importamos el nuevo hook
import eventService from "../../services/eventService";

export default function Gameboard() {
  const navigate = useNavigate();

  // Obtenemos todo del contexto
  const { state, dispatch, currentPlayer, isMyTurn, isSocialDisgrace } =
    useGameContext();

  const isWaitingOnFirstRender = useRef(true);

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

  useEffect(() => {
    if (!isMyTurn) {
      dispatch({ type: "SET_STEP", payload: "start" });
    }
  }, [isMyTurn, dispatch]);

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

  const pendingAction = currentPlayer?.pending_action;

  const isForcedToAct = useMemo(() => {
    return !isMyTurn && pendingAction === "REVEAL_SECRET";
  }, [isMyTurn, pendingAction]);

  const isForcedToTrade = useMemo(() => {
    return (
      pendingAction === "SELECT_TRADE_CARD" ||
      pendingAction === "WAITING_FOR_TRADE_PARTNER"
    );
  }, [pendingAction]);

  useEffect(() => {
    if (currentStep === "wait_trade") {
      if (pendingAction === null || pendingAction === undefined) {
        console.log("Trade completado. Avanzando a 'discard_op'.");
        dispatch({ type: "SET_STEP", payload: "discard_op" });
        isWaitingOnFirstRender.current = true; // Resetea para la próxima
      }
    }
  }, [isMyTurn, currentStep, pendingAction, dispatch]);

  const handleSetSelect = (set: SetResponse | undefined) => {
    const newSet =
      selectedSet && set && selectedSet.set_id === set.set_id
        ? null
        : set ?? null;
    dispatch({ type: "SET_SELECTED_SET", payload: newSet });
  };

  const handleHandCardSelect = (card: CardResponse) => {
    if (pendingAction === "SELECT_TRADE_CARD") {
      const newCard = selectedCard?.card_id === card.card_id ? null : card;
      dispatch({ type: "SET_SELECTED_CARD", payload: newCard });
      return;
    }
    // if (pendingAction === "WAITING_FOR_TRADE_PARTNER") {
    //   return;
    // }
    if (
      currentStep === "p_set" ||
      currentStep === "discard_op" ||
      currentStep === "discard_skip"
    ) {
      dispatch({ type: "TOGGLE_HAND_CARD_ID", payload: card.card_id });
    } else if (currentStep === "p_event" || currentStep === "add_detective") {
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
      "card_trade",
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

  console.log("RENDERIZANDO Gameboard. Step:", currentStep);
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
                  currentStep === "sel_player_reveal" ||
                  currentStep === "card_trade"
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
              onSetClick={handleSetSelect}
              selectedSet={selectedSet}
              isSetSelectionStep={currentStep === "add_detective"}
            />
          ) : (
            <div className="empty-hint">Esperando jugadores…</div>
          )}

          {isMyTurn && (
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
                        // ¡Llamamos al endpoint que resuelve el deadlock!
                        await eventService.cardTrade(
                          myPlayerId,
                          selectedCard.card_id
                        );

                        // El backend pondrá la acción en 'WAITING' o la completará.
                        // El WebSocket refrescará el estado.
                        // Limpiamos la selección local.
                        dispatch({ type: "SET_SELECTED_CARD", payload: null });
                      } catch (err) {
                        console.error(
                          "Error al seleccionar carta para trade:",
                          err
                        );
                        alert("Error al seleccionar carta.");
                      }
                    }}
                    // Deshabilitado si no hay carta o si ya esperamos
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
        </section>
      </main>
      <Chat />
    </div>
  );
}
