import { useEffect, useRef, useState } from "react";
import type { PlayerResponse } from "../services/playerService";
import secretService, { type SecretResponse } from "../services/secretService";
import CardBase from "./Cards/CardBase";
import Secret from "./Cards/Secret";
import cardService, { type CardResponse } from "../services/cardService";

export default function Opponent({ player }: { player: PlayerResponse }) {
  const [opCards, setOpCards] = useState<CardResponse[]>([]);
  const [opSecrets, setOpSecrets] = useState<SecretResponse[]>([]);

  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    async function loadData() {
      const [cards, secrets] = await Promise.all([
        cardService.getCardsByPlayer(player.player_id),
        secretService.getSecretsByPlayer(player.player_id),
      ]);
      setOpCards(cards);
      setOpSecrets(secrets);
      console.log("Secretos cargados:", secrets); // ¡Agrega esto!
    }
    loadData();
  }, [player.player_id]);

  return (
    <div className="opponent">
      <div className="op-name">{player.name}</div>

      <div className="op-hand">
        {opCards.map((card: CardResponse) => (
          <CardBase
            key={card.card_id}
            card_id={card.card_id}
            shown={false}
            size="mini"
          />
        ))}
      </div>

      <div className="op-secrets">
        {opSecrets.map((secret: SecretResponse) => (
          <Secret
            key={`op-secret-${player.player_id}-${secret.secret_id}`}
            secret_id={secret.secret_id}
            mine={false}
            revealed={secret.revealed}
            size="mini"
          />
        ))}
      </div>
    </div>
  );
}
