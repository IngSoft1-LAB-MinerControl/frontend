import { httpServerUrl } from "./config";

export interface Game {
  name: string;
  min_players: number;
  max_players: number;
  status: string;
}

export interface GameResponse {
  game_id: number;
}

async function createGame(game: Game): Promise<GameResponse> {
  const response = await fetch(`${httpServerUrl}/games`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(game),
  });

  const data = await response.json();
  console.log("⬅️ Respuesta createGame:", data);

  return data; // se devuelve el objeto ya parseado
}

const gameService = {
  createGame,
};

export default gameService;
