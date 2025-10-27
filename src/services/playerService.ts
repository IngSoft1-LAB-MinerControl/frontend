import { httpServerUrl } from "./config";
import type { CardResponse } from "./cardService";
import type { SecretResponse } from "./secretService";
import type { SetResponse } from "./setService";

export interface Player {
  name: string;
  host: boolean;
  game_id: number;
  birth_date: string;
  avatar: string;
}

export interface PlayerResponse {
  player_id: number;
  name: string;
  host: boolean;
  game_id: number;
  birth_date: string;
  turn_order?: number;
  avatar: string;
}
export interface PlayerStateResponse {
  player_id: number;
  name: string;
  host: boolean;
  game_id: number;
  birth_date: string;
  turn_order?: number;
  cards: CardResponse[];
  secrets: SecretResponse[];
  sets: SetResponse[];
  isSelected: boolean;
}

async function createPlayer(player: Player): Promise<PlayerStateResponse> {
  const response = await fetch(`${httpServerUrl}/players`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(player),
  });

  if (!response.ok) {
    // Si la respuesta es un error (como 400)
    const errorData = await response.json(); // Lee el JSON de error de FastAPI
    console.error("Error detallado del backend:", errorData);
    throw new Error(
      `Error al crear jugador: ${JSON.stringify(errorData.detail)}`
    );
  }

  const data: PlayerStateResponse = await response.json();
  return data;
}
async function getPlayersByGame(
  gameId: number
): Promise<PlayerStateResponse[]> {
  const response = await fetch(`${httpServerUrl}/lobby/players/${gameId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data: PlayerStateResponse[] = await response.json();
  return data;
}

async function selectPlayer(playerId: number): Promise<void> {
  const response = await fetch(`${httpServerUrl}/select/player/${playerId}`, {
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error(`Error al seleccionar jugador: ${response.statusText}`);
  }

  return;
}

async function unselectPlayer(playerId: number): Promise<void> {
  const response = await fetch(`${httpServerUrl}/unselect/player/${playerId}`, {
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error(`Error al deseleccionar jugador: ${response.statusText}`);
  }

  return;
}

const playerService = {
  createPlayer,
  getPlayersByGame,
  selectPlayer,
  unselectPlayer,
};

export default playerService;
