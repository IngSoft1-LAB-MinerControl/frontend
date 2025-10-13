import CardBase from "./Cards/CardBase";
import type { CardResponse } from "../services/cardService";
import "./Decks.css";
import Detective from "./Cards/Detectives";
import Event from "./Cards/Events";

interface DeckProps {
  lastDiscarded: CardResponse | null;
}
export default function Decks({ lastDiscarded }: DeckProps) {
  return (
    <div className="decks">
      <div className="deck draw-deck" title="Mazo para robar">
        <CardBase key="draw" shown={false} size="mini" />
      </div>
      <div className="deck discard-deck" title="Descarte (tope visible)">
        {lastDiscarded ? (
          lastDiscarded.type === "detective" ? (
            <Detective
              key={lastDiscarded.card_id}
              card_id={lastDiscarded.card_id}
              shown={true}
              size="mini"
              name={lastDiscarded.name}
              // quantity_set={lastDiscarded.quantity_set}
            />
          ) : (
            <Event
              key={lastDiscarded.card_id}
              card_id={lastDiscarded.card_id}
              shown={true}
              size="mini"
              name={lastDiscarded.name}
              // quantity_set={lastDiscarded.quantity_set}
            />
          )
        ) : (
          <p></p>
        )}
      </div>
    </div>
  );
}
