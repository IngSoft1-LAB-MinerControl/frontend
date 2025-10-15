import type { PlayerStateResponse } from "../services/playerService";
import Detective from "./Cards/Detectives";
import Event from "./Cards/Events";

import Secret from "./Cards/Secret";
import "./Opponent.css";

interface OpponentProps {
  player: PlayerStateResponse;
}

export default function Opponent({ player }: OpponentProps) {
  return (
    <div className="opponent">
      <div className="op-name">{player.name}</div>
      <div className="op-hand">
        {/* Mapeamos directamente desde player.cards que viene en las props */}
        {player.cards.map((card, index) =>
          card.type === "detectives" ? (
            <Detective
              key={`op-card-${player.player_id}-${index}`}
              card_id={card.card_id}
              shown={false} // Para oponentes, las cartas están boca abajo
              size="mini"
              name={card.name}
            />
          ) : (
            <Event
              key={`op-card-${player.player_id}-${index}`}
              card_id={card.card_id}
              shown={false} // Para oponentes, las cartas están boca abajo
              size="mini"
              name={card.name}
            />
          )
        )}
      </div>

      <div className="op-secrets">
        {/* Mapeamos directamente desde player.secrets que viene en las props */}
        {player.secrets.map((secret) => (
          <Secret
            key={`op-secret-${player.player_id}-${secret.secret_id}`}
            secret_id={secret.secret_id}
            mine={false}
            revealed={secret.revealed}
            murderer={secret.murderer}
            accomplice={secret.accomplice}
            size="mini"
          />
        ))}
      </div>
    </div>
  );
}
