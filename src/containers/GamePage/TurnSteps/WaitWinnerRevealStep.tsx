import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";
import { useWaitWinnerReveal } from "./useWaitWinnerReveal";

export const WaitWinnerRevealStep = () => {
  // 1. Llamamos al hook para que se ejecute su 'useEffect'
  useWaitWinnerReveal();

  // 2. Leemos el estado del context para mostrar el mensaje
  const { state } = useGameContext();
  const { selectedTargetPlayer } = state;
  const winner = selectedTargetPlayer;

  return (
    <div className="action-step-container">
      <TextType
        className="menu-indications"
        text={[
          `Esperando a que ${
            winner?.name ?? "el oponente"
          } revele un secreto...`,
        ]}
        typingSpeed={50}
        loop={true}
      />
    </div>
  );
};
