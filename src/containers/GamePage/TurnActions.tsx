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
}

export default function TurnActions({
  gameId,
  playerId,
  onTurnUpdated,
  selectedCardIds,
  setSelectedCardIds,
  step,
  setStep,
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

  const handleUpdateAndDraw = async () => {
    try {
      await cardService.drawCard(playerId, gameId); // Robo carta
      console.log("se levanto una carta.");
      const updatedGame = await gameService.updateTurn(gameId); // Asumo que esto avanza el turno
      onTurnUpdated(updatedGame);
      setStep(0); // Volver al inicio del ciclo de acciones de turno
    } catch (err) {
      console.error("Error al finalizar turno y reponer:", err);
      alert("Error al finalizar turno y reponer. Intenta de nuevo.");
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
          <button className="action-button" onClick={handleUpdateAndDraw}>
            REPONER y FINALIZAR TURNO
          </button>
        </div>
      )}
    </div>
  );
}
