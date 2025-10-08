import { useEffect, useRef, useState } from "react";
import type { PlayerResponse } from "../services/playerService";
import CardBase from "./Cards/CardBase";
import Secret from "./Cards/Secret";
import cardService, { type CardResponse } from "../services/cardService";
import secretService, { type SecretResponse } from "../services/secretService";

export default function You({ player }: { player: PlayerResponse }) {
  const [myCards, setMyCards] = useState<CardResponse[]>([]);
  const [mySecrets, setMySecrets] = useState<SecretResponse[]>([]);

  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    async function loadData() {
      const [cards, secrets] = await Promise.all([
        cardService.getCardsByPlayer(player.player_id),
        secretService.getSecretsByPlayer(player.player_id),
      ]);
      setMyCards(cards);
      setMySecrets(secrets);
    }

    loadData();
  }, [player.player_id]);

  return (
    <div className="you">
      <div className="you-name">{player.name}</div>

      <div className="you-secrets">
        {mySecrets.map((secret: SecretResponse) => (
          <Secret
            key={secret.s_id}
            s_id={secret.s_id}
            shown={secret.revealed}
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
