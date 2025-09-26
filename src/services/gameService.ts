import { httpServerUrl } from "./config";

export interface Game {
  name: string;
  min_players: number;
  max_players: number;
  status: string;
  game_id?: number;
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
  return data;
}

const gameService = {
  createGame,
  getGames,
};

export default gameService;

async function getGames(): Promise<Game[]> {
  const response = await fetch(`${httpServerUrl}/games`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();

  return data;
}
