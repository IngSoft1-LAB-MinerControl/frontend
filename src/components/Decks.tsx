import { useState } from "react";
import CardBase from "./Cards/CardBase";
import type { CardResponse } from "../services/cardService";
import "./Decks.css";

interface DeckProps {
  discardedCards: CardResponse[]; // ahora recibimos varias cartas
  isMyTurn: boolean;
}
export default function Decks({ discardedCards, isMyTurn }: DeckProps) {
  const [showDiscarded, setShowDiscarded] = useState(false);
  const lastDiscarded = discardedCards.length > 0 ? discardedCards[0] : null;
  const handleDiscardClick = () => {
    setShowDiscarded((prev) => !prev);
  };

  return (
    <div className="decks">
      <div className="deck draw-deck" title="Mazo para robar">
        <CardBase key="draw" shown={false} size="mini" />
      </div>

      <div
        className="deck discard-deck"
        title="Descarte (tope visible)"
        onClick={handleDiscardClick}
      >
        {lastDiscarded ? (
          <CardBase
            key={lastDiscarded.card_id}
            card_id={lastDiscarded.card_id}
            shown={true}
            size="mini"
          />
        ) : (
          <p></p>
        )}
      </div>
      {showDiscarded && isMyTurn && (
        <div className="discard-preview">
          {discardedCards.map((card) => (
            <div key={card.card_id} className="discarded-card">
              <CardBase card_id={card.card_id} shown={true} size="mini" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
