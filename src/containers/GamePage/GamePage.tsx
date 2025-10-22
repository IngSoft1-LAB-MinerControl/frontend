import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GamePage.css";
import type {
  PlayerResponse,
  PlayerStateResponse,
} from "../../services/playerService";
import { httpServerUrl } from "../../services/config"; // Importar la URL base

import TurnActions from "./TurnActions";
import Opponent from "../../components/Opponent";
import Decks from "../../components/Decks";
import You from "../../components/MyHand";
import type { GameResponse } from "../../services/gameService";
import type { CardResponse } from "../../services/cardService";
import DraftPile from "../../components/DraftPile";
import type { SetResponse } from "../../services/setService";
import type { Steps } from "./TurnActions";
import type { SecretResponse } from "../../services/secretService";

export default function GamePage() {
  const location = useLocation();
  const navigate = useNavigate(); // Agregamos navigate para futuras redirecciones

  const { game, player } = location.state ?? {};

  const [players, setPlayers] = useState<PlayerStateResponse[]>([]);
  const [currentGame, setCurrentGame] = useState<GameResponse>(game);
  //const [lastDiscarded, setLastDiscarded] = useState<CardResponse | null>(null);
  const [discardedCards, setDiscardedCards] = useState<CardResponse[]>([]);
  const [error, setError] = useState("");
  const [endMessage, setEndMessage] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [draftPile, setDraftPile] = useState<CardResponse[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardResponse | null>(null);
  const [selectedSet, setSelectedSet] = useState<SetResponse | null>(null);
  const [selectedSecret, setSelectedSecret] = useState<SecretResponse | null>(
    null
  );
  const [selectedTargetPlayer, setSelectedTargetPlayer] =
    useState<PlayerStateResponse | null>(null);

  const [turnActionStep, setTurnActionStep] = useState<Steps>("start");

  if (!game) {
    return (
      <div className="game-page">
        <div className="inline-error">
          Falta el contexto de la partida. Volvé al lobby e ingresá nuevamente.
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!game?.game_id) return;

    // Construimos la URL del WebSocket para esta partida específica
    const wsURL = `${httpServerUrl.replace("http", "ws")}/ws/game/${
      game.game_id
    }`;
    const ws = new WebSocket(wsURL);

    ws.onopen = () => {
      console.log(`Conectado al WebSocket de la partida: ${wsURL}`);
      setError("");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("MSJ WS", message);

        const dataContent =
          typeof message.data === "string"
            ? JSON.parse(message.data)
            : message.data;

        switch (message.type) {
          case "playersState":
            setPlayers(dataContent);
            break;

          case "gameUpdated":
            setCurrentGame(dataContent);

            break;

          case "droppedCards":
            console.log("SE RECIBIERON LAS CARTAS DESCARTADAS", dataContent);
            setDiscardedCards(dataContent);
            break;

          case "draftCards":
            setDraftPile(dataContent);
            console.log("SE RECIBIERON LAS CARTAS DEL DRAFT", dataContent);
            break;

          default:
            console.log("Mensaje WS recibido sin tipo conocido:", message);
        }
      } catch (err) {
        console.error("Error procesando mensaje WS:", err);
      }
    };

    ws.onerror = (event) => {
      console.error("Error en WebSocket:", event);
      setError(
        "Error en la conexión en tiempo real. Intenta recargar la página."
      );
    };

    ws.onclose = () => {
      console.log("Conexión WebSocket de la partida cerrada.");
    };

    // cerramos la conexión cuando el componente se desmonta
    return () => {
      ws.close();
    };
  }, [game.game_id, navigate]); // Dependemos solo de game.game_id para no reconectar innecesariamente

  useEffect(() => {
    if (!currentGame || players.length === 0) return;

    if (currentGame.status === "finished") {
      const currentPlayerState = players.find(
        (p) => p.player_id === player.player_id
      );

      if (!currentPlayerState) {
        setEndMessage("Perdiste. El asesino ganó la partida."); // menasje de "Error" generico por si falla
        return;
      }

      const hasMurderSecret = currentPlayerState.secrets.some(
        (s) => s.murderer
      );
      const hasAccompliceSecret = currentPlayerState.secrets.some(
        (s) => s.accomplice
      );

      if (currentGame.cards_left === 0) {
        setEndMessage(
          hasMurderSecret || hasAccompliceSecret
            ? "¡Ganaste!"
            : "Perdiste. El asesino ganó la partida."
        );
      } else {
        setEndMessage(
          hasMurderSecret || hasAccompliceSecret
            ? "¡Perdiste! !Te descubrieron!"
            : "!Ganaste! !Descubriste al asesino!"
        );
      }
      setIsGameOver(true);
    }
  }, [currentGame, players, player.player_id]);

  const currentPlayer = players.find((p) => p.player_id === player.player_id);
  const cardCount = currentPlayer ? currentPlayer.cards.length : 0;

  const handleSetSelect = (set: SetResponse | undefined) => {
    if (selectedSet && set && selectedSet.set_id === set.set_id) {
      setSelectedSet(null);
    } else {
      setSelectedSet(set ?? null);
    }
  };

  const handleHandCardSelect = (card: CardResponse) => {
    // seleccion multiple si es set o descarte
    if (
      turnActionStep === "p_set" ||
      turnActionStep === "discard_op" ||
      turnActionStep === "discard_skip"
    ) {
      setSelectedCard(null); // Deseleccionar cualquier carta individualmente seleccionada previamente

      setSelectedCardIds((prevIds) => {
        const id = card.card_id;
        if (prevIds.includes(id)) {
          // Deseleccionar
          return prevIds.filter((cid) => cid !== id);
        } else {
          // Seleccionar
          return [...prevIds, id];
        }
      });
    }

    // seleccion unica si es jugar evento
    else if (turnActionStep === "p_event") {
      setSelectedCardIds([]); // Limpiar multiselección
      // Si la carta ya está seleccionada, la deseleccionamos (ponemos null).
      // Si no, la seleccionamos.
      setSelectedCard((prev) => (prev?.card_id === card.card_id ? null : card));
    }
  };

  const handleSecretSelect = (secret: SecretResponse | undefined) => {
    if (
      selectedSecret &&
      secret &&
      selectedSecret.secret_id === secret.secret_id
    ) {
      setSelectedSet(null);
    } else {
      setSelectedSecret(secret ?? null);
    }
  };

  const handleSelectPlayer = (targetPlayer: PlayerStateResponse) => {
    if (selectedTargetPlayer?.player_id === targetPlayer.player_id) {
      setSelectedTargetPlayer(null);
    } else {
      setSelectedTargetPlayer(targetPlayer);
    }
    console.log("Jugador seleccionado:", targetPlayer);
  };

  useEffect(() => {
    console.log("Paso de Acción:", turnActionStep);

    if (selectedCardIds.length > 0) {
      console.log("Selección Múltiple (IDs):", selectedCardIds);
    }

    if (selectedCard) {
      console.log(
        "Selección Única (Draft/Evento):",
        selectedCard.name,
        `(ID: ${selectedCard.card_id})`
      );
    }

    if (selectedCardIds.length === 0 && !selectedCard) {
      console.log("No hay cartas seleccionadas.");
    }
    console.log("---");
  }, [selectedCardIds, selectedCard, turnActionStep]);

  const handleDraftSelect = (card: CardResponse) => {
    // Si el jugador hace clic en la misma carta, se deselecciona. Si no, se selecciona.
    setSelectedCard((prev) => (prev === card ? null : card));
  };

  const isMyTurn = useMemo(() => {
    if (
      !currentGame ||
      !currentPlayer ||
      currentPlayer.turn_order === undefined ||
      currentGame.current_turn === undefined
    ) {
      return false;
    }
    return currentPlayer.turn_order === currentGame.current_turn;
  }, [currentGame, currentPlayer]);

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

  const handleTurnUpdated = useCallback((updatedGame: GameResponse | null) => {
    if (updatedGame) {
      setCurrentGame(updatedGame);
    }
  }, []);

  useEffect(() => {
    // Si no es mi turno, aseguramos que las acciones no se muestren
    if (!isMyTurn) {
      setTurnActionStep("start"); // Reiniciar el estado de acciones
      return;
    }
  }, [isMyTurn, turnActionStep]);

  if (isGameOver) {
    return (
      <div className="game-page end-screen">
        <h1>{endMessage}</h1>
      </div>
    );
  }

  return (
    <div className="game-page">
      <main className="table-grid">
        <section className="area-top">
          <div className="opponents-row">
            {distribution.opponents.map((p) => (
              <Opponent
                key={p.player_id}
                player={p}
                isMyTurn={p.turn_order === currentGame?.current_turn}
                onSetClick={handleSetSelect}
                selectedSet={selectedSet}
                isSetSelectionStep={turnActionStep === "another_victim"}
                onSecretClick={handleSecretSelect}
                selectedSecret={selectedSecret}
                isSecretSelectionStep={
                  turnActionStep === "reveal_secret" ||
                  turnActionStep === "hide_secret" ||
                  turnActionStep === "and_then_there_was_one_more"
                }
                onClick={() => {
                  if (
                    turnActionStep === "cards_off_the_table" ||
                    turnActionStep === "select_player" ||
                    turnActionStep === "and_then_there_was_one_more"
                  ) {
                    handleSelectPlayer(p);
                  }
                }}
                selectable={
                  turnActionStep === "cards_off_the_table" ||
                  turnActionStep === "select_player" ||
                  turnActionStep === "and_then_there_was_one_more"
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
            cardsLeftCount={currentGame?.cards_left ?? null}
            discardedCards={discardedCards}
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
                turnActionStep === "reveal_secret" ||
                turnActionStep === "hide_secret"
              }
            />
          ) : (
            <div className="empty-hint">Esperando jugadores…</div>
          )}
          {isMyTurn && (
            <div className="turn-actions-container">
              <TurnActions
                gameId={currentGame.game_id}
                playerId={player.player_id}
                players={players}
                onTurnUpdated={handleTurnUpdated}
                selectedCardIds={selectedCardIds}
                setSelectedCardIds={setSelectedCardIds}
                step={turnActionStep}
                setStep={setTurnActionStep}
                cardCount={cardCount}
                selectedCard={selectedCard}
                setSelectedCard={setSelectedCard}
                discardedCards={discardedCards}
                selectedSet={selectedSet}
                selectedSecret={selectedSecret}
                setSelectedSecret={setSelectedSecret}
                selectedTargetPlayer={selectedTargetPlayer}
                setSelectedTargetPlayer={setSelectedTargetPlayer}
              />
            </div>
          )}
          <p>{endMessage}</p>
        </section>
      </main>
    </div>
  );
}
