import { useState } from "react";
import "./TurnActions.css";
import gameService from "../../services/gameService";
import cardService from "../../services/cardService";

interface TurnActionProps {
  gameId: number;
  playerId: number;
  onTurnUpdated: (updatedGame: any) => void;
}

export default function TurnActions({
  gameId,
  playerId,
  onTurnUpdated,
}: TurnActionProps) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [discarding, setDiscarding] = useState(false);

  const handleDiscardAuto = async () => {
    if (discarding) return;
    setDiscarding(true);
    try {
      await cardService.discardAuto(playerId);
      console.log("Carta descartada");

      setStep(2);
    } catch (err) {
      console.error("Error al descartar carta automáticamente:", err);
      alert("Error al descartar carta. Intenta de nuevo.");
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
          <button className="action-button" onClick={() => setStep(1)}>
            DESCARTAR CARTA
          </button>
          <button
            className="action-button"
            onClick={() => {
              /* Lógica para saltear turno si aplica */ setStep(2);
            }}
          >
            SALTEAR TURNO
          </button>
        </>
      )}

      {step === 1 && (
        <div className="discard-actions">
          <h3>¿Deseas descartar una carta?</h3>
          <p>Se descartará una de tus cartas automáticamente.</p>
          <button
            className="action-button"
            onClick={handleDiscardAuto}
            disabled={discarding}
          >
            {discarding ? "DESCARTANDO..." : "SÍ, DESCARTAR"}
          </button>
          <button className="action-button" onClick={() => setStep(0)}>
            NO DESCARTAR
          </button>
        </div>
      )}

      {step === 2 && (
        <button className="action-button" onClick={handleUpdateAndDraw}>
          REPONER y FINALIZAR TURNO
        </button>
      )}
    </div>
  );
}
