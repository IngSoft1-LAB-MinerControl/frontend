// import "./Lobby.css";
// import { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import playerService from "../../services/playerService";
// import type { PlayerResponse } from "../../services/playerService";
// import gameService from "../../services/gameService";

// function Lobby() {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const { game, player } = location.state || {};

//   const [players, setPlayers] = useState<PlayerResponse[]>([]);
//   const [error, setError] = useState<string>("");

//   // Traer jugadores de la partida
//   const fetchPlayers = async () => {
//     try {
//       if (!game?.game_id) return;
//       const jugadores = await playerService.getPlayersByGame(game.game_id);
//       setPlayers(jugadores);
//     } catch (err) {
//       console.error("Error al obtener jugadores:", err);
//     }
//   };

//   // Refrescar la lista cada 3 segundos
//   useEffect(() => {
//     fetchPlayers();
//     const interval = setInterval(fetchPlayers, 3000);
//     return () => clearInterval(interval);
//   }, [game]);

//   // Hook para revisar si el juego ya empezó
//   useEffect(() => {
//     const checkGameStatus = async () => {
//       if (!game?.game_id) return;
//       try {
//         const updatedGame = await gameService.getGameById(game.game_id);
//         if (updatedGame.status === "in course") {
//           navigate("/game", {
//             state: { game: updatedGame, player },
//           });
//         }
//       } catch (err) {
//         console.error("Error al chequear estado del juego:", err);
//       }
//     };

//     const interval = setInterval(checkGameStatus, 3000);
//     return () => clearInterval(interval);
//   }, [game, player, navigate]);

//   // Detectar el jugador actual
//   const currentPlayer = players.find((p) => p.player_id === player.player_id);
//   const isHost = currentPlayer?.host ?? false;

//   // No renderizar hasta que ya hayan cargado los jugadores
//   if (!players.length) return <p>Cargando jugadores...</p>;

//   console.log("players en lobby:", players);
//   console.log("player actual:", player);
//   console.log("currentPlayer:", currentPlayer);
//   console.log("isHost:", isHost);

//   // Validación para iniciar partida
//   const validate = () => {
//     if (players.length < (game?.min_players ?? 1)) {
//       setError(
//         `La partida necesita al menos ${
//           game?.min_players ?? 1
//         } jugadores para iniciar.`
//       );
//       return false;
//     }
//     setError(""); // limpiar error
//     return true;
//   };

//   const handleStartClick = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (validate()) {
//       try {
//         await gameService.startGame(game.game_id);
//         //todos  los players entran cuando checkGameStatus detecta "in course"
//       } catch (err) {
//         console.error("Error iniciando el juego:", err);
//       }
//     }
//   };

//   return (
//     <div className="lobby-page">
//       <div className="lobby-title">
//       <h1 className="title-text1"> {game.name} </h1>
//         <h1 className="title-text2">Sala de Espera</h1>
//         </div>
//       <section className="lobby-card" aria-label="Sala de espera">
//       {/* Slots de jugadores */}
//         <div className="lobby-slots" aria-label="Jugadores">
//           {players.map((p, index) => (
//             <div key={index} className="lobby-slot filled">
//               <div className="player-info">
//                 <div className="player-name">
//                   {p.name}{" "}
//                   {p.host && <span className="host-badge">(HOST)</span>}
//                 </div>
//                 <div className="player-date">{p.birth_date}</div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Acción de iniciar o mensaje de espera */}
//         <div className="lobby-actions">
//           {isHost ? (
//             <>
//               <p className={`start-error ${error ? "active" : ""}`}>
//                 {error || " "}
//               </p>
//               <button
//                 type="button"
//                 className="start-button"
//                 onClick={handleStartClick}
//                 >
//                 Iniciar
//               </button>
//             </>
//           ) : (
//             <p className="waiting-text">
//               Esperando a que el anfitrión inicie la partida...
//             </p>
//           )}
//         </div>
//       </section>
//     </div>
//   );
// }

// export default Lobby;

import "./Lobby.css";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import playerService from "../../services/playerService";
import type { PlayerResponse } from "../../services/playerService";
import gameService from "../../services/gameService";
import { httpServerUrl } from "../../services/config";

