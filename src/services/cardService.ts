import { httpServerUrl } from "./config";

export interface CardResponse {
  card_id: number;
  game_id: number;
  player_id: number;
  type: string;
  name: string;
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

async function discardAuto(player_id: number): Promise<CardResponse[]> {
  const response = await fetch(`${httpServerUrl}/cards/drop/${player_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.detail || "Error al descartar la carta automaticamente"
    );
  }
  return response.json();
}

async function discardSelectedList(
  player_id: number,
  card_ids: number[]
): Promise<CardResponse[]> {
  const body = {
    card_ids: card_ids,
  };
  const response = await fetch(
    `${httpServerUrl}/cards/game/drop_list/${player_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.detail || "Error al descartar la carta seleccionada"
    );
  }
  return response.json();
}

async function drawCard(
  player_id: number,
  game_id: number
): Promise<CardResponse> {
  const response = await fetch(
    `${httpServerUrl}/cards/pick_up/${player_id},${game_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al levantar carta");
  }
  return response.json();
}

async function getDraftPile(gameId: number): Promise<CardResponse[]> {
  const response = await fetch(`${httpServerUrl}/cards/draft/${gameId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

  const data: CardResponse[] = await response.json();
  return data;
}

const cardService = {
  getCardsByPlayer,
  discardAuto,
  drawCard,
  discardSelectedList,
  getDraftPile,
};

export default cardService;
