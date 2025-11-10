import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./GamePage.css"; // Sigue usando los mismos estilos
import type { PlayerStateResponse } from "../../services/playerService";

import Opponent from "../../components/Opponent";
import Decks from "../../components/Decks";
import You from "../../components/MyHand";
import type { CardResponse } from "../../services/cardService";
import DraftPile from "../../components/DraftPile";
import type { SetResponse } from "../../services/setService";
import type { Steps } from "./TurnActionsTypes";
import type { SecretResponse } from "../../services/secretService";
import destinations from "../../navigation/destinations";

import { useGameContext } from "../../context/GameContext";
import { useGameWebSocket } from "../../hooks/useGameWebSocket"; // 1. Importamos el nuevo hook
import { GameLogPanel } from "../../components/GameLogPanel";

export default function Gameboard() {
  const navigate = useNavigate();

  // Obtenemos todo del contexto
  const { state, dispatch, currentPlayer, isMyTurn, isSocialDisgrace } =
    useGameContext();

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
    // Tu lógica actual para 'revelar secreto' (¡perfecta!)
    return !isMyTurn && pendingAction === "REVEAL_SECRET";
  }, [isMyTurn, pendingAction]);

  // const isForcedToVote = useMemo(() => {
  //   return (
  //     pendingAction === "VOTE" || pendingAction === "WAITING_VOTING_TO_END"
  //   );
  // }, [pendingAction]);

  // const isForcedToTrade = useMemo(() => {
  //   return (
  //     pendingAction === "SELECT_TRADE_CARD" ||
  //     pendingAction === "WAITING_FOR_TRADE_PARTNER"
  //   );
  // }, [pendingAction]);

  const handleSetSelect = (set: SetResponse | undefined) => {
    const newSet =
      selectedSet && set && selectedSet.set_id === set.set_id
        ? null
        : set ?? null;
    dispatch({ type: "SET_SELECTED_SET", payload: newSet });
  };

  const handleHandCardSelect = (card: CardResponse) => {
    const isDiscardStep =
      currentStep === "discard_op" || currentStep === "discard_skip";

    if (pendingAction === "SELECT_TRADE_CARD") {
      const newCard = selectedCard?.card_id === card.card_id ? null : card;
      dispatch({ type: "SET_SELECTED_CARD", payload: newCard });
      return;
    }
    if (pendingAction === "SELECT_FOLLY_CARD") {
      const newCard = selectedCard?.card_id === card.card_id ? null : card;
      dispatch({ type: "SET_SELECTED_CARD", payload: newCard });
      return;
    }

    if (card.name === "Not so fast" && !isDiscardStep) {
      // Si ya estaba seleccionada, la deselecciona. Si no, la selecciona.
      const newCard = selectedCard?.card_id === card.card_id ? null : card;
      dispatch({ type: "SET_SELECTED_CARD", payload: newCard });
      return; // Detenemos la ejecución aquí
    }

    if (isMyTurn) {
      if (currentStep === "p_set" || isDiscardStep) {
        dispatch({ type: "TOGGLE_HAND_CARD_ID", payload: card.card_id });
      } else if (currentStep === "p_event" || currentStep === "add_detective") {
        const newCard = selectedCard?.card_id === card.card_id ? null : card;
        dispatch({ type: "SET_SELECTED_CARD", payload: newCard });
      }
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

  console.log("RENDERIZANDO Gameboard. Step:", currentStep);
  return (
    <div className="game-page">
      {error && <div className="game-error-banner">{error}</div>}
      <div className="game-board-layout">
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
                    currentStep === "point_your_suspicions" ||
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
          </section>
        </main>

        <aside className="game-log-panel">
          <GameLogPanel />
        </aside>
      </div>
    </div>
  );
}
