import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";

export const WaitTradeFollyStep = () => {
  const { state } = useGameContext();
  const { directionFolly, players } = state;

  if (!directionFolly || !players.length) {
    return (
      <div className="action-step-container">
        <TextType
          className="menu-indications"
          text={["Esperando intercambio..."]}
          typingSpeed={35}
        />
      </div>
    );
  }

  const directionText = directionFolly === "left" ? "izquierda" : "derecha";

  const orderedPlayers = [...players].sort(
    (a, b) => (a.turn_order ?? 0) - (b.turn_order ?? 0)
  );

  const displayedPlayers =
    directionFolly === "left" ? [...orderedPlayers].reverse() : orderedPlayers;

  const pairs = displayedPlayers.map((p, i) => {
    const next = displayedPlayers[(i + 1) % displayedPlayers.length];
    return `${p.name} → ${next.name}`;
  });

  const orderString = pairs.join(", ");

  const messages = [
    `Todos los jugadores pasan una carta a la ${directionText}.`,
    `Orden de intercambio: ${orderString}`,
  ];

  return (
    <div className="action-step-container text-center space-y-3">
      <TextType
        className="menu-indications text-lg"
        text={messages[0]}
        typingSpeed={35}
      />
      <div style={{ color: "white", fontWeight: "bold" }}>{messages[1]}</div>
    </div>
  );
};
