import { useState } from "react";
import "./TurnActions.css";
import gameService from "../../services/gameService";
import cardService from "../../services/cardService";
import TextType from "../../components/TextType";
import setService from "../../services/setService";

interface TurnActionProps {
  gameId: number;
  playerId: number;
  onTurnUpdated: (updatedGame: any) => void;
  selectedCardIds: number[];
  setSelectedCardIds: (ids: number[]) => void;
  step: 0 | 1 | 2 | 3;
  setStep: (step: 0 | 1 | 2 | 3) => void;
  cardCount: number;
}

export default function TurnActions({
  gameId,
  playerId,
  onTurnUpdated,
  selectedCardIds,
  setSelectedCardIds,
  step,
  setStep,
  cardCount,
}: TurnActionProps) {
  const [lock, setLock] = useState(false);

  const handleDiscardAuto = async () => {
    if (lock) return;
    setLock(true);
    try {
      await cardService.discardAuto(playerId);
      console.log("Carta descartada");
      setSelectedCardIds([]);
      setStep(3);
    } catch (err) {
      console.error("Error al descartar carta automáticamente:", err);
      alert("Error al descartar carta. Intenta de nuevo.");
    } finally {
      setLock(false);
    }
  };

  const handleDiscardSel = async () => {
    if (lock) return;
    if (!selectedCardIds || selectedCardIds.length === 0) {
      alert("No seleccionaste ninguna carta.");
      return;
    }
    setLock(true);
    try {
      await cardService.discardSelectedList(playerId, selectedCardIds);
      console.log(
        `${selectedCardIds.length} cartas descartadas. Un solo request al back.`
      );
      setSelectedCardIds([]);
      setStep(3);
    } catch (err) {
      console.error("Error al descartar cartas seleccionadas:", err);
      alert("Error al descartar cartas seleccionadas. Intenta de nuevo.");
    } finally {
      setLock(false);
    }
  };

  const handleDraw = async () => {
    try {
      await cardService.drawCard(playerId, gameId); // Robo carta
      console.log("se levanto una carta.");
    } catch (err) {
      console.error("Error al fobar carta:", err);
      alert("Error al robar carta. Intenta de nuevo.");
    }
  };

  const handleEndTurn = async () => {
    try {
      const updatedGame = await gameService.updateTurn(gameId);
      onTurnUpdated(updatedGame);
      setStep(0);
    } catch (err) {
      console.error("Error al finalizar el turno:", err);
      alert("Error al rfinalizar turno. Intenta de nuevo.");
    }
  };

  const handlePlaySet = async () => {
    if (lock) return;
    if (!selectedCardIds || selectedCardIds.length < 2) {
      alert("Seleccione un set válido");
      return;
    }
    setLock(true);
    try {
      await setService.playSet(selectedCardIds[0], selectedCardIds[1]);
      console.log(
        `${selectedCardIds.length} cartas descartadas. Un solo request al back.`
      );
      setSelectedCardIds([]);
      setStep(2);
    } catch (err) {
      console.error("Error al jugar set:", err);
      alert("Error al jugar set. Intenta de nuevo.");
    } finally {
      setLock(false);
    }
  };

  return (
    <div className="turn-actions-box">
      {step === 0 && (
        <div className="action-menu">
          <TextType
            className="menu-indications"
            text={["¿Qué accion desea realizar?"]}
            typingSpeed={75}
            pauseDuration={1500}
            showCursor={true}
            cursorCharacter="|"
          />
          <button
            className="action-button"
            onClick={() => {
              setStep(2);
            }}
          >
            Saltear Turno
          </button>
          <button
            className="action-button"
            onClick={() => {
              setStep(1);
            }}
          >
            Jugar Set
          </button>
        </div>
      )}
      {step === 1 && (
        <div className="action-menu">
          <TextType
            text={["Seleccione el set que desea jugar"]}
            typingSpeed={75}
            pauseDuration={1500}
            showCursor={true}
            cursorCharacter="|"
          />
          <button className="action-button" onClick={handlePlaySet}>
            Jugar Set
          </button>{" "}
          */
        </div>
      )}
      {step === 2 && (
        <div className="action-menu">
          <TextType
            text={["Seleccione una o más cartas"]}
            typingSpeed={75}
            pauseDuration={1500}
            showCursor={true}
            cursorCharacter="|"
          />
          {/* <button
            className="action-button"
            onClick={handleDiscardAuto}
            disabled={discarding}
          >
            {discarding ? "DESCARTANDO..." : "Descarte Automatico"}
          </button> */}
          <button
            className="action-button"
            onClick={handleDiscardSel}
            disabled={lock}
          >
            {lock ? "descartando..." : "Descartar Seleccionadas"}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="action-menu">
          <button
            className="action-button"
            onClick={cardCount < 6 ? handleDraw : handleEndTurn}
          >
            {cardCount < 6 ? "Robar carta" : "Finalizar turno"}
          </button>
        </div>
      )}
    </div>
  );
}
