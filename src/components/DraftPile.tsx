// DraftPile.tsx
import { useState } from "react";
import "./DraftPile.css";
import type { CardResponse } from "../services/cardService";
import Detective from "./Cards/Detectives";
import Event from "./Cards/Events";

interface DraftPileProps {
  cards: CardResponse[];
  selectedCard: CardResponse | null;
  onCardSelect: (card: CardResponse) => void;
  isMyTurn: boolean;
}

export default function DraftPile({
  cards,
  selectedCard,
  onCardSelect,
  isMyTurn,
}: DraftPileProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleDraftView = () => setExpanded((v) => !v);

  return (
    <div className="draft-pile-container">
      <div className={`draft-pile ${expanded ? "expanded" : "compact"}`}>
        {cards.length > 0 && (
          <button
            className="draft-toggle-button inline"
            onClick={toggleDraftView}
            title={
              expanded ? "Reducir el draft" : "Ver cartas del draft más claras"
            }
          >
            {expanded ? "volver" : "ver draft"}
          </button>
        )}

        {cards.length > 0
          ? cards.map((card) => {
              const isSelected = card.card_id === selectedCard?.card_id;
              const cardSize = expanded ? "large" : "mini";
              return (
                <div
                  key={card.card_id}
                  className={`draft-card-container ${
                    isMyTurn ? "clickable" : ""
                  } ${isSelected ? "selected" : ""}`}
                  onClick={() => isMyTurn && onCardSelect(card)}
                >
                  {card.type === "detective" ? (
                    <Detective
                      card_id={card.card_id}
                      shown={true}
                      size={cardSize}
                      name={card.name}
                    />
                  ) : (
                    <Event
                      card_id={card.card_id}
                      shown={true}
                      size={cardSize}
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
