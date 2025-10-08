import type { PlayerResponse } from "../services/playerService";
import CardBase from "./Cards/CardBase";
import Secret from "./Cards/Secret";

export default function Opponent({ player }: { player: PlayerResponse }) {
  return (
    <div className="opponent">
      <div className="op-name">{player.name}</div>

      <div className="op-hand">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardBase
            key={`op-hand-${player.player_id}-${i}`}
            shown={false}
            size="mini"
          />
        ))}
      </div>

      <div className="op-secrets">
        {Array.from({ length: 3 }).map((_, i) => (
          <Secret
            key={`op-secret-${player.player_id}-${i}`}
            shown={false}
            size="mini"
          />
        ))}
      </div>
    </div>
  );
}
