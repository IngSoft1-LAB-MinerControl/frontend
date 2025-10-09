import { useEffect, useRef, useState } from "react";
import type { PlayerResponse } from "../services/playerService";
import CardBase from "./Cards/CardBase";
import Secret from "./Cards/Secret";
import cardService, { type CardResponse } from "../services/cardService";
import secretService, { type SecretResponse } from "../services/secretService";

interface YouProps {
  player: PlayerResponse;
  refreshTrigger: number;
}

export default function You({ player, refreshTrigger }: YouProps) {
  const [myCards, setMyCards] = useState<CardResponse[]>([]);
  const [mySecrets, setMySecrets] = useState<SecretResponse[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [cards, secrets] = await Promise.all([
          cardService.getCardsByPlayer(player.player_id),
          secretService.getSecretsByPlayer(player.player_id),
        ]);
        setMyCards(cards);
        setMySecrets(secrets);
      } catch (error) {
        console.error("Error al cargar datos del juagdor:", error);
        setMyCards([]);
        setMySecrets([]);
      }
    }
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [player.player_id, refreshTrigger]);

  return (
    <div className="you">
      <div className="you-name">{player.name}</div>

      <div className="you-secrets">
        {mySecrets.map((secret: SecretResponse) => (
          <Secret
            key={secret.secret_id}
            secret_id={secret.secret_id}
            mine={true}
            revealed={secret.revealed}
            size="medium"
          />
        ))}
      </div>

      <div className="you-hand">
        {myCards.map((card: CardResponse) => (
          <CardBase
            key={card.card_id}
            card_id={card.card_id}
            shown={true}
            size="medium"
          />
        ))}
      </div>
    </div>
  );
}
