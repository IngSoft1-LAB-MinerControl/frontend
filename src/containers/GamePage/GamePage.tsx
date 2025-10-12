import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GamePage.css";
import type { PlayerStateResponse } from "../../services/playerService";
import { httpServerUrl } from "../../services/config"; // Importar la URL base

import TurnActions from "./TurnActions";
import Opponent from "../../components/Opponent";
import Decks from "../../components/Decks";
import You from "../../components/MyHand";
import EmptySlot from "../../components/EmptySlot";
import type { GameResponse } from "../../services/gameService";
import type { CardResponse } from "../../services/cardService";

export default function GamePage() {
  const location = useLocation();
  const navigate = useNavigate(); // Agregamos navigate para futuras redirecciones

  const { game, player } = location.state ?? {};

  const [players, setPlayers] = useState<PlayerStateResponse[]>([]);
  const [currentGame, setCurrentGame] = useState<GameResponse>(game);
  const [lastDiscarded, setLastDiscarded] = useState<CardResponse | null>(null);
  const [error, setError] = useState("");
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [turnActionStep, setTurnActionStep] = useState<0 | 1 | 2>(0);

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
      console.log(`✅ Conectado al WebSocket de la partida: ${wsURL}`);
      setError("");
    };

    // Escuchamos todos los mensajes que el servidor envía para esta partida
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("MSJ WS", message);
        // Lógica para manejar datos que pueden ser string o ya un objeto
        // Esta es la clave: si es un string, lo parseamos. Si no, lo usamos directamente.
        const dataContent =
          typeof message.data === "string"
            ? JSON.parse(message.data)
            : message.data;
        // Usamos un switch para manejar los diferentes tipos de actualizaciones
        switch (message.type) {
          case "playersState":
            // Actualiza la lista de jugadores
            // Parseo a JSON primero de string
            // const playersData = JSON.parse(message.data)
            setPlayers(dataContent);
            break;

          case "gameUpdated":
            // Actualiza el estado completo de la partida (ej: cambio de turno)
            setCurrentGame(dataContent);
            break;

          case "droppedCards":
            // Actualiza la última carta descartada
            console.log("SE RECIBIERON LAS CARTAS DESCARTADAS", dataContent);
            setLastDiscarded(dataContent[0]);
            break;

          // más casos acá. ("player_played_card", "game_over", etc.)
          default:
            console.log("Mensaje WS recibido sin tipo conocido:", message);
        }
      } catch (err) {
        console.error("Error procesando mensaje WS:", err);
      }
    };

    ws.onerror = (event) => {
      console.error("❌ Error en WebSocket:", event);
      setError(
        "Error en la conexión en tiempo real. Intenta recargar la página."
      );
    };

    ws.onclose = () => {
      console.log("🔌 Conexión WebSocket de la partida cerrada.");
    };

    // cerramos la conexión cuando el componente se desmonta
    return () => {
      ws.close();
    };
  }, [game.game_id, navigate]); // Dependemos solo de game.game_id para no reconectar innecesariamente

  // El resto de la lógica del componente permanece igual,
  // ya que reacciona a los cambios de estado que ahora son actualizados por el WebSocket.

  const currentPlayer = players.find((p) => p.player_id === player.player_id);

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
    // ... (sin cambios)
    if (!players.length)
      return {
        bottom: null as PlayerStateResponse | null,
        top: [] as PlayerStateResponse[],
        left: null as PlayerStateResponse | null,
        right: null as PlayerStateResponse | null,
      };

    const me = currentPlayer ?? players[0];
    const others = players.filter((p) => p !== me);

    const top = others.slice(0, 3);
    const left = others.slice(3, 4)[0] ?? null;
    const right = others.slice(4, 5)[0] ?? null;

    return { bottom: me, top, left, right };
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
      <div className="game-table-overlay" aria-hidden="true" />
      <header className="game-header">
        <h1 className="game-title">{game?.name ?? "Partida"}</h1>
      </header>
      <main className="table-grid">
        <section className="area-top">
          <div className="opponents-row">
            {distribution.top.map((p) => (
              <Opponent key={p.player_id} player={p} />
            ))}
          </div>
        </section>
        <section className="area-left">
          {distribution.left ? (
            <Opponent player={distribution.left} />
          ) : (
            <EmptySlot />
          )}
        </section>
        <section className="area-center">
          <Decks lastDiscarded={lastDiscarded} />
        </section>
        <section className="area-right">
          {distribution.right ? (
            <Opponent player={distribution.right} />
          ) : (
            <EmptySlot />
          )}
        </section>
        <section className="area-bottom">
          {distribution.bottom ? (
            <You
              player={distribution.bottom}
              selectedCardIds={selectedCardIds}
              onCardsSelected={setSelectedCardIds}
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
              />
            </div>
          )}
        </section>
      </main>
      {error && <div className="inline-error">{error}</div>}
    </div>
  );
}
