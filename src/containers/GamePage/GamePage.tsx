import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import CardBase from "../../components/Cards/CardBase";
import "./GamePage.css";

// Tipado básico (ajustalo a tu modelo real)
type GameInfo = {
  game_id: string;
  min_players: number;
  max_players: number;
  name?: string;
};
type Player = {
  id: string;
  name: string;
  birth_date: string;
  host?: boolean;
  // si ya tienen avatar/otras props, agregarlas
};

// Simula tu servicio real (reemplazá por tu playerService)
const playerService = {
  async getPlayersByGame(gameId: string): Promise<Player[]> {
    // TODO: llamar a tu backend real
    // mock para ver la vista:
    return [
      { id: "1", name: "Ulises", birth_date: "2000-01-01", host: true },
      { id: "2", name: "Marple", birth_date: "1970-11-11" },
      { id: "3", name: "Parker", birth_date: "1980-05-05" },
      { id: "4", name: "Tommy", birth_date: "1990-03-03" },
      { id: "5", name: "Tuppence", birth_date: "1991-02-02" },
      // { id: "6", name: "Poirot", birth_date: "1960-10-10" },
    ];
  },
};

export default function Game() {
  const location = useLocation();
  // Recibo el estado que te pasan desde la navegación (ajustá nombres si difieren)
  const { game, playerName, playerDate } = (location.state ?? {}) as {
    game: GameInfo;
    playerName: string;
    playerDate: string;
  };

  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState("");

  // Traer jugadores de la partida
  const fetchPlayers = async () => {
    try {
      if (!game?.game_id) return;
      const list = await playerService.getPlayersByGame(game.game_id);
      setPlayers(list);
    } catch (err) {
      console.error("Error al obtener jugadores:", err);
    }
  };

  // Refrescar cada 3s
  useEffect(() => {
    fetchPlayers();
    const t = setInterval(fetchPlayers, 3000);
    return () => clearInterval(t);
  }, [game?.game_id]);

  // Player actual
  const currentPlayer = players.find(
    (p) => p.name === playerName && p.birth_date === playerDate
  );
  const isHost = currentPlayer?.host ?? false;

  // Distribución visual: yo abajo; 3 arriba; 1 izq; 1 der
  const distribution = useMemo(() => {
    if (!players.length)
      return {
        bottom: null,
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

  // Validación simple (por si querés usarla)
  const validateCanStart = () => {
    if (!game) return false;
    const ok = players.length >= (game.min_players ?? 2);
    setError(ok ? "" : `Se necesitan al menos ${game.min_players} jugadores.`);
    return ok;
  };

  return (
    <div className="game-page">
      {/* Capa de mesa encima del fondo estético */}
      <div className="game-table-overlay" aria-hidden="true" />

      {/* Opcional: título arriba a la izquierda */}
      <header className="game-header">
        <h1 className="game-title">{game?.name ?? "Partida"}</h1>
        {isHost && (
          <button
            className="host-start-button"
            onClick={() => {
              if (validateCanStart()) {
                console.log("Iniciar partida");
                // TODO: POST /games/:id/start
              }
            }}
          >
            Iniciar (Host)
          </button>
        )}
      </header>

      {/* MESA: 3 áreas → TOP | MIDDLE (left/center/right) | BOTTOM */}
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
        <Card size="large" />
      </div>
      <div className="deck discard-deck" title="Descarte (tope visible)">
        <Card size="large" />
      </div>
    </div>
  );
}

function Opponent({ player }: { player: Player }) {
  return (
    <div className="opponent">
      <div className="op-name">{player.name}</div>

      <div className="op-hand">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardBase shown={true} size="medium" image="/images/card_back.png" />
        ))}
      </div>

      <div className="op-secrets">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardBase shown={true} size="medium" image="/images/detective1.png" />
        ))}
      </div>
    </div>
  );
}

function You({ player }: { player: Player }) {
  return (
    <div className="you">
      <div className="you-name">{player.name}</div>

      <div className="you-hand">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardBase shown={true} size="medium" image="/images/detective1.png" />
        ))}
      </div>

      <div className="you-secrets">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardBase shown={true} size="medium" image="/images/detective1.png" />
        ))}
      </div>
    </div>
  );
}

function EmptySlot() {
  return <div className="empty-slot" aria-hidden="true" />;
}
