import "./Lobby.css";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import playerService from "../../services/playerService";
import type { PlayerResponse } from "../../services/playerService";
import gameService from "../../services/gameService";

function Lobby() {
  const location = useLocation();
  const navigate = useNavigate();

  const { game, player } = location.state || {};

  const [players, setPlayers] = useState<PlayerResponse[]>([]);
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

  // Hook para revisar si el juego ya empezó
  useEffect(() => {
    const checkGameStatus = async () => {
      if (!game?.game_id) return;
      try {
        const updatedGame = await gameService.getGameById(game.game_id);
        if (updatedGame.status === "in course") {
          navigate("/game", {
            state: { game: updatedGame, player },
          });
        }
      } catch (err) {
        console.error("Error al chequear estado del juego:", err);
      }
    };

    const interval = setInterval(checkGameStatus, 3000);
    return () => clearInterval(interval);
  }, [game, player, navigate]);

  // Detectar el jugador actual
  const currentPlayer = players.find((p) => p.player_id === player.player_id);
  const isHost = currentPlayer?.host ?? false;

  // No renderizar hasta que ya hayan cargado los jugadores
  if (!players.length) return <p>Cargando jugadores...</p>;

  console.log("players en lobby:", players);
  console.log("player actual:", player);
  console.log("currentPlayer:", currentPlayer);
  console.log("isHost:", isHost);

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

  const handleStartClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      try {
        await gameService.startGame(game.game_id);
        //todos  los players entran cuando checkGameStatus detecta "in course"
      } catch (err) {
        console.error("Error iniciando el juego:", err);
      }
    }
  };

  return (
    <div className="lobby-page">
      <h1 className="lobby-title">SALA DE ESPERA</h1>
      <section className="lobby-card" aria-label="Sala de espera">
        {/* Slots de jugadores */}
        <div className="lobby-slots" aria-label="Jugadores">
          {players.map((p, index) => (
            <div key={index} className="lobby-slot filled">
              <div className="player-info">
                <div className="player-name">
                  {p.name}{" "}
                  {p.host && <span className="host-badge">(HOST)</span>}
                </div>
                <div className="player-date">{p.birth_date}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Acción de iniciar o mensaje de espera */}
        <div className="lobby-actions">
          {isHost ? (
            <>
              <p className={`start-error ${error ? "active" : ""}`}>
                {error || " "}
              </p>
              <button
                type="button"
                className="start-button"
                onClick={handleStartClick}
              >
                Iniciar
              </button>
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
