import type { PlayerStateResponse } from "../services/playerService";
import CardBase from "./Cards/CardBase";
import Secret from "./Cards/Secret";
// ¡Tampoco se necesitan hooks ni servicios aquí!

// La prop 'refreshTrigger' ya no es necesaria.
interface YouProps {
  player: PlayerStateResponse;
}

export default function You({ player }: YouProps) {
  return (
    <div className="you">
      <div className="you-name">{player.name}</div>

      <div className="you-secrets">
        {/* Mapeamos directamente desde player.secrets que viene en las props */}
        {player.secrets.map((secret) => (
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
        {/* Mapeamos directamente desde player.cards que viene en las props */}
        {player.cards.map((card) => (
          <CardBase
            key={card.card_id}
            card_id={card.card_id}
            shown={true} // Para ti, las cartas están boca arriba
            size="medium"
          />
        ))}
      </div>
    </div>
  );
}