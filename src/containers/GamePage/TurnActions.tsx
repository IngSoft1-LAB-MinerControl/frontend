import { useState } from "react";
import "./TurnActions.css";
import gameService from "../../services/gameService";
import cardService from "../../services/cardService";

interface TurnActionProps {
  gameId: number;
  playerId: number;
  onTurnUpdated: (updatedGame: any) => void;
  selectedCardIds: number[];
  setSelectedCardIds: (ids: number[]) => void;
  step: 0 | 1 | 2;
  setStep: (step: 0 | 1 | 2) => void;
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
  const [discarding, setDiscarding] = useState(false);

  const handleDiscardAuto = async () => {
    if (discarding) return;
    setDiscarding(true);
    try {
      await cardService.discardAuto(playerId);
      console.log("Carta descartada");
      setSelectedCardIds([]);
      setStep(2);
    } catch (err) {
      console.error("Error al descartar carta automáticamente:", err);
      alert("Error al descartar carta. Intenta de nuevo.");
    } finally {
      setDiscarding(false);
    }
  };

  const handleDiscardSel = async () => {
    if (discarding) return;
    if (!selectedCardIds || selectedCardIds.length === 0) {
      alert("No seleccionaste ninguna carta.");
      return;
    }
    setDiscarding(true);
    try {
      await cardService.discardSelectedList(playerId, selectedCardIds);
      console.log(
        `${selectedCardIds.length} cartas descartadas. Un solo request al back.`
      );
      setSelectedCardIds([]);
      setStep(2);
    } catch (err) {
      console.error("Error al descartar cartas seleccionadas:", err);
      alert("Error al descartar cartas seleccionadas. Intenta de nuevo.");
    } finally {
      setDiscarding(false);
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

  return (
    <div className="turn-actions">
      {step === 0 && (
        <>
          <button
            className="action-button"
            onClick={() => {
              setStep(1);
            }}
          >
            Saltear Turno
          </button>
        </>
      )}

      {step === 1 && (
        <div className="discard-actions">
          <h3>Necesitas descartar al menos una carta</h3>
          <button
            className="action-button"
            onClick={handleDiscardAuto}
            disabled={discarding}
          >
            {discarding ? "DESCARTANDO..." : "Descarte Automatico"}
          </button>
          <button
            className="action-button"
            onClick={handleDiscardSel}
            disabled={discarding}
          >
            {discarding ? "DESCARTANDO..." : "Descartar Seleccionadas"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
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
