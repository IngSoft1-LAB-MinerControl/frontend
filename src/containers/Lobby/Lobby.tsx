import "./Lobby.css";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import playerService from "../../services/playerService";
import type { Player } from "../../services/playerService";

function Lobby() {
  const location = useLocation();
  const { game, playerName, playerDate } = location.state || {};

  const [players, setPlayers] = useState<Player[]>([]);

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

  // Refrescar la lista cada 3 segundos
  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 3000);
    return () => clearInterval(interval);
  }, [game]);

  // Detectar el jugador actual
  const currentPlayer = players.find(
    (p) => p.name === playerName && p.birth_date === playerDate
  );
  const isHost = currentPlayer?.host ?? false;

  return (
    <div className="lobby-page">
      <h1 className="lobby-title">SALA DE ESPERA</h1>

      <section className="lobby-card" aria-label="Sala de espera">
        {/* Slots de jugadores */}
        <div className="lobby-slots" aria-label="Jugadores">
          {Array.from({ length: 6 }).map((_, index) => {
            const player = players[index];
            return (
              <div key={index} className="lobby-slot">
                {player ? (
                  <>
                    <div>{player.name}</div>
                    <div className="player-date">{player.birth_date}</div>
                    {player.host && <span className="host-badge">👑</span>}
                  </>
                ) : (
                  <div className="empty-slot" />
                )}
              </div>
            );
          })}
        </div>

        {/* Acción de iniciar o mensaje de espera */}
        <div className="lobby-actions">
          {isHost ? (
            <button
              type="button"
              className="lobby-button"
              disabled={players.length < game.min_players}
              onClick={() => console.log("INICIAR")}
            >
              INICIAR
            </button>
          ) : (
            <p className="waiting-text">
              Esperando a que el anfitrión inicie la partida...
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Lobby;
