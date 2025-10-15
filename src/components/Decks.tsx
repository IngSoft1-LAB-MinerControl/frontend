import { useState } from "react";
import CardBase from "./Cards/CardBase";
import type { CardResponse } from "../services/cardService";
import "./Decks.css";
import Detective from "./Cards/Detectives";
import Event from "./Cards/Events";

interface DeckProps {
  discardedCards: CardResponse[];
  cardsLeftCount: number | null;
  isMyTurn: boolean;
}
export default function Decks({
  discardedCards,
  cardsLeftCount,
  isMyTurn,
}: DeckProps) {
  const [showDiscarded, setShowDiscarded] = useState(false);
  const lastDiscarded = discardedCards.length > 0 ? discardedCards[0] : null;
  const handleDiscardClick = () => {
    setShowDiscarded((prev) => !prev);
  };
  const previewCards = discardedCards.slice(1, 6).reverse();

  return (
    <div className="decks">
      <div className="deck draw-deck" title="Mazo para robar">
        {cardsLeftCount !== null && cardsLeftCount >= 0 && (
          <div className="card-counter">{cardsLeftCount}</div>
        )}
        <CardBase key="draw" shown={false} size="mini" />
      </div>

      <div
        className="deck discard-deck"
        title="Descarte (tope visible)"
        onClick={handleDiscardClick}
      >
        {lastDiscarded ? (
          lastDiscarded.type === "detective" ? (
            <Detective
              key={lastDiscarded.card_id}
              card_id={lastDiscarded.card_id}
              shown={true}
              size="mini"
              name={lastDiscarded.name}
            />
          ) : (
            <Event
              key={lastDiscarded.card_id}
              card_id={lastDiscarded.card_id}
              shown={true}
              size="mini"
              name={lastDiscarded.name}
            />
          )
        ) : (
          <p></p>
        )}

        {showDiscarded && isMyTurn && (
          <div className="discard-preview visible">
            {previewCards.map((card) =>
              card.type === "detective" ? (
                <Detective
                  key={card.card_id}
                  card_id={card.card_id}
                  shown={true}
                  size="mini"
                  name={card.name}
                />
              ) : (
                <Event
                  key={card.card_id}
                  card_id={card.card_id}
                  shown={true}
                  size="mini"
                  name={card.name}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
