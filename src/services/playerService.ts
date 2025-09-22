import { httpServerUrl } from "./config";

interface Player {
  name: string;
  datebirth: string;
  owner: boolean;
}

async function createPlayer(player: Player): Promise<string> {
  const response = await fetch(`${httpServerUrl}/players`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(player), // se convierte al player en un JSON
  });
  if (!response.ok) {
    throw new Error("Error al crear jugador");
  }

  const data = (await response.json()) as { player_id: string }; // parseamos JSON
  return data.player_id; // devolvemos un string
}

const playerService = {
  createPlayer,
};

export default playerService;
