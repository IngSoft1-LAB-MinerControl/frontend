import { useState } from "react";
import "./TurnActions.css";
import gameService from "../../services/gameService";
import cardService, { type CardResponse } from "../../services/cardService";
import TextType from "../../components/TextType";
import setService, { type SetResponse } from "../../services/setService";
import Detective from "../../components/Cards/Detectives";
import Event from "../../components/Cards/Events";
import type { SecretResponse } from "../../services/secretService";
import secretService from "../../services/secretService";

export type Steps =
  | "start"
  | "p_set"
  | "p_event"
  | "discard_skip"
  | "discard_op"
  | "draw"
  | "another_victim"
  | "look_into_the_ashes"
  | "set_actions"
  | "reveal_secret"
  | "hide_secret";

interface TurnActionProps {
  gameId: number;
  playerId: number;
  onTurnUpdated: (updatedGame: any) => void;
  selectedCardIds: number[];
  setSelectedCardIds: (ids: number[]) => void;
  step: Steps;
  setStep: (step: Steps) => void;
  cardCount: number;
  selectedCard: CardResponse | null;
  setSelectedCard: (card: CardResponse | null) => void;
  discardedCards: CardResponse[];
  selectedSet: SetResponse | null;
  selectedSecret: SecretResponse | null;
  setSelectedSecret: (secret: SecretResponse | null) => void;
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
  selectedSecret,
  setSelectedSecret,
}: TurnActionProps) {
  const [lock, setLock] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [message, setMessage] = useState("");
  const [activeEventCard, setActiveEventCard] = useState<CardResponse | null>(
    null
  );

  const handleEndTurn = async () => {
    try {
      await gameService.updateTurn(gameId);
      setStep("start");
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
      setStep("draw");
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
      setStep("draw");
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

      setStep("set_actions");
    } catch (err) {
      setMessage("Set inválido. Elija otra combinacigón");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  const handleStealSet = async () => {
    if (lock) return;

    setMessage("");
    if (!selectedSet || !activeEventCard) {
      setMessage("Debe seleccionar un set para robar.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLock(true);
    try {
      await setService.stealSet(playerId, selectedSet.set_id);
      console.log("se robo un set");
      await cardService.discardSelectedList(playerId, [
        activeEventCard.card_id,
      ]);
      console.log("Se descartó", activeEventCard.name);

      setMessage("");
      setSelectedCard(null);
      setStep("discard_op"); //
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
    if (!selectedCard || !activeEventCard) {
      setMessage("Debe seleccionar una carta del descarte.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLock(true);
    try {
      await cardService.pickUpFromDiscard(playerId, selectedCard.card_id);
      console.log("Se robó la carta del descarte:", selectedCard.name);
      await cardService.discardSelectedList(playerId, [
        activeEventCard.card_id,
      ]);
      console.log("Se descartó", activeEventCard.name);

      setMessage("");
      setSelectedCard(null);
      setActiveEventCard(null);
      setStep("discard_op");
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
      setActiveEventCard(selectedCard);
      switch (selectedCard.name) {
        case "Another Victim":
          setStep("another_victim");
          return;
        case "Look into the ashes":
          setStep("look_into_the_ashes");
          return;
        default:
      }
      setMessage("");
      setActiveEventCard(null);
      setStep("discard_op");
      setSelectedCard(null);
    } catch (err) {
      setMessage("Evento inválido. Elija otro.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  const handleRevealSecret = async () => {
    if (lock) return;
    setMessage("");

    if (selectedSecret === null) {
      setMessage("Debe seleccionar un secreto para revelar.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLock(true);
    try {
      await secretService.revealSecret(selectedSecret.secret_id); // Call your secret service function
      console.log(`Se reveló el secreto con ID: ${selectedSecret.secret_id}`);

      setMessage("");
      setSelectedSecret(null);
      // Transition to the standard discard step after action
      setStep("discard_op");
    } catch (err) {
      console.error("Error al revelar secreto:", err);
      setMessage("Error al revelar secreto. Intenta de nuevo.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  const handleHideSecret = async () => {
    if (lock) return;
    setMessage("");

    if (selectedSecret === null) {
      setMessage("Debe seleccionar un secreto para revelar.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLock(true);
    try {
      await secretService.hideSecret(selectedSecret.secret_id); // Call your secret service function
      console.log(`Se oculto el secreto con ID: ${selectedSecret.secret_id}`);

      setMessage("");
      setSelectedSecret(null);
      setStep("discard_op");
    } catch (err) {
      console.error("Error al ocultar secreto:", err);
      setMessage("Error al ocultar secreto. Intenta de nuevo.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  console.log("Mensaje actual:", message);
  return (
    <div className="turn-actions-box">
      {message && <div className="turn-message">{message}</div>}
      {step === "start" && ( // ELEGIR ACCION
        <div className="action-step-container">
          <TextType
            className="menu-indications"
            text={["¿Qué acción desea realizar?"]}
            typingSpeed={50}
          />
          <div className="action-buttons-group">
            <button className="action-button" onClick={() => setStep("p_set")}>
              Bajar Set
            </button>
            <button
              className="action-button"
              onClick={() => setStep("p_event")}
            >
              Jugar Evento
            </button>
            <button
              className="action-button"
              onClick={() => setStep("discard_skip")}
            >
              Saltear
            </button>
          </div>
        </div>
      )}

      {step === "p_set" && ( // JUGAR SET
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
            <button className="action-button" onClick={() => setStep("start")}>
              Volver
            </button>
          </div>
        </div>
      )}

      {step === "p_event" && ( // JUGAR EVENTO
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
              Jugar Evento Seleccionado
            </button>
            <button className="action-button" onClick={() => setStep("start")}>
              Volver
            </button>
          </div>
        </div>
      )}

      {step === "discard_skip" && ( // DESCARTE IF SALTEAR TURNO
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
            <button className="action-button" onClick={() => setStep("start")}>
              Volver
            </button>
          </div>
        </div>
      )}

      {step === "discard_op" && ( // DESCARTE IF SET/EVENTO
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
            <button className="action-button" onClick={() => setStep("draw")}>
              No Descartar
            </button>
          </div>
        </div>
      )}

      {step === "draw" && ( // REPONER Y FINALIZAR TURNO
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

      {step === "another_victim" && ( // EVENTO: ANOTHER VICTIM
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
                setStep("start"); // Volver al menú principal
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {step === "look_into_the_ashes" && ( // EVENTO: LOOK INTO THE ASHES
        <div className="action-step-container">
          <TextType
            className="menu-inducations"
            text={["Seleccione la carta a robar."]}
            typingSpeed={35}
          />
          <div className="discard-preview visible">
            {discardedCards.map((card) => (
              <div
                key={card.card_id}
                className={`card-container ${
                  selectedCard?.card_id === card.card_id ? "isSelected" : ""
                }`}
                onClick={() => handleDiscardCardSelect(card.card_id)}
              >
                {card.type === "detective" ? (
                  <Detective
                    card_id={card.card_id}
                    shown={true}
                    size="medium"
                    name={card.name}
                  />
                ) : (
                  <Event
                    card_id={card.card_id}
                    shown={true}
                    size="medium"
                    name={card.name}
                  />
                )}
              </div>
            ))}
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
                setStep("start"); // Volver al menú principal
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {step === "reveal_secret" && ( // REVEAL SECRET
        <div className="action-step-container">
          <TextType
            className="menu-indications"
            text={["Seleccione un secreto para revelar"]}
            typingSpeed={35}
          />
          <div className="action-buttons-group">
            <button
              className="action-button"
              onClick={handleRevealSecret} // Llama a la nueva función
              disabled={lock || !selectedSecret} // Deshabilitado si no hay set seleccionado
            >
              {lock ? "Revelando..." : "Revelar"}
            </button>
            <button
              className="action-button"
              onClick={() => {
                setSelectedSecret(null); // Cancelar la carta de evento
                setStep("start"); // Volver al menú principal
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {step === "hide_secret" && ( // HIDE SECRET
        <div className="action-step-container">
          <TextType
            className="menu-indications"
            text={["Seleccione un secreto para ocultar"]}
            typingSpeed={35}
          />
          <div className="action-buttons-group">
            <button
              className="action-button"
              onClick={handleHideSecret} // Llama a la nueva función
              disabled={lock || !selectedSecret} // Deshabilitado si no hay set seleccionado
            >
              {lock ? "Ocultando..." : "Ocultar"}
            </button>
            <button
              className="action-button"
              onClick={() => {
                setSelectedSecret(null); // Cancelar la carta de evento
                setStep("set_actions"); // Volver al menú principal
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {step === "set_actions" && ( // OPTIONS PLAY SET
        <div className="action-step-container">
          <TextType text={["Seleccione una acción"]} typingSpeed={50} />
          <div className="action-buttons-group">
            <button
              className="action-button"
              onClick={() => setStep("reveal_secret")}
            >
              Revelar secreto
            </button>
            <button
              className="action-button"
              onClick={() => setStep("hide_secret")}
            >
              Ocultar secreto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
