import "./ListGames.css";
import Button from "../../components/Button";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import destinations from "../../navigation/destinations";

import type { Game, GameResponse } from "../../services/gameService";
import playerService from "../../services/playerService";

export default function ListGames() {
  const [partidas, setPartidas] = useState<GameResponse[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const { playerName, playerDate } = location.state || {};

  useEffect(() => {
    const wsURL = "ws://localhost:8000/ws/games/availables";
    const ws = new WebSocket(wsURL);

    // cuando la conexión se establece con éxito
    ws.onopen = () => {
      console.log("Conexión WebSocket establecida para la lista de partidas.");
      setError(""); // Limpiamos errores previos si los hubo
    };

    ws.onmessage = (event) => {
      const updatedGames = JSON.parse(event.data);
      setPartidas(updatedGames);
    };

    ws.onerror = (event) => {
      console.error("Error en el WebSocket:", event);
      setError(
        "Error en la conexión en tiempo real. Intenta recargar la página."
      );
    };

    ws.onclose = () => {
      console.log("Conexión WebSocket cerrada.");
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleJoin = async (game: Game) => {
    if (!playerName || !playerDate) {
      setError("No se encontro informacion del jugador");
      return;
    }

    try {
      console.log(playerName, playerDate);
      const newPlayer = await playerService.createPlayer({
        name: playerName,
        birth_date: playerDate,
        host: false,
        game_id: game.game_id!,
      });
      console.log("player (join):", newPlayer);

      navigate(destinations.lobby, { state: { game, player: newPlayer } });
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
