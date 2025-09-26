import { httpServerUrl } from "./config";

export interface Player {
  name: string;
  host: boolean;
  game_id: number;
  birth_date: string;
}

export interface PlayerResponse {
  id: number;
}

async function createPlayer(player: Player): Promise<PlayerResponse> {
  const response = await fetch(`${httpServerUrl}/players`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(player),
  });

  const data: PlayerResponse = await response.json();
  return data;
}
async function getPlayersByGame(gameId: number): Promise<Player[]> {
  const response = await fetch(`${httpServerUrl}/lobby/players/${gameId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data: Player[] = await response.json();
  return data;
}

const playerService = {
  createPlayer,
  getPlayersByGame,
};

export default playerService;
