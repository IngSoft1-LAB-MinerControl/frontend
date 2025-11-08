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

  const orderString =
    orderedPlayers.map((p) => p.name).join(" → ") +
    ` → ${orderedPlayers[0].name}`;

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