function Lobby() {
  const location = useLocation();
  const navigate = useNavigate();

  const { game, player } = location.state || {};

  const [players, setPlayers] = useState<PlayerResponse[]>([]);
  const [error, setError] = useState<string>("");
  const [isHost, setIsHost] = useState<boolean>(false);

  // --- NUEVO: Detectar si el jugador actual es host ---
  // const currentPlayer = players.find((p) => p.player_id === player.player_id);
  // const isHost = currentPlayer?.host ?? false;

  // --- Efecto con WebSocket ---
  useEffect(() => {
    if (!game?.game_id) return;

    // 💡 CONSTRUCCIÓN DE LA URL WS
    // Reemplazamos http -> ws (ej: http://localhost:8000 -> ws://localhost:8000)
    const wsURL = `${httpServerUrl.replace("http", "ws")}/ws/lobby/${
      game.game_id
    }`;

    // 💬 Se crea la conexión WebSocket
    const ws = new WebSocket(wsURL);

    // 🟢 Cuando la conexión se establece
    ws.onopen = () => {
      console.log("✅ Conectado al WebSocket del lobby:", wsURL);
      setError("");
    };

    // 📩 Cuando llega un mensaje del servidor
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("MSJ WS", message);
        // Si el mensaje tiene un objeto "data" que es un string, lo parseamos también
        // Esto es común cuando un JSON anida a otro JSON como string.
        const dataContent =
          typeof message.data === "string"
            ? JSON.parse(message.data)
            : message.data;

        // 🔀 El servidor puede enviar diferentes tipos de mensajes
        if (message.type === "players") {
          // Actualizamos lista de jugadores en tiempo real
          const receivedPlayers: PlayerResponse[] = dataContent;

          // 1. Actualizamos la lista de jugadores
          setPlayers(receivedPlayers);

          const currentUser = receivedPlayers.find(
            (p: PlayerResponse) => p.player_id === player.player_id
          );
          setIsHost(currentUser?.host ?? false);
        } else if (message.type === "game") {
          // Si el juego empezó, redirigimos al tablero
          // PARSEO 2: Convierte el string de 'data' en el objeto del juego
          const gameData = JSON.parse(message.data);
          console.log("Datos del juego parseados:", gameData);

          // CONDICIÓN FINAL: Comprueba el estado en el objeto del juego ya parseado
          if (gameData.status === "in course")
            navigate("/game", {
              state: { game: dataContent, player },
            });
        }
      } catch (err) {
        console.error("Error procesando mensaje WS:", err);
      }
    };

    // 🔴 Manejamos errores
    ws.onerror = (event) => {
      console.error("❌ Error en WebSocket:", event);
      setError(
        "Error en la conexión en tiempo real. Intenta recargar la página."
      );
    };

    // 🔌 Cuando la conexión se cierra
    ws.onclose = () => {
      console.log("🔌 Conexión WebSocket cerrada.");
    };

    // 🧹 Limpieza cuando se desmonta el componente
    return () => {
      ws.close();
    };
  }, [game, player, navigate]);
  // ↑↑↑ TODO ESTE useEffect reemplaza el polling anterior ↑↑↑

  // --- ❌ ELIMINADO: Polling tradicional ---
  // useEffect(() => {
  //   fetchPlayers();
  //   const interval = setInterval(fetchPlayers, 3000);
  //   return () => clearInterval(interval);
  // }, [game]);

  // --- ✅ CONSERVADO: Validación para iniciar partida ---
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

  // --- ✅ CONSERVADO: Acción del host ---
  const handleStartClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      try {
        await gameService.startGame(game.game_id);
        // 🔁 El WS se encargará de avisar al resto que el juego cambió de estado
      } catch (err) {
        console.error("Error iniciando el juego:", err);
      }
    }
  };

  // --- ✅ CONSERVADO: Render UI ---
  if (!players.length) return <p>Cargando jugadores...</p>;

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
              Esperando a que el anfitrión inicie la partida ...
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Lobby;
