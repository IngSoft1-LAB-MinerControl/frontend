import { httpServerUrl } from "./config";

export interface SecretResponse {
  secret_id: number;
  player_id?: number;
  game_id: number;
  murderer: boolean;
  accomplice: boolean;
  revealed: boolean;
}

async function getSecretsByPlayer(
  player_id: number
): Promise<SecretResponse[]> {
  const response = await fetch(`${httpServerUrl}/lobby/secrets/${player_id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();

  return data;
}

const secretService = {
  getSecretsByPlayer,
};

export default secretService;
