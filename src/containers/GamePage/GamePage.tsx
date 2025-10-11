// import { useCallback, useEffect, useMemo, useState } from "react";
// import { useLocation } from "react-router-dom";
// import "./GamePage.css";
// import playerService from "../../services/playerService";
// import type { PlayerResponse } from "../../services/playerService";
// import gameService from "../../services/gameService";

// import TurnActions from "./TurnActions";
// import Opponent from "../../components/Opponent";
// import Decks from "../../components/Decks";
// import You from "../../components/MyHand";
// import EmptySlot from "../../components/EmptySlot";
// import type { GameResponse } from "../../services/gameService";
// import type { CardResponse } from "../../services/cardService";

// export default function GamePage() {
//   const location = useLocation();

//   const { game, player } = location.state ?? {};

//   const [players, setPlayers] = useState<PlayerResponse[]>([]);
//   const [currentGame, setCurrentGame] = useState<GameResponse>(game);
//   const [refreshYouTrigger, setRefreshYouTrigger] = useState(0); // forzar la actualización de You
//   const [lastDiscarded, setLastDiscarded] = useState<CardResponse | null>(null);

//   const [error, setError] = useState("");

//   if (!game) {
//     return (
//       <div className="game-page">
//         <div className="inline-error">
//           Falta el contexto de la partida. Volvé al lobby e ingresá nuevamente.
//         </div>
//       </div>
//     );
//   }

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

//   // Refrescar cada 3s
//   useEffect(() => {
//     fetchPlayers();
//     const t = setInterval(fetchPlayers, 3000);
//     return () => clearInterval(t);
//   }, [game.game_id]);

//   // Player actual
//   const currentPlayer = players.find((p) => p.player_id === player.player_id);

//   useEffect(() => {
//     const interval = setInterval(async () => {
//       try {
//         const updatedGame = await gameService.getGameById(currentGame.game_id);
//         setCurrentGame(updatedGame);
//       } catch (error) {
//         console.error("Error al actualizar el juego:", error);
//       }
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [game.game_id]);

//   // Determinar si es mi turno
//   const isMyTurn = useMemo(() => {
//     if (
//       !currentGame ||
//       !currentPlayer ||
//       currentPlayer.turn_order === undefined ||
//       currentGame.current_turn === undefined
//     ) {
//       return false;
//     }
//     return currentPlayer.turn_order === currentGame.current_turn;
//   }, [currentGame, currentPlayer]);

//   // Distribución visual: yo abajo; 3 arriba; 1 izq; 1 der
//   const distribution = useMemo(() => {
//     if (!players.length)
//       return {
//         bottom: null as PlayerResponse | null,
//         top: [] as PlayerResponse[],
//         left: null as PlayerResponse | null,
//         right: null as PlayerResponse | null,
//       };

//     const me = currentPlayer ?? players[0]; // fallback por si no encontró
//     const others = players.filter((p) => p !== me);

//     const top = others.slice(0, 3); // hasta 3 arriba
//     const left = others.slice(3, 4)[0] ?? null; // 4to a la izquierda
//     const right = others.slice(4, 5)[0] ?? null; // 5to a la derecha

//     return { bottom: me, top, left, right };
//   }, [players, currentPlayer]);

//   const handleTurnUpdated = useCallback((updatedGame: GameResponse | null) => {
//     if (updatedGame) {
//       setCurrentGame(updatedGame);
//     }
//     setRefreshYouTrigger((prev) => prev + 1); // <-- Actualiza el trigger para que You se refresque
//   }, []);

//   return (
//     <div className="game-page">
//       {/* Capa de mesa encima del fondo estético */}
//       <div className="game-table-overlay" aria-hidden="true" />

//       {/* Header */}
//       <header className="game-header">
//         <h1 className="game-title">{game?.name ?? "Partida"}</h1>
//       </header>

//       {/* MESA: TOP | MIDDLE (left/center/right) | BOTTOM */}
//       <main className="table-grid">
//         {/* TOP: hasta 3 oponentes */}
//         <section className="area-top">
//           <div className="opponents-row">
//             {distribution.top.map((p) => (
//               <Opponent key={p.player_id} player={p} />
//             ))}
//           </div>
//         </section>

//         {/* LEFT y RIGHT: 1 oponente cada uno */}
//         <section className="area-left">
//           {distribution.left ? (
//             <Opponent player={distribution.left} />
//           ) : (
//             <EmptySlot />
//           )}
//         </section>

//         {/* CENTER: mazos */}
//         <section className="area-center">
//           <Decks lastDiscarded={lastDiscarded} />
//         </section>

