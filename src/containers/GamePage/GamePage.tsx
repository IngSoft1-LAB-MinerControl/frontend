import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import "./GamePage.css";
import playerService from "../../services/playerService";
import type { Player } from "../../services/playerService";
import CardBase from "../../components/Cards/CardBase";
import Secret from "../../components/Cards/Secret";
import TurnActions from "./ButtonGame";

// Tipo mínimo de Game: solo lo que usás acá
type Game = {
  game_id: string;
  min_players: number;
  max_players?: number;
  name?: string;
};

export default function GamePage() {
  const location = useLocation();

  const { game, playerName, playerDate } = (location.state ?? {}) as
    | { game: Game; playerName: string; playerDate: string }
    | {};

  const [players, setPlayers] = useState<Player[]>([]);
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
  const currentPlayer = players.find(
    (p) => p.name === playerName && p.birth_date === playerDate
  );

  // let isHost = false;
  // if (currentPlayer && currentPlayer.host) {
  //   isHost = true;
  // }

  // Distribución visual: yo abajo; 3 arriba; 1 izq; 1 der
  const distribution = useMemo(() => {
    if (!players.length)
      return {
        bottom: null as Player | null,
        top: [] as Player[],
        left: null as Player | null,
        right: null as Player | null,
      };

    const me = currentPlayer ?? players[0]; // fallback por si no encontró
    const others = players.filter((p) => p !== me);

    const top = others.slice(0, 3); // hasta 3 arriba
    const left = others.slice(3, 4)[0] ?? null; // 4to a la izquierda
    const right = others.slice(4, 5)[0] ?? null; // 5to a la derecha

    return { bottom: me, top, left, right };
  }, [players, currentPlayer]);

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
              <Opponent key={p.id} player={p} />
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
          <Decks />
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
            <You player={distribution.bottom} />
          ) : (
            <div className="empty-hint">Esperando jugadores…</div>
          )}
          <TurnActions />
        </section>
      </main>

      {/* Mensaje de error (si valida) */}
      {error && <div className="inline-error">{error}</div>}
    </div>
  );
}

/* ===========================
   Sub-componentes de la mesa
   =========================== */

function Decks() {
  return (
    <div className="decks">
      <div className="deck draw-deck" title="Mazo para robar">
        <CardBase key="draw" shown={false} size="medium" />
      </div>
      <div className="deck discard-deck" title="Descarte (tope visible)">
        <CardBase key="discard" shown={true} size="medium" />
      </div>
    </div>
  );
}

function Opponent({ player }: { player: Player }) {
  return (
    <div className="opponent">
      <div className="op-name">{player.name}</div>

      <div className="op-hand">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardBase
            key={`op-hand-${player.id}-${i}`}
            shown={false}
            size="medium"
          />
        ))}
      </div>

      <div className="op-secrets">
        {Array.from({ length: 3 }).map((_, i) => (
          <Secret
            key={`op-secret-${player.id}-${i}`}
            shown={false}
            size="medium"
          />
        ))}
      </div>
    </div>
  );
}

function You({ player }: { player: Player }) {
  return (
    <div className="you">
      <div className="you-name">{player.name}</div>

      <div className="you-secrets">
        {Array.from({ length: 3 }).map((_, i) => (
          <Secret key={`me-secret-${i}`} shown={false} size="medium" />
        ))}
      </div>

      <div className="you-hand">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardBase key={`me-hand-${i}`} shown={true} size="medium" />
        ))}
      </div>
    </div>
  );
}

function EmptySlot() {
  return <div className="empty-slot" aria-hidden="true" />;
}
