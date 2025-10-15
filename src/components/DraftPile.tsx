import "./DraftPile.css";
import type { CardResponse } from "../services/cardService";
import Detective from "./Cards/Detectives";
import Event from "./Cards/Events";

interface DraftPileProps {
  cards: CardResponse[];
  selectedCardId: number | null;
  onCardSelect: (id: number) => void;
  isMyTurn: boolean;
}

export default function DraftPile({
  cards,
  selectedCardId,
  onCardSelect,
  isMyTurn,
}: DraftPileProps) {
  return (
    <div className="draft-pile-container">
      <h3 className="draft-pile-title">Draft</h3>
      <div className="draft-pile">
        {cards.length > 0
          ? cards.map((card) => {
              const isSelected = card.card_id === selectedCardId;
              return (
                <div
                  key={card.card_id}
                  className={`draft-card-container ${
                    isMyTurn ? "clickable" : ""
                  } ${isSelected ? "selected" : ""}`}
                  onClick={() => isMyTurn && onCardSelect(card.card_id)}
                >
                  {card.type === "detective" ? (
                    <Detective
                      card_id={card.card_id}
                      shown={true}
                      size="mini"
                      name={card.name}
                    />
                  ) : (
                    <Event
                      card_id={card.card_id}
                      shown={true}
                      size="mini"
                      name={card.name}
                    />
                  )}
                </div>
              );
            })
          : Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="draft-placeholder" />
            ))}
      </div>
    </div>
  );
}
