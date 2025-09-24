import { httpServerUrl } from "./config";

export interface Player {
  name: string;
  birth_date: string;
  host: boolean;
  game_id: number;
}

export interface PlayerResponse {
  id: number;
  game_id: number;
}

async function createPlayer(player: Player): Promise<PlayerResponse> {
  const response = await fetch(`${httpServerUrl}/players`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // el cuerpo de la petición (el Player) está en formato JSON
    },
    body: JSON.stringify(player), // como en content-type dijimos que era applicacition/json, el cuerpo de la peticion POST debe ser un json y no JS. Entonces convertimos el objeto JS a un JSON
  });

  const data: PlayerResponse = await response.json(); // parseamos la respuesta del backend {"id: _"} a un json
  return data; // devolvemos un id
}

const playerService = {
  createPlayer,
};

export default playerService;
