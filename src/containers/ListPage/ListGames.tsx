import "./ListGames.css";
import Button from "../../components/Button";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import destinations from "../../navigation/destinations";
import gameService from "../../services/gameService";
import type { Game } from "../../services/gameService";
import playerService from "../../services/playerService";

export default function ListGames() {
  const [partidas, setPartidas] = useState<Game[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const { playerName, playerDate } = location.state || {};

  // Función para traer las partidas
  const fetchGames = async () => {
    try {
      const games = await gameService.getGames();
      setPartidas(games);
    } catch (err) {
      console.error(err);
      setError("Error al obtener partidas");
    }
  };

  // Cargar partidas al montar el componente y refrescar cada 5 seg.
  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, []);

  // Función al unirse a una partida
  const handleJoin = async (game: Game) => {
    if (!playerName || !playerDate) {
      setError("No se encontró información del jugador");
      return;
    }

    try {
      console.log(playerName, playerDate);
      await playerService.createPlayer({
        name: playerName,
        birth_date: playerDate, //new Date(playerDate).toISOString().split("T")[0],
        host: false,
        game_id: game.game_id!, // ⚠️ usamos game_id del GET
      });

      navigate(destinations.lobby, { state: { game, playerName, playerDate } });
    } catch (err) {
      console.error(err);
      setError("Error al unirse a la partida");
    }
  };

  return (
    <div className="list-page">
      <div className="list-container">
        <h1 className="container-title">Partidas disponibles</h1>
        <p className={`list-error-message ${error ? "active" : ""}`}>{error}</p>
        <ul className="game-list">
          {partidas.map((partida) => (
            <li key={partida.game_id} className="list-item">
              <div className="side-info">
                <div className="item-title">{partida.name}</div>
                <div className="item-data">
                  De {partida.min_players} a {partida.max_players} jugadores.
                  {/* Lugares disponibles: aca pondria el partida.amiunt_players */}
                </div>
              </div>
              <Button
                type="button"
                label="Unirme"
                onClick={() => handleJoin(partida)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
