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
  step: 0 | 1 | 2 | 3 | 4;
  setStep: (step: 0 | 1 | 2 | 3 | 4) => void;
  cardCount: number;
  selectedDraftCardId: number | null;
  setSelectedDraftCardId: (id: number | null) => void;
}

export default function TurnActions({
  gameId,
  playerId,
  selectedCardIds,
  setSelectedCardIds,
  step,
  setStep,
  cardCount,
  selectedDraftCardId,
  setSelectedDraftCardId,
}: TurnActionProps) {
  const [lock, setLock] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [message, setMessage] = useState("");

  const handleEndTurn = async () => {
    try {
      await gameService.updateTurn(gameId);
      setStep(0);
    } catch (err) {
      console.error("Error al finalizar el turno:", err);
      alert("Error al finalizar turno. Intenta de nuevo.");
    }
  };

  const handleDrawDraft = async () => {
    if (drawing || !selectedDraftCardId) return;

    setDrawing(true);
    try {
      await cardService.pickUpDraftCard(gameId, selectedDraftCardId, playerId);
      setSelectedDraftCardId(null);
      setStep(3);
    } catch (err) {
      console.error("Error al robar del draft:", err);
      alert("Error al robar la carta del draft. Intenta de nuevo.");
    } finally {
      setDrawing(false);
    }
  };

  const handleDiscardAuto = async () => {
    if (lock) return;
    setLock(true);
    try {
      await cardService.discardAuto(playerId);
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
      console.error("Error al robar carta:", err);
      alert("Error al robar carta. Intenta de nuevo.");
    }
  };

  const handlePlaySet = async () => {
    if (lock) return;

    setMessage("");

    if (!selectedCardIds || selectedCardIds.length < 2) {
      setMessage("Seleccione un set válido");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setLock(true);
    try {
      if (selectedCardIds.length == 2) {
        await setService.playSet2(selectedCardIds[0], selectedCardIds[1]);
        console.log(`set de ${selectedCardIds.length} cartas bajado.`);
      } else if (selectedCardIds.length == 3) {
        await setService.playSet3(
          selectedCardIds[0],
          selectedCardIds[1],
          selectedCardIds[2]
        );
        console.log(`set de ${selectedCardIds.length} cartas bajado.`);
      }
      setMessage("");
      setSelectedCardIds([]);
      setStep(2);
    } catch (err) {
      setMessage("Set inválido. Elija otra combinación");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  console.log("Mensaje actual:", message);
  return (
    <div className="turn-actions-box">
      {message && <div className="turn-message">{message}</div>}
      {step === 0 && (
        <div className="action-step-container">
          <TextType
            className="menu-indications"
            text={["¿Qué acción desea realizar?"]}
            typingSpeed={50}
          />
          <div className="action-buttons-group">
            <button className="action-button" onClick={() => setStep(1)}>
              Jugar Set
            </button>
            <button className="action-button" onClick={() => setStep(2)}>
              Descartar / Saltear
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="action-step-container">
          <TextType
            className="menu-indications"
            text={["Seleccione las cartas del set que desea jugar"]}
            typingSpeed={35}
          />
          <div className="action-buttons-group">
            <button
              className="action-button"
              onClick={handlePlaySet}
              disabled={lock /*|| selectedCardIds.length < 2*/}
            >
              Jugar Set
            </button>
            <button className="action-button" onClick={() => setStep(0)}>
              Volver
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="action-step-container">
          <TextType
            text={["Seleccione una o más cartas para descartar"]}
            typingSpeed={50}
          />
          <div className="action-buttons-group">
            <button
              className="action-button"
              onClick={handleDiscardSel}
              disabled={lock || selectedCardIds.length === 0}
            >
              {lock ? "Descartando..." : "Descartar Selección"}
            </button>
            <button className="action-button" onClick={() => setStep(0)}>
              Volver
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="action-step-container">
          {cardCount < 6 ? (
            <>
              <h3>Elige de dónde robar</h3>
              <div className="action-buttons-group">
                <button
                  className="action-button"
                  onClick={handleDraw}
                  disabled={drawing}
                >
                  Robar Mazo Principal
                </button>
                <button
                  className="action-button"
                  onClick={handleDrawDraft}
                  disabled={drawing || !selectedDraftCardId}
                >
                  Robar Mazo Draft
                </button>
              </div>
            </>
          ) : (
            <button className="action-button" onClick={handleEndTurn}>
              Finalizar Turno
            </button>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="action-step-container">
          <button className="action-button" onClick={handleEndTurn}>
            Finalizar Turno
          </button>
        </div>
      )}
    </div>
  );
}
