import { httpServerUrl } from "./config";

export interface Game {
  name: string;
  min_players: number;
  max_players: number;
  status: string;
}

export interface GameResponse {
  game_id: number;
  name: string;
  min_players: number;
  max_players: number;
  status: string;
}

async function createGame(game: Game): Promise<GameResponse> {
  const response = await fetch(`${httpServerUrl}/games`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(game),
  });

  const data: GameResponse = await response.json();
  return data;
}

const gameService = {
  createGame,
};

export default gameService;
