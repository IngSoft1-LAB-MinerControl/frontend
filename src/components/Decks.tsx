import CardBase from "./Cards/CardBase";

export default function Decks() {
  return (
    <div className="decks">
      <div className="deck draw-deck" title="Mazo para robar">
        <CardBase key="draw" shown={false} size="medium" />
      </div>
      <div className="deck discard-deck" title="Descarte (tope visible)">
        <CardBase key="discard" shown={true} size="medium" />
      </div>
    </div>
  );
}
