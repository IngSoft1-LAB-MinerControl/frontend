import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import "./GamePage.css";
import playerService from "../../services/playerService";
import type { PlayerResponse } from "../../services/playerService";
import gameService from "../../services/gameService";

import TurnActions from "./TurnActions";
import Opponent from "../../components/Opponent";
import Decks from "../../components/Decks";
import You from "../../components/MyHand";
import EmptySlot from "../../components/EmptySlot";
import type { GameResponse } from "../../services/gameService";
import type { CardResponse } from "../../services/cardService";

export default function GamePage() {
  const location = useLocation();

  const { game, player } = location.state ?? {};

  const [players, setPlayers] = useState<PlayerResponse[]>([]);
  const [currentGame, setCurrentGame] = useState<GameResponse>(game);
  const [refreshYouTrigger, setRefreshYouTrigger] = useState(0); // forzar la actualización de You
  const [lastDiscarded, setLastDiscarded] = useState<CardResponse | null>(null);

  const [error, setError] = useState("");

  if (!game) {
    return (
      <div className="game-page">
        <div className="inline-error">
          Falta el contexto de la partida. Volvé al lobby e ingresá nuevamente.
        </div>
      </div>
    );
  }

  // Traer jugadores de la partida
  const fetchPlayers = async () => {
    try {
      if (!game?.game_id) return;
      const jugadores = await playerService.getPlayersByGame(game.game_id);
      setPlayers(jugadores);
    } catch (err) {
      console.error("Error al obtener jugadores:", err);
    }
  };

  // Refrescar cada 3s
  useEffect(() => {
    fetchPlayers();
    const t = setInterval(fetchPlayers, 3000);
    return () => clearInterval(t);
  }, [game.game_id]);

  // Player actual
  const currentPlayer = players.find((p) => p.player_id === player.player_id);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const updatedGame = await gameService.getGameById(currentGame.game_id);
        setCurrentGame(updatedGame);
      } catch (error) {
        console.error("Error al actualizar el juego:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [game.game_id]);

  // Determinar si es mi turno
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

  // Distribución visual: yo abajo; 3 arriba; 1 izq; 1 der
  const distribution = useMemo(() => {
    if (!players.length)
      return {
        bottom: null as PlayerResponse | null,
        top: [] as PlayerResponse[],
        left: null as PlayerResponse | null,
        right: null as PlayerResponse | null,
      };

    const me = currentPlayer ?? players[0]; // fallback por si no encontró
    const others = players.filter((p) => p !== me);

    const top = others.slice(0, 3); // hasta 3 arriba
    const left = others.slice(3, 4)[0] ?? null; // 4to a la izquierda
    const right = others.slice(4, 5)[0] ?? null; // 5to a la derecha

    return { bottom: me, top, left, right };
  }, [players, currentPlayer]);

  const handleTurnUpdated = useCallback((updatedGame: GameResponse | null) => {
    if (updatedGame) {
      setCurrentGame(updatedGame);
    }
    setRefreshYouTrigger((prev) => prev + 1); // <-- Actualiza el trigger para que You se refresque
  }, []);

  return (
    <div className="game-page">
      {/* Capa de mesa encima del fondo estético */}
      <div className="game-table-overlay" aria-hidden="true" />

      {/* Header */}
      <header className="game-header">
        <h1 className="game-title">{game?.name ?? "Partida"}</h1>
      </header>

      {/* MESA: TOP | MIDDLE (left/center/right) | BOTTOM */}
      <main className="table-grid">
        {/* TOP: hasta 3 oponentes */}
        <section className="area-top">
          <div className="opponents-row">
            {distribution.top.map((p) => (
              <Opponent key={p.player_id} player={p} />
            ))}
          </div>
        </section>

        {/* LEFT y RIGHT: 1 oponente cada uno */}
        <section className="area-left">
          {distribution.left ? (
            <Opponent player={distribution.left} />
          ) : (
            <EmptySlot />
          )}
        </section>

        {/* CENTER: mazos */}
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

        {/* BOTTOM: YO (mano y secretos grandes) */}
        <section className="area-bottom">
          {distribution.bottom ? (
            <You
              player={distribution.bottom}
              refreshTrigger={refreshYouTrigger}
            />
          ) : (
            <div className="empty-hint">Esperando jugadores…</div>
          )}

          {/* acciones de turno */}
          {isMyTurn && (
            <div className="turn-actions-container">
              <TurnActions
                gameId={currentGame.game_id}
                playerId={player.player_id}
                onTurnUpdated={handleTurnUpdated}
                onCardDiscarded={(card) => setLastDiscarded(card)}
              />
            </div>
          )}
        </section>
      </main>

      {/* Mensaje de error (si valida) */}
      {error && <div className="inline-error">{error}</div>}
    </div>
  );
}
