import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";

export const WaitTradeFollyStep = () => {
  const { state, currentPlayer } = useGameContext();
  const { directionFolly, players, game } = state;

  if (!directionFolly || !players.length || !game || !currentPlayer) {
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

  const messages = [
    "Intercambio en progreso...",
    `Todos los jugadores pasan una carta a la ${directionText}`,
  ];

  const isMyTurn = currentPlayer.player_id === game.current_turn;
  if (isMyTurn) {
    messages.push(
      `Seleccioná una carta del jugador a tu ${
        directionFolly === "left" ? "izquierda" : "derecha"
      }.`
    );
  }

  return (
    <div className="action-step-container">
      <TextType className="menu-indications" text={messages} typingSpeed={35} />
    </div>
  );
};