//         <section className="area-right">
//           {distribution.right ? (
//             <Opponent player={distribution.right} />
//           ) : (
//             <EmptySlot />
//           )}
//         </section>

//         {/* BOTTOM: YO (mano y secretos grandes) */}
//         <section className="area-bottom">
//           {distribution.bottom ? (
//             <You
//               player={distribution.bottom}
//               refreshTrigger={refreshYouTrigger}
//             />
//           ) : (
//             <div className="empty-hint">Esperando jugadores…</div>
//           )}

//           {/* acciones de turno */}
//           {isMyTurn && (
//             <div className="turn-actions-container">
//               <TurnActions
//                 gameId={currentGame.game_id}
//                 playerId={player.player_id}
//                 onTurnUpdated={handleTurnUpdated}
//                 onCardDiscarded={(card) => setLastDiscarded(card)}
//               />
//             </div>
//           )}
//         </section>
//       </main>

//       {/* Mensaje de error (si valida) */}
//       {error && <div className="inline-error">{error}</div>}
//     </div>
//   );
// }

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GamePage.css";
import type { PlayerStateResponse } from "../../services/playerService";
import { httpServerUrl } from "../../services/config"; // Importar la URL base

import TurnActions from "./TurnActions";
import Opponent from "../../components/Opponent";
import Decks from "../../components/Decks";
import You from "../../components/MyHand";
import EmptySlot from "../../components/EmptySlot";
import type { GameResponse } from "../../services/gameService";
import type { CardResponse } from "../../services/cardService";

