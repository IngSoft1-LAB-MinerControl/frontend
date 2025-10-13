import CardBase from "./Cards/CardBase";
import type { CardResponse } from "../services/cardService";
import "./Decks.css";

interface DeckProps {
  lastDiscarded: CardResponse | null;
  cardsLeftCount: number | null;
}
export default function Decks({ lastDiscarded, cardsLeftCount }: DeckProps) {
  return (
    <div className="decks">
      <div className="deck draw-deck" title="Mazo para robar">
        {cardsLeftCount !== null && cardsLeftCount >= 0 && (
          <div className="card-counter">{cardsLeftCount}</div>
        )}
        <CardBase key="draw" shown={false} size="medium" />
      </div>
      <div className="deck discard-deck" title="Descarte (tope visible)">
        {lastDiscarded ? (
          <CardBase
            key={lastDiscarded.card_id}
            card_id={lastDiscarded.card_id}
            shown={true}
            size="medium"
          />
        ) : (
          <CardBase key="discard" shown={false} size="medium" />
        )}
      </div>
    </div>
  );
}
