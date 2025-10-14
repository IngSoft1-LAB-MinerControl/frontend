import type { CardResponse } from "./cardService";
import { httpServerUrl } from "./config";
import type { SecretResponse } from "./secretService";

export interface Player {
  name: string;
  host: boolean;
  game_id: number;
  birth_date: string;
}

export interface PlayerResponse {
  player_id: number;
  name: string;
  host: boolean;
  game_id: number;
  birth_date: string;
  turn_order?: number;
}
export interface PlayerStateResponse {
  player_id: number;
  name: string;
  host: boolean;
  game_id: number;
  birth_date: string;
  turn_order?: number;
  cards : CardResponse[]
  secrets : SecretResponse[]
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
async function getPlayersByGame(gameId: number): Promise<PlayerResponse[]> {
  const response = await fetch(`${httpServerUrl}/lobby/players/${gameId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data: PlayerResponse[] = await response.json();
  return data;
}

const playerService = {
  createPlayer,
  getPlayersByGame,
};

export default playerService;
