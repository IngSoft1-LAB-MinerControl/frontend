import "./DraftPile.css";
import CardBase from "./Cards/CardBase";
import type { CardResponse } from "../services/cardService";

interface DraftPileProps {
  cards: CardResponse[];
}

export default function DraftPile({ cards }: DraftPileProps) {
  return (
    <div className="draft-pile-container">
      <h3 className="draft-pile-title">Draft</h3>
      <div className="draft-pile">
        {cards.length > 0
          ? cards.map((card) => (
              <CardBase
                key={card.card_id}
                card_id={card.card_id}
                shown={true}
                size="medium"
              />
            ))
          : Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="draft-placeholder" />
            ))}
      </div>
    </div>
  );
}
