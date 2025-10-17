import { useState } from "react";
import "./TurnActions.css";
import gameService from "../../services/gameService";
import cardService, { type CardResponse } from "../../services/cardService";
import TextType from "../../components/TextType";
import setService, { type SetResponse } from "../../services/setService";
import Detective from "../../components/Cards/Detectives";
import Event from "../../components/Cards/Events";

interface TurnActionProps {
  gameId: number;
  playerId: number;
  onTurnUpdated: (updatedGame: any) => void;
  selectedCardIds: number[];
  setSelectedCardIds: (ids: number[]) => void;
  step: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  setStep: (step: 0 | 1 | 2 | 3 | 4 | 5 | 6) => void;
  cardCount: number;
  selectedCard: CardResponse | null;
  setSelectedCard: (card: CardResponse | null) => void;
  discardedCards: CardResponse[];
  selectedSet: SetResponse | null;
}

export default function TurnActions({
  gameId,
  playerId,
  selectedCardIds,
  setSelectedCardIds,
  step,
  setStep,
  cardCount,
  selectedCard,
  setSelectedCard,
  discardedCards,
  selectedSet,
}: TurnActionProps) {
  const [lock, setLock] = useState(false);
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
    if (drawing || !selectedCard) return;

    setDrawing(true);
    try {
      await cardService.pickUpDraftCard(gameId, selectedCard.card_id, playerId);
      setSelectedCard(null);
      setStep(4);
    } catch (err) {
      console.error("Error al robar del draft:", err);
      alert("Error al robar la carta del draft. Intenta de nuevo.");
    } finally {
      setDrawing(false);
    }
  };

  // const handleDiscardAuto = async () => {
  //   if (lock) return;
  //   setLock(true);
  //   try {
  //     await cardService.discardAuto(playerId);
  //     setSelectedCardIds([]);
  //     setStep(3);
  //   } catch (err) {
  //     console.error("Error al descartar carta automáticamente:", err);
  //     alert("Error al descartar carta. Intenta de nuevo.");
  //   } finally {
  //     setLock(false);
  //   }
  // };

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
      setStep(4);
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
      setStep(3);
    } catch (err) {
      setMessage("Set inválido. Elija otra combinación");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  const handleStealSet = async () => {
    if (lock) return;

    setMessage("");
    if (!selectedSet) {
      setMessage("Debe seleccionar un set para robar.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLock(true);
    try {
      // Asumimos que selectedCard sigue siendo "Another Victim" en este punto
      await setService.stealSet(selectedSet.set_id, playerId);
      console.log("se robo un set");
      setMessage("");
      setSelectedCard(null); // Deselecciona la carta de evento
      // setSelectedSet(null); // Esto debe hacerse en el componente padre si maneja el estado
      setStep(4); // Vuelve al paso de jugar evento/set si hay más acciones, o al paso 4/Finalizar
    } catch (err) {
      console.error("Error al robar set:", err);
      setMessage("Error al robar set. Intenta de nuevo.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  const handlePickUpFromDiscard = async () => {
    if (lock) return;

    setMessage("");
    if (!selectedCard) {
      setMessage("Debe seleccionar una carta del descarte.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLock(true);
    try {
      await cardService.pickUpFromDiscard(playerId, selectedCard.card_id);
      console.log("Se robó la carta del descarte:", selectedCard.name);
      setMessage("");
      setSelectedCard(null); // Deselecciona la carta robada
      setStep(4); // Vuelve a la fase de reposición/finalización
    } catch (err) {
      console.error("Error al robar del descarte:", err);
      setMessage("Error al robar del descarte. Intenta de nuevo.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  const handleDiscardCardSelect = (clickedCardId: number) => {
    // Encuentra la carta completa (puede ser null)
    const card =
      discardedCards.find((c) => c.card_id === clickedCardId) ?? null;
    // Si la carta no existe en la lista de descartes, salimos.
    if (!card) return;

    let newValue: CardResponse | null;
    // Si ya hay una carta seleccionada (this.selectedCard o la prop selectedCard)
    if (selectedCard && selectedCard.card_id === card.card_id) {
      // La carta clickeada es la misma: DESELECCIONAR
      newValue = null;
    } else {
      // La carta clickeada es diferente o no había nada: SELECCIONAR LA NUEVA
      newValue = card;
    }
    setSelectedCard(newValue);
  };

  const handlePlayEvent = async () => {
    if (lock) return;
    setMessage("");

    if (!selectedCard || selectedCard.type != "event") {
      setMessage(`seleccione un evento valido. selected: ${selectedCard}.`);
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    try {
      switch (selectedCard.name) {
        case "Another Victim": // ANOTHER VICTIM
          setStep(5); // aca funcion para el endpoint de robar
          return;
        case "Look into the ashes": // LOOK INTO THE ASHES
          setStep(6);
          return;
          break;
        default:
      }
      setMessage("");
      setSelectedCard(null);
      setStep(2);
    } catch (err) {
      setMessage("Evento inválido. Elija otro.");
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
              Jugar Evento
            </button>
            <button className="action-button" onClick={() => setStep(3)}>
              Saltear
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="action-step-container">
          <TextType
            className="menu-indications"
            text={["Seleccione set"]}
            typingSpeed={35}
          />
          <div className="action-buttons-group">
            <button
              className="action-button"
              onClick={handlePlaySet}
              disabled={lock}
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
            className="menu-indications"
            text={["Seleccione carta de evento"]}
            typingSpeed={35}
          />
          <div className="action-buttons-group">
            <button
              className="action-button"
              onClick={handlePlayEvent}
              disabled={lock}
            >
              Jugar Evento
            </button>
            <button className="action-button" onClick={() => setStep(0)}>
              Volver
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="action-step-container">
          <TextType text={["Seleccione una o mas cartas"]} typingSpeed={50} />
          <div className="action-buttons-group">
            <button
              className="action-button"
              onClick={handleDiscardSel}
              disabled={lock}
            >
              {lock ? "Descartando..." : "Descartar Selección"}
            </button>
            <button className="action-button" onClick={() => setStep(0)}>
              Volver
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="action-step-container">
          {cardCount < 6 ? (
            <>
              <TextType
                className="menu-indications"
                text={["Elige de dónde robar"]}
                typingSpeed={35}
              />
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
                  disabled={drawing}
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

      {step === 5 && (
        <div className="action-step-container">
          <TextType
            className="menu-indications"
            text={["Seleccione un set para robar"]}
            typingSpeed={35}
          />
          <div className="action-buttons-group">
            <button
              className="action-button"
              onClick={handleStealSet} // Llama a la nueva función
              disabled={lock || !selectedSet} // Deshabilitado si no hay set seleccionado
            >
              {lock ? "Robando..." : "Robar"}
            </button>
            <button
              className="action-button"
              onClick={() => {
                setSelectedCard(null); // Cancelar la carta de evento
                setStep(0); // Volver al menú principal
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="action-step-container">
          <TextType
            className="menu-inducations"
            text={["Seleccione la carta a robar."]}
            typingSpeed={35}
          />
          <div className="discard-preview visible">
            {discardedCards.map((card) =>
              card.type === "detective" ? (
                <Detective
                  key={card.card_id}
                  card_id={card.card_id}
                  shown={true}
                  size="medium"
                  name={card.name}
                  onCardClick={() => handleDiscardCardSelect(card.card_id)}
                  isSelected={selectedCard?.card_id === card.card_id}
                />
              ) : (
                <Event
                  key={card.card_id}
                  card_id={card.card_id}
                  shown={true}
                  size="medium"
                  name={card.name}
                  onCardClick={() => handleDiscardCardSelect(card.card_id)}
                  isSelected={selectedCard?.card_id === card.card_id}
                />
              )
            )}
          </div>
          <div className="action-buttons-group">
            <button
              className="action-button"
              onClick={handlePickUpFromDiscard}
              disabled={lock || !selectedCard}
            >
              {lock ? "Robando..." : "Robar Carta"}
            </button>
            <button
              className="action-button"
              onClick={() => {
                setSelectedCard(null);
                setStep(0); // Volver al menú principal
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
