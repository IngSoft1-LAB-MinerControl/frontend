import { httpServerUrl } from "./config";

export interface CardResponse {
  card_id: number;
  game_id: number;
  player_id: number;
  type: string;
  picked_up: boolean;
  dropped: boolean;
}

async function getCardsByPlayer(player_id: number): Promise<CardResponse[]> {
  const response = await fetch(
    `${httpServerUrl}/lobby/list/cards/${player_id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = await response.json();

  return data;
}

const cardService = {
  getCardsByPlayer,
};

export default cardService;
