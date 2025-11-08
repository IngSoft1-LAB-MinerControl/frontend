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

// La idea de este endpoint es iniciar el dead_Card_folly en donde a cada jugador le vamos a modificar (desde el backend) el pending_action  a todos los jugadores de la partida para forzarlos a seleccionar una carta . El argumento de card_id es para descartar la carta del evento simplemente.
async function initiateDeadCardFolly(
  player_id: number,
  gameId: number,
  card_id: number
) {
  const response = await fetch(
    `${httpServerUrl}/event/dead_card_folly/initiate/${player_id}/${gameId}/${card_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.detail || "Error al inicializar el Dead Card Folly"
    );
  }

  return await response.json();
}

// Este evento avanza al paso de tradear, los parametros definidos son claros. La card_id es el id de la carta que le vamos a enviar a to_player_id
async function follyTrade(
  from_player_id: number,
  to_player_id: number,
  card_id: number
) {
  const response = await fetch(
    `${httpServerUrl}/event/dead_card_folly/select_card/${from_player_id}/${to_player_id}/${card_id}`,
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
  initiateDeadCardFolly,
  follyTrade,
};

export default eventService;
