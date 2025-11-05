import { httpServerUrl } from "./config";

async function cardsOffTheTable(playerId: number) {
  const response = await fetch(
    `${httpServerUrl}/event/cards_off_table/${playerId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al ejecutar Cards Off The Table");
  }

  return await response.json();
}

async function andThenThereWasOneMore(
  newSecretPlayerId: number,
  secretId: number
) {
  const response = await fetch(
    `${httpServerUrl}/event/one_more/${newSecretPlayerId},${secretId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al ejecutar One More Event");
  }

  return await response.json();
}

async function delayEscape(
  gameId: number,
  playerId: number,
  cardIds: number[]
): Promise<any> {
  const response = await fetch(
    `${httpServerUrl}/event/delay_escape/${gameId},${playerId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        card_ids: cardIds,
      }),
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al ejecutar Delay Escape");
  }
  return await response.json();
}

async function earlyTrainPaddington(
  gameId: number,
  playerId: number
): Promise<any> {
  const response = await fetch(
    `${httpServerUrl}/event/early_train_paddington/${gameId},${playerId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.detail ||
        "Error al ejecutar el evento Early Train to Paddington"
    );
  }

  return await response.json();
}

async function initiateCardTrade(
  trader_id: number,
  tradee_id: number,
  card_id: number
) {
  const response = await fetch(
    `${httpServerUrl}/event/card_trade/initiate/${trader_id},${tradee_id},${card_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al inicializar el card trade");
  }

  return await response.json();
}

async function cardTrade(player_id: number, card_id: number) {
  const response = await fetch(
    `${httpServerUrl}/event/card_trade/select_card/${player_id}/${card_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al finalizar el card trade");
  }

  return await response.json();
}

const eventService = {
  cardsOffTheTable,
  andThenThereWasOneMore,
  delayEscape,
  earlyTrainPaddington,
  initiateCardTrade,
  cardTrade,
};

export default eventService;
