import { useState } from "react";
import type { PlayerStateResponse } from "../services/playerService";
import Detective from "./Cards/Detectives";
import Event from "./Cards/Events";
import Secret from "./Cards/Secret";
import Set from "./Set.tsx";
import "./MyHand.css";
import type { CardResponse } from "../services/cardService.ts";

interface YouProps {
  player: PlayerStateResponse;
  onCardsSelected: (card: CardResponse) => void;
  selectedCardIds: number[];
  isMyTurn: boolean;
  selectedCard: CardResponse | null;
}

export default function You({
  player,
  onCardsSelected,
  selectedCardIds,
  selectedCard,
  isMyTurn,
}: YouProps) {
  const [handExpanded, setHandExpanded] = useState(false);

  const handleCardClick = (card: CardResponse) => {
    onCardsSelected(card);
  };

  const toggleHandView = () => {
    setHandExpanded(!handExpanded);
  };

  return (
    <div className="you">
      <div className={`you-name ${isMyTurn ? "myturn" : ""}`}>
        {player.name}
      </div>
      <div className="you-sets">
        {player.sets.map((set) => (
          <Set cards={set.detective} isSelected={false} />
        ))}
      </div>
      <div className="you-secrets">
        {/* Mapeamos directamente desde player.secrets que viene en las props */}
        {player.secrets.map((secret) => (
          <Secret
            key={secret.secret_id}
            secret_id={secret.secret_id}
            mine={true}
            revealed={secret.revealed}
            murderer={secret.murderer}
            accomplice={secret.accomplice}
            size="medium"
          />
        ))}
      </div>
      <div className={`you-hand ${handExpanded ? "expanded" : "compact"}`}>
        {player.cards.map((card) => {
          if (card.card_id === undefined) return null;
          const isSelected =
            selectedCardIds.includes(card.card_id) ||
            selectedCard?.card_id === card.card_id;
          return card.type === "detective" ? (
            <Detective
              key={card.card_id}
              card_id={card.card_id}
              shown={true}
              size={handExpanded ? "large" : "medium"}
              onCardClick={() => handleCardClick(card)}
              isSelected={isSelected}
              name={card.name}
            />
          ) : (
            <Event
              key={card.card_id}
              card_id={card.card_id}
              shown={true}
              size={handExpanded ? "large" : "medium"}
              onCardClick={() => handleCardClick(card)}
              isSelected={selectedCardIds.includes(card.card_id)}
              name={card.name}
            />
          );
        })}
      </div>

      <div className="controls-row">
        <button
          className="hand-toggle-button"
          onClick={toggleHandView}
          title={
            handExpanded
              ? "Reducir el espacio de la mano"
              : "Ver cartas de forma más clara"
          }
        >
          {handExpanded ? "volver" : "ver cartas"}
        </button>
      </div>
    </div>
  );
}
