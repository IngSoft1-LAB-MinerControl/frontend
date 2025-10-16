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
  const [selectedDraftCardId, setSelectedDraftCardId] = useState<number | null>(
    null
  );

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

  // DEPURACIÓN isMyTurn

  // console.log("DEBUG: CÁLCULO DE TURNO ");
  // console.log("Objeto 'player' del Lobby:", player);
  // console.log("Objeto 'currentGame':", currentGame);
  // console.log("Objeto 'currentPlayer' (encontrado en la lista):", currentPlayer);

  // if (currentGame) {
  //   console.log("  ➡️ Turno actual del juego (current_turn):", currentGame.current_turn);
  // }
  // if (currentPlayer) {
  //   console.log("  ➡️ Mi orden de turno (turn_order):", currentPlayer.turn_order);
  // }

  const handleDraftSelect = (cardId: number) => {
    // Si el jugador hace clic en la misma carta, se deselecciona. Si no, se selecciona.
    setSelectedDraftCardId((prev) => (prev === cardId ? null : cardId));
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
            selectedCardId={selectedDraftCardId}
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
              onCardsSelected={setSelectedCardIds}
              isMyTurn={isMyTurn}
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
                selectedDraftCardId={selectedDraftCardId}
                setSelectedDraftCardId={setSelectedDraftCardId}
              />
            </div>
          )}
          <p>{endMessage}</p>
        </section>
      </main>
    </div>
  );
}
