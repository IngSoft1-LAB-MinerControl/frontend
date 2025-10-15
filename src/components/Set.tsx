import type { CardResponse } from "../services/cardService";
import Detective from "./Cards/Detectives";
import "./Sets.css";

interface SetProps {
  cards: CardResponse[];
  //type: string;
  isSelected: boolean;
}

export default function Set({ cards, isSelected }: SetProps) {
  return (
    <div className={`set ${isSelected ? "selected" : "table"}`}>
      {cards.map((card) => (
        <Detective
          key={card.card_id}
          card_id={card.card_id}
          shown={true}
          size="mini"
          name={card.name}
        />
      ))}
    </div>
  );
}

//
