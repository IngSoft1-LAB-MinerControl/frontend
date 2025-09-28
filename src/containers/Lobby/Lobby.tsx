import "./Lobby.css";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import playerService from "../../services/playerService";
import type { Player } from "../../services/playerService";
import Button from "../../components/Button";

function Lobby() {
  const location = useLocation();
  const navigate = useNavigate();
  const { game, playerName, playerDate } = location.state || {};

  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string>("");

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

  // Validación para iniciar partida
  const validate = () => {
    if (players.length < (game?.min_players ?? 1)) {
      setError(
        `La partida necesita al menos ${
          game?.min_players ?? 1
        } jugadores para iniciar.`
      );
      return false;
    }
    setError(""); // limpiar error
    return true;
  };

  const handleStartClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Lógica para iniciar partida o navegar
      navigate("/game", { state: { game, playerName, playerDate } });
    }
  };

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
                  <div className="player-info">
                    <div className="player-name">
                      {player.name}{" "}
                      {player.host && (
                        <span className="host-badge">(HOST)</span>
                      )}
                    </div>
                    <div className="player-date">{player.birth_date}</div>
                  </div>
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
            <>
              {/* Reservamos espacio para el error */}
              <p className={`error-message ${error ? "active" : ""}`}>
                {error || " "}
              </p>
              <Button
                type="button"
                label="Iniciar"
                onClick={handleStartClick}
              />
            </>
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