export default function GamePage() {
  const location = useLocation();
  const navigate = useNavigate(); // Agregamos navigate para futuras redirecciones

  const { game, player } = location.state ?? {};

  const [players, setPlayers] = useState<PlayerStateResponse[]>([]);
  const [currentGame, setCurrentGame] = useState<GameResponse>(game);
  const [lastDiscarded, setLastDiscarded] = useState<CardResponse | null>(null);
  const [error, setError] = useState("");

  if (!game) {
    return (
      <div className="game-page">
        <div className="inline-error">
          Falta el contexto de la partida. Volvé al lobby e ingresá nuevamente.
        </div>
      </div>
    );
  }

  // const fetchDiscardPile = useCallback(async () => {
  //   try {
  //     if (!game?.game_id) return;
  //     const pile = await ;
  //     setLastDiscarded();
  //   } catch (err) {
  //     console.error("Error al obtener la ultims carta de descarte:", err); // Asegurarse de que no quede null en caso de error
  //   }
  // }, [game?.game_id]);

  // ------------------- INICIO DE LOS CAMBIOS -------------------

  //  REEMPLAZAMOS LOS DOS useEffect de polling CON ESTE ÚNICO useEffect para WebSockets
  useEffect(() => {
    if (!game?.game_id) return;

    // Construimos la URL del WebSocket para esta partida específica
    const wsURL = `${httpServerUrl.replace("http", "ws")}/ws/game/${
      game.game_id
    }`;
    const ws = new WebSocket(wsURL);

    ws.onopen = () => {
      console.log(`✅ Conectado al WebSocket de la partida: ${wsURL}`);
      setError("");
    };

    // Escuchamos todos los mensajes que el servidor envía para esta partida
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("MSJ WS", message);
        // Lógica para manejar datos que pueden ser string o ya un objeto
        // Esta es la clave: si es un string, lo parseamos. Si no, lo usamos directamente.
        const dataContent =
          typeof message.data === "string"
            ? JSON.parse(message.data)
            : message.data;
        // Usamos un switch para manejar los diferentes tipos de actualizaciones
        switch (message.type) {
          case "playersState":
            // Actualiza la lista de jugadores
            //Parseo a JSON primero de string
            // const playersData = JSON.parse(message.data)
            setPlayers(dataContent);
            break;

          case "gameUpdated":
            // Actualiza el estado completo de la partida (ej: cambio de turno)

            setCurrentGame(dataContent);
            break;

          case "droppedCards":
            // Actualiza la última carta descartada
            console.log("SE RECIBIERON LAS CARTAS DESCARTADAS", dataContent);
            setLastDiscarded(dataContent[0]);
            // Forzamos un refresh de la mano por si la carta vino de ahí
            // setRefreshYouTrigger((prev) => prev + 1);
            break;

          // Aquí se podrían agregar más casos, como "player_played_card", "game_over", etc.
          default:
            console.log("Mensaje WS recibido sin tipo conocido:", message);
        }
      } catch (err) {
        console.error("Error procesando mensaje WS:", err);
      }
    };

    ws.onerror = (event) => {
      console.error("❌ Error en WebSocket:", event);
      setError(
        "Error en la conexión en tiempo real. Intenta recargar la página."
      );
    };

    ws.onclose = () => {
      console.log("🔌 Conexión WebSocket de la partida cerrada.");
    };

    // cerramos la conexión cuando el componente se desmonta
    return () => {
      ws.close();
    };
  }, [game.game_id, navigate]); // Dependemos solo de game.game_id para no reconectar innecesariamente

  //  --- SE ELIMINAN LOS DOS useEffect CON setInterval ---
  /*
  useEffect(() => {
    fetchPlayers();
    const t = setInterval(fetchPlayers, 3000);
    return () => clearInterval(t);
  }, [game.game_id]);

  useEffect(() => {
    const interval = setInterval(async () => {
      // ...código de polling de juego...
    }, 3000);
    return () => clearInterval(interval);
  }, [game.game_id]);
  */

  // ------------------- FIN DE LOS CAMBIOS -------------------

  // El resto de la lógica del componente permanece igual,
  // ya que reacciona a los cambios de estado que ahora son actualizados por el WebSocket.

  const currentPlayer = players.find((p) => p.player_id === player.player_id);
  // --- BLOQUE DE DEPURACIÓN PARA isMyTurn ---
  /* 
console.log("--- DEBUG: CÁLCULO DE TURNO ---");
  console.log("Objeto 'player' del Lobby:", player);
  console.log("Objeto 'currentGame':", currentGame);
  console.log("Objeto 'currentPlayer' (encontrado en la lista):", currentPlayer);

  if (currentGame) {
    console.log("  ➡️ Turno actual del juego (current_turn):", currentGame.current_turn);
  }
  if (currentPlayer) {
    console.log("  ➡️ Mi orden de turno (turn_order):", currentPlayer.turn_order);
  }
  console.log("---------------------------------");
  // --- FIN DEL BLOQUE DE DEPURACIÓN ---*/
  const isMyTurn = useMemo(() => {
    if (
      !currentGame ||
      !currentPlayer ||
      currentPlayer.turn_order === undefined ||
      currentGame.current_turn === undefined
    ) {
      return false;
    }
    return currentPlayer.turn_order === currentGame.current_turn;
  }, [currentGame, currentPlayer]);

  const distribution = useMemo(() => {
    // ... (sin cambios)
    if (!players.length)
      return {
        bottom: null as PlayerStateResponse | null,
        top: [] as PlayerStateResponse[],
        left: null as PlayerStateResponse | null,
        right: null as PlayerStateResponse | null,
      };

    const me = currentPlayer ?? players[0];
    const others = players.filter((p) => p !== me);

    const top = others.slice(0, 3);
    const left = others.slice(3, 4)[0] ?? null;
    const right = others.slice(4, 5)[0] ?? null;

    return { bottom: me, top, left, right };
  }, [players, currentPlayer]);

  const handleTurnUpdated = useCallback((updatedGame: GameResponse | null) => {
    if (updatedGame) {
      setCurrentGame(updatedGame);
    }
  }, []);

  return (
    <div className="game-page">
      <div className="game-table-overlay" aria-hidden="true" />
      <header className="game-header">
        <h1 className="game-title">{game?.name ?? "Partida"}</h1>
      </header>
      <main className="table-grid">
        <section className="area-top">
          <div className="opponents-row">
            {distribution.top.map((p) => (
              <Opponent key={p.player_id} player={p} />
            ))}
          </div>
        </section>
        <section className="area-left">
          {distribution.left ? (
            <Opponent player={distribution.left} />
          ) : (
            <EmptySlot />
          )}
        </section>
        <section className="area-center">
          <Decks lastDiscarded={lastDiscarded} />
        </section>
        <section className="area-right">
          {distribution.right ? (
            <Opponent player={distribution.right} />
          ) : (
            <EmptySlot />
          )}
        </section>
        <section className="area-bottom">
          {distribution.bottom ? (
            <You player={distribution.bottom} />
          ) : (
            <div className="empty-hint">Esperando jugadores…</div>
          )}
          {isMyTurn && (
            <div className="turn-actions-container">
              <TurnActions
                gameId={currentGame.game_id}
                playerId={player.player_id}
                onTurnUpdated={handleTurnUpdated}
              />
            </div>
          )}
        </section>
      </main>
      {error && <div className="inline-error">{error}</div>}
    </div>
  );
}
