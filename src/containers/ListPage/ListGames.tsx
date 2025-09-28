import "./ListGames.css";
import Button from "../../components/Button";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import destinations from "../../navigation/destinations";
import gameService from "../../services/gameService";
import type { Game, GameResponse } from "../../services/gameService";
import playerService from "../../services/playerService";

export default function ListGames() {
  const [partidas, setPartidas] = useState<GameResponse[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const { playerName, playerDate } = location.state || {};

  const fetchGames = async () => {
    try {
      const games = await gameService.getGames();
      setPartidas(games);
    } catch (err) {
      console.error(err);
      setError("Error al obtener partidas");
    }
  };

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = async (game: Game) => {
    if (!playerName || !playerDate) {
      setError("No se encontró información del jugador");
      return;
    }

    try {
      console.log(playerName, playerDate);
      await playerService.createPlayer({
        name: playerName,
        birth_date: playerDate,
        host: false,
        game_id: game.game_id!,
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
                  Lugares disponibles:{" "}
                  {partida.max_players - partida.players_amount}
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
