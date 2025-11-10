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
import TextType from "../../components/TextType";
import destinations from "../../navigation/destinations";
import { VoteStep } from "./TurnSteps/VoteStep";

import { useGameContext } from "../../context/GameContext";
import { useGameWebSocket } from "../../hooks/useGameWebSocket"; // 1. Importamos el nuevo hook
import Secret from "../../components/Cards/Secret";
import eventService from "../../services/eventService";

interface BlackmailedModalProps {
  secret: SecretResponse;
  onClose: () => void;
  currentPlayerId: number;
  players: PlayerStateResponse[];
}

const BlackmailedModal: React.FC<BlackmailedModalProps> = ({
  secret,
  onClose,
  currentPlayerId,
  players,
}) => {
  const playerShowing = players.find((p) => p.player_id === secret.player_id);
  const playerTargeted = players.find(
    (p) =>
      p.player_id !== secret.player_id && p.pending_action === "BLACKMAILED"
  );

  let title = "Secreto por Chantaje";
  if (playerShowing && playerTargeted) {
    if (currentPlayerId === playerShowing.player_id) {
      title = `Le mostraste tu secreto a ${playerTargeted.name}:`;
    } else {
      title = `${playerShowing.name} te ha mostrado su secreto:`;
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <div className="modal-secret-container">
          <Secret
            secret_id={secret.secret_id}
            mine={secret.player_id === currentPlayerId}
            revealed={true}
            murderer={secret.murderer}
            accomplice={secret.accomplice}
            size="large"
            isSelected={false}
          />
        </div>
        <button className="action-button" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
};

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
    blackmailedSecret,
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
    // Tu lógica actual para 'revelar secreto' (¡perfecta!)
    return !isMyTurn && pendingAction === "REVEAL_SECRET";
  }, [isMyTurn, pendingAction]);

  const isForcedToVote = useMemo(() => {
    return (
      pendingAction === "VOTE" || pendingAction === "WAITING_VOTING_TO_END"
    );
  }, [pendingAction]);

  useEffect(() => {
    if (isMyTurn && currentStep === "wait_voting_to_end") {
      if (pendingAction === "Clense" /*|| pendingAction === undefined*/) {
        console.log(
          "Transición exitosa: Revelación de secreto completada. Avanzando a 'discard_op'."
        );
        dispatch({ type: "SET_STEP", payload: "discard_op" });
      }
    }
  }, [isMyTurn, currentStep, pendingAction, dispatch]);

  const isForcedToTrade = useMemo(() => {
    return (
      pendingAction === "SELECT_TRADE_CARD" ||
      pendingAction === "WAITING_FOR_TRADE_PARTNER"
    );
  }, [pendingAction]);

  const isForcedToTradeFolly = useMemo(() => {
    return (
      pendingAction === "SELECT_FOLLY_CARD" ||
      pendingAction === "WAITING_FOR_FOLLY_TRADE"
    );
  }, [pendingAction]);

  const isForcedToChooseBlackmailed = useMemo(() => {
    return pendingAction === "CHOOSE_BLACKMAIL_SECRET";
  }, [pendingAction]);

  const blackmailedTargetPlayer = useMemo(() => {
    if (!isForcedToChooseBlackmailed) return null;
    return players.find((p) => p.pending_action === "WAITING_FOR_BLACKMAIL");
  }, [players, isForcedToChooseBlackmailed]);

  useEffect(() => {
    if (currentStep === "wait_trade" || currentStep === "wait_trade_folly") {
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
    if (
      pendingAction === "SELECT_TRADE_CARD" ||
      pendingAction === "SELECT_FOLLY_CARD"
    ) {
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
      "point_your_suspicions",
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

  // Devuelve el jugador que recibe la carta de myPlayerId según la dirección
  const getFollyTarget = () => {
    if (!players.length || !myPlayerId) return null;

    // Ordenamos por turno
    const ordered = [...players].sort(
      (a, b) => (a.turn_order ?? 0) - (b.turn_order ?? 0)
    );

    // Encontramos el índice del jugador actual
    const index = ordered.findIndex((p) => p.player_id === myPlayerId);
    if (index === -1) return null;

    let targetIndex;
    if (state.directionFolly === "right") {
      // pasa a la derecha → siguiente jugador en la lista
      targetIndex = (index + 1) % ordered.length;
    } else {
      // pasa a la izquierda → jugador anterior
      targetIndex = (index - 1 + ordered.length) % ordered.length;
    }

    return ordered[targetIndex];
  };

  const handleCloseBlackmailedModal = async () => {
    if (!currentPlayer) return;
    if (!blackmailedSecret) return;

    const playerShowingId = blackmailedSecret.player_id;
    const playerTargeted = players.find(
      (p) =>
        p.player_id !== playerShowingId && p.pending_action === "BLACKMAILED"
    );

    if (playerTargeted && playerShowingId != null) {
      try {
        await eventService.deactivateBlackmailed(
          playerShowingId,
          playerTargeted.player_id
        );
        console.log("Blackmail modal cerrado, pending_action reseteado.");
      } catch (err) {
        console.error("Error al desactivar blackmail:", err);
      }
    } else if (!playerShowingId) {
      console.warn(
        "No se pudo desactivar blackmail: playerShowingId indefinido."
      );
    }

    dispatch({ type: "SET_BLACKMAILED_SECRET", payload: null });
  };

  console.log("RENDERIZANDO Gameboard. Step:", currentStep);
  return (
    <div className="game-page">
      {error && <div className="game-error-banner">{error}</div>}
      {blackmailedSecret && currentPlayer && (
        <BlackmailedModal
          secret={blackmailedSecret}
          onClose={handleCloseBlackmailedModal}
          currentPlayerId={currentPlayer.player_id}
          players={players}
        />
      )}
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
                selectable={[
                  "cards_off_the_table",
                  "and_then_there_was_one_more",
                  "sel_player_reveal",
                  "point_your_suspicions",
                  "card_trade",
                ].includes(currentStep)}
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
                [
                  "sel_reveal_secret",
                  "sel_hide_secret",
                  "and_then_there_was_one_more",
                ].includes(currentStep) ||
                isForcedToAct ||
                isForcedToChooseBlackmailed
              }
              onClick={() => {
                if (
                  currentStep === "and_then_there_was_one_more" &&
                  distribution.bottom
                ) {
                  handleSelectPlayer(distribution.bottom);
                }
              }}
              selectable={
                currentStep === "and_then_there_was_one_more" ||
                currentStep === "point_your_suspicions"
              }
              isSelected={selectedTargetPlayer?.player_id === myPlayerId}
              isSocialDisgrace={isSocialDisgrace}
              onSetClick={handleSetSelect}
              selectedSet={selectedSet}
              isSetSelectionStep={currentStep === "add_detective"}
            />
          ) : (
            <div className="empty-hint">Esperando jugadores…</div>
          )}
          {(isMyTurn || currentStep === "point_your_suspicions") && ( // Inclusión para todos
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
                        // await playerService.unselectPlayer(myPlayerId);

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

          {isForcedToVote && (
            <div className="turn-actions-container">
              <VoteStep />
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
          {isForcedToTradeFolly && (
            <div className="turn-actions-container">
              <div className="action-step-container">
                <TextType
                  text={
                    pendingAction === "SELECT_TRADE_CARD_FOLLY"
                      ? ["¡Intercambio! Selecciona una carta de tu mano..."]
                      : ["Carta seleccionada. Esperando jugadores..."]
                  }
                  typingSpeed={35}
                />
                <div className="action-buttons-group">
                  <button
                    className="action-button"
                    onClick={async () => {
                      if (!selectedCard || !myPlayerId) return;
                      const targetPlayer = getFollyTarget();
                      if (!targetPlayer) {
                        alert("No se pudo determinar el jugador destino.");
                        return;
                      }

                      try {
                        await eventService.follyTrade(
                          myPlayerId,
                          targetPlayer.player_id,
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
                    // Deshabilitado si no hay carta o si ya esperamos
                    disabled={
                      !selectedCard ||
                      pendingAction === "WAITING_FOR_FOLLY_TRADE"
                    }
                  >
                    {pendingAction === "WAITING_FOR_FOLLY_TRADE"
                      ? "Esperando..."
                      : "Confirmar Carta"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {isForcedToChooseBlackmailed && blackmailedTargetPlayer && (
            <div className="turn-actions-container">
              <div className="action-step-container">
                <TextType
                  text={[
                    `¡Te han chantajeado! Debes elegir uno de TUS secretos para mostrarle a ${blackmailedTargetPlayer.name}.`,
                  ]}
                  typingSpeed={35}
                />
                <div className="action-buttons-group">
                  <button
                    className="action-button"
                    onClick={async () => {
                      if (!selectedSecret) {
                        alert("Por favor, selecciona un secreto para mostrar.");
                        return;
                      }
                      if (selectedSecret.revelated) {
                        alert(
                          "Ese secreto ya está revelado. Debes elegir uno oculto."
                        );
                        return;
                      }
                      if (!currentPlayer) return;

                      try {
                        // ¡Llamamos al endpoint que borramos y volvimos a añadir!
                        await eventService.activateBlackmailed(
                          currentPlayer.player_id,
                          blackmailedTargetPlayer.player_id,
                          selectedSecret.secret_id
                        );

                        // El backend se encargará del broadcast
                        // El WebSocket recibirá el 'blackmailed' y mostrará el modal

                        dispatch({
                          type: "SET_SELECTED_SECRET",
                          payload: null,
                        });
                      } catch (err) {
                        console.error("Error al activar chantaje:", err);
                        alert("Error al activar el chantaje.");
                      }
                    }}
                    disabled={!selectedSecret || selectedSecret.revelated}
                  >
                    Mostrar Secreto
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
