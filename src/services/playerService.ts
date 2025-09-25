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
  console.log("➡️ Enviando player:", player); // 👈 log para ver el body
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

const playerService = {
  createPlayer,
};

export default playerService;
