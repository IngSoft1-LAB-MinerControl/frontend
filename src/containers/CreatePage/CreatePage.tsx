import "./CreatePage.css";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import { useState } from "react";
import gameService from "../../services/gameService";
import playerService from "../../services/playerService";
import { useNavigate, useLocation } from "react-router-dom";
import destinations from "../../navigation/destinations";

export default function CreatePage() {
  const [gameName, setGameName] = useState("");
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const { playerName, playerDate } = location.state || {};

  const validate = () => {
    if (!gameName.trim()) {
      setError("Debe ingresar un nombre");
      return false;
    }
    if (minPlayers < 2 || maxPlayers > 6) {
      setError("La cantidad de jugadores debe estar entre 2 y 6.");
      return false;
    }
    if (minPlayers > maxPlayers) {
      setError("El número mínimo de jugadores no puede ser mayor al máximo");
      return false;
    }
    setError("");
    return true;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Primero validamos los campos
    if (!validate()) return; // Si falla, ya se muestra el error y salimos

    try {
      setError(""); // Limpiamos error previo
      console.log({ gameName, minPlayers, maxPlayers });
      // Obtener partidas existentes
      const existingGames = await gameService.getGames(); // o getAvailableGames
      const nameExists = existingGames.some(
        (game) => game.name.toLowerCase() === gameName.trim().toLowerCase()
      );

      if (nameExists) {
        setError("Ya existe una partida con ese nombre, elija otro.");
        return;
      }

      // Crear la partida
      const newGame = await gameService.createGame({
        name: gameName,
        min_players: minPlayers,
        max_players: maxPlayers,
        status: "waiting players",
      });

      // Crear el jugador host
      const newPlayer = await playerService.createPlayer({
        name: playerName,
        birth_date: playerDate, //new Date(initialDate).toISOString().split("T")[0],
        host: true,
        game_id: newGame.game_id,
      });
      console.log("newPlayer (create):", newPlayer);

      // Redirigir al lobby
      navigate(destinations.lobby, {
        state: { game: newGame, player: newPlayer },
      });
    } catch (err) {
      console.error(err);
      setError("Error al crear la partida"); // Mensaje de error genérico si falla el backend
    }
  };

  return (
    <div className="home-page">
      <form className="form-container">
        <h1 className="form-title">Información de partida</h1>

        <div className="form-field">
          <label htmlFor="nombre-partida" className="form-label">
            Nombre de la Partida
          </label>
          <InputField
            id="nombre-partida"
            placeholder="Ingrese un nombre para la partida."
            value={gameName}
            maxLength={30}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setGameName(e.target.value)
            }
          />
        </div>

        <div className="double-container">
          <div className="double-field">
            <label htmlFor="minimo-jugadores" className="form-label">
              Mínimo de jugadores
            </label>
            <InputField
              id="minimo-jugadores"
              type="number"
              placeholder=""
              value={minPlayers.toString()}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMinPlayers(Number(e.target.value))
              }
            />
          </div>

          <div className="double-field">
            <label htmlFor="maximo-jugadores" className="form-label">
              Máximo de jugadores
            </label>
            <InputField
              id="maximo-jugadores"
              type="number"
              placeholder=""
              value={maxPlayers.toString()}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMaxPlayers(Number(e.target.value))
              }
            />
          </div>
        </div>

        <p className={`error-message ${error ? "active" : ""}`}>{error}</p>

        <Button type="button" label="Crear partida" onClick={handleSubmit} />
      </form>
    </div>
  );
}
