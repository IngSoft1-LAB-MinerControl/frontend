import "./DraftPile.css";
import type { CardResponse } from "../services/cardService";
import Detective from "./Cards/Detectives";
import Event from "./Cards/Events";

interface DraftPileProps {
  cards: CardResponse[];
}

export default function DraftPile({ cards }: DraftPileProps) {
  return (
    <div className="draft-pile-container">
      <h3 className="draft-pile-title">Draft</h3>
      <div className="draft-pile">
        {cards.length > 0
          ? cards.map((card) =>
              card.type === "detective" ? (
                <Detective
                  key={card.card_id}
                  card_id={card.card_id}
                  shown={true}
                  size="mini"
                  name={card.name}
                  // quantity_set={lastDiscarded.quantity_set}
                />
              ) : (
                <Event
                  key={card.card_id}
                  card_id={card.card_id}
                  shown={true}
                  size="mini"
                  name={card.name}
                  // quantity_set={lastDiscarded.quantity_set}
                />
              )
            )
          : Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="draft-placeholder" />
            ))}
      </div>
    </div>
  );
}
