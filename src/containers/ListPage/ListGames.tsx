// import "./ListGames.css";
// import Button from "../../components/Button";
// import { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import destinations from "../../navigation/destinations";
// import gameService from "../../services/gameService";

// import type { Game, GameResponse } from "../../services/gameService";
// import playerService from "../../services/playerService";

// export default function ListGames() {
//   const [partidas, setPartidas] = useState<GameResponse[]>([]);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();
//   const location = useLocation();

//   const { playerName, playerDate } = location.state || {};

//   const fetchGames = async () => {
//     try {
//       const games = await gameService.getGames();
//       setPartidas(games);
//     } catch (err) {
//       console.error(err);
//       setError("Error al obtener partidas");
//     }
//   };

//   useEffect(() => {
//     fetchGames();
//     const interval = setInterval(fetchGames, 3000);
//     return () => clearInterval(interval);
//   }, []);

//   const handleJoin = async (game: Game) => {
//     if (!playerName || !playerDate) {
//       setError("No se encontro informacion del jugador");
//       return;
//     }

//     try {
//       console.log(playerName, playerDate);
//       const newPlayer = await playerService.createPlayer({
//         name: playerName,
//         birth_date: playerDate,
//         host: false,
//         game_id: game.game_id!,
//       });
//       console.log("player (join):", newPlayer);

//       navigate(destinations.lobby, { state: { game, player: newPlayer } });
//     } catch (err) {
//       console.error(err);
//       setError("Error al unirse a la partida");
//     }
//   };

//   return (
//     <div className="list-page">
//       <div className="list-container">
//         <h1 className="container-title">Partidas disponibles</h1>
//         <p className={`list-error-message ${error ? "active" : ""}`}>{error}</p>
//         <ul className="game-list">
//           {partidas.map((partida) => (
//             <li key={partida.game_id} className="list-item">
//               <div className="side-info">
//                 <div className="item-title">{partida.name}</div>
//                 <div className="item-data">
//                   De {partida.min_players} a {partida.max_players} jugadores.
//                   Lugares disponibles:{" "}
//                   {partida.max_players - partida.players_amount}
//                 </div>
//               </div>
//               <Button
//                 type="button"
//                 label="Unirme"
//                 onClick={() => handleJoin(partida)}
//               />
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// }

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

  // ------------------- INICIO DE LOS CAMBIOS -------------------

  // Ya no necesitamos esta función para el polling
  /*
  const fetchGames = async () => {
    try {
      const games = await gameService.getGames();
      setPartidas(games);
    } catch (err) {
      console.error(err);
      setError("Error al obtener partidas");
    }
  };
  */

  // Reemplazamos el useEffect del polling con este para WebSockets
  useEffect(() => {
    // Define la URL de tu WebSocket.
    // Asegúrate de que el host y el puerto coincidan con tu backend.
    // Si FastAPI corre en http://localhost:8000, el WebSocket estará en ws://localhost:8000
    const wsURL = "ws://localhost:8000/ws/games/availables";
    const ws = new WebSocket(wsURL);

    // Se ejecuta cuando la conexión se establece con éxito
    ws.onopen = () => {
      console.log("Conexión WebSocket establecida para la lista de partidas.");
      setError(""); // Limpiamos errores previos si los hubo
    };

    // ¡Este es el manejador más importante!
    // Se ejecuta cada vez que el servidor envía un mensaje a través del WebSocket.
    ws.onmessage = (event) => {
      // El servidor envía un string JSON. Lo parseamos para convertirlo
      // en un array de objetos de JavaScript.
      const updatedGames = JSON.parse(event.data);

      // Actualizamos el estado de React con la nueva lista de partidas.
      // Esto hará que la interfaz se re-renderice automáticamente.
      setPartidas(updatedGames);
    };

    // Se ejecuta si hay algún error en la conexión
    ws.onerror = (event) => {
      console.error("Error en el WebSocket:", event);
      setError(
        "Error en la conexión en tiempo real. Intenta recargar la página."
      );
    };

    // Se ejecuta cuando la conexión se cierra
    ws.onclose = () => {
      console.log("Conexión WebSocket cerrada.");
    };

    // Función de limpieza: Es CRUCIAL para evitar problemas.
    // React la ejecutará cuando el componente se desmonte (ej: el usuario navega a otra página).
    // Esto asegura que cerramos la conexión y no dejamos "fugas".
    return () => {
      ws.close();
    };
  }, []); // El array de dependencias vacío `[]` asegura que este efecto se ejecute solo una vez.

  // ------------------- FIN DE LOS CAMBIOS -------------------

  // La función handleJoin no necesita cambios, funciona igual.
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

  // El JSX no necesita cambios, ya que sigue leyendo del estado `partidas`.
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
