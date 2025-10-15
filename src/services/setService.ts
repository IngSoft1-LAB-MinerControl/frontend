import type { CardResponse } from "./cardService";
import { httpServerUrl } from "./config";

export interface SetResponse {
  game_id: number;
  player_id: number;
  set_id: number;
  name: string;
  detective: CardResponse[];
}

async function getSets(player_id: number): Promise<SetResponse[]> {
  const response = await fetch(`${httpServerUrl}/sets/list/${player_id}}"`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al obtener sets");
  }
  return response.json();
}

async function playSet(c1_id: number, c2_id: number): Promise<SetResponse> {
  const response = await fetch(`${httpServerUrl}/sets_of2/${c1_id},${c2_id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al jugar set");
  }
  return response.json();
}

const setService = {
  getSets,
  playSet,
};

export default setService;
