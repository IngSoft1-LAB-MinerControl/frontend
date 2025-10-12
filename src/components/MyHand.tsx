import type { PlayerStateResponse } from "../services/playerService";
import CardBase from "./Cards/CardBase";
import Secret from "./Cards/Secret";

interface YouProps {
  player: PlayerStateResponse;
  onCardsSelected: (selectedIds: number[]) => void;
  selectedCardIds: number[];
}

export default function You({
  player,
  onCardsSelected,
  selectedCardIds,
}: YouProps) {
  const handleCardClick = (cardId: number) => {
    const isCurrentlySelected = selectedCardIds.includes(cardId);
    let newSelectedCards: number[];

    if (isCurrentlySelected) {
      newSelectedCards = selectedCardIds.filter((id) => id !== cardId);
    } else {
      newSelectedCards = [...selectedCardIds, cardId];
    }
    onCardsSelected(newSelectedCards);
  };

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
        {player.cards.map((card) => {
          if (card.card_id === undefined) return null;

          return (
            <CardBase
              key={card.card_id}
              card_id={card.card_id}
              shown={true}
              size="medium"
              onCardClick={
                card.card_id !== undefined
                  ? () => handleCardClick(card.card_id!)
                  : undefined
              }
              isSelected={selectedCardIds.includes(card.card_id)}
            />
          );
        })}
      </div>
    </div>
  );
}
