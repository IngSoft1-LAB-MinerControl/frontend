import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GamePage.css";
import type { PlayerStateResponse } from "../../services/playerService";
import { httpServerUrl } from "../../services/config"; // Importar la URL base

import TurnActions from "./TurnActions";
import Opponent from "../../components/Opponent";
import Decks from "../../components/Decks";
import You from "../../components/MyHand";
import type { GameResponse } from "../../services/gameService";
import type { CardResponse } from "../../services/cardService";
import DraftPile from "../../components/DraftPile";

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

  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [turnActionStep, setTurnActionStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [draftPile, setDraftPile] = useState<CardResponse[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardResponse | null>(null);

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

    if (currentGame.cards_left === 0) {
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

      setEndMessage(
        hasMurderSecret || hasAccompliceSecret
          ? "¡Ganaste!"
          : "Perdiste. El asesino ganó la partida."
      );
    }
  }, [currentGame, players, player.player_id]);

  const currentPlayer = players.find((p) => p.player_id === player.player_id);
  const cardCount = currentPlayer ? currentPlayer.cards.length : 0;

  // ...
  const handleHandCardSelect = (card: CardResponse) => {
    // Si la acción actual es Jugar Set (step 1) o Descartar (step 3), usamos multiselección (selectedCardIds)
    if (turnActionStep === 1 || turnActionStep === 3) {
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

    // Si la acción actual es Jugar Evento (step 2), usamos selección única (selectedCard)
    else if (turnActionStep === 2) {
      setSelectedCardIds([]); // Limpiar multiselección
      // Si la carta ya está seleccionada, la deseleccionamos (ponemos null).
      // Si no, la seleccionamos.
      setSelectedCard((prev) => (prev?.card_id === card.card_id ? null : card));
    }
  };

  useEffect(() => {
    // -----------------------------------------------------
    // 🔍 DEBUG: MUESTRA EL ESTADO FINAL DE LA SELECCIÓN
    // -----------------------------------------------------

    // Primero, logueamos el paso para contexto
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
      setTurnActionStep(0); // Reiniciar el estado de acciones
      return;
    }
  }, [isMyTurn, turnActionStep]);

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
            isMyTurn={isMyTurn}
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
            />
          ) : (
            <div className="empty-hint">Esperando jugadores…</div>
          )}
          {isMyTurn && (
            <div className="turn-actions-container">
              <TurnActions
                gameId={currentGame.game_id}
                playerId={player.player_id}
                onTurnUpdated={handleTurnUpdated}
                selectedCardIds={selectedCardIds}
                setSelectedCardIds={setSelectedCardIds}
                step={turnActionStep}
                setStep={setTurnActionStep}
                cardCount={cardCount}
                selectedCard={selectedCard}
                setSelectedCard={setSelectedCard}
              />
            </div>
          )}
          <p>{endMessage}</p>
        </section>
      </main>
    </div>
  );
}
