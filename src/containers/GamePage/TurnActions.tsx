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

<<<<<<< Updated upstream
  const handleEndTurn = async () => {
=======
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
      let playedSet: SetResponse | null = null;
      if (selectedCardIds.length == 2) {
        playedSet = await setService.playSet2(
          selectedCardIds[0],
          selectedCardIds[1]
        );
        console.log(`set de ${selectedCardIds.length} cartas bajado.`);
      } else if (selectedCardIds.length == 3) {
        playedSet = await setService.playSet3(
          selectedCardIds[0],
          selectedCardIds[1],
          selectedCardIds[2]
        );
        console.log(`set de ${selectedCardIds.length} cartas bajado.`);
      }
      setMessage("");
      setSelectedCardIds([]);

      if (!playedSet) {
        console.error("No se recibió el set jugado.");
        setStep("discard_op");
        return;
      }

      switch (playedSet.name) {
        case "Hercule Poirot":
        case "Miss Marple":
          setStep("sel_reveal_secret");
          break;

        case "Mr Satterthwaite":
        case "Lady Eileen 'Bundle' Brent":
        case "Tommy Beresford":
        case "Tuppence Beresford":
          setStep("sel_player_reveal");
          break;
        case "Parker Pyne":
          setStep("sel_hide_secret");
          break;
        default:
          console.log(`Set ${playedSet.name} no tiene acción.`);
          setStep("discard_op");
      }
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
      const stolenSet: SetResponse = await setService.stealSet(
        playerId,
        selectedSet.set_id
      );
      console.log(`Se robó el set: ${stolenSet.name}`);

      await cardService.discardSelectedList(playerId, [
        activeEventCard.card_id,
      ]);
      console.log("Se descartó", activeEventCard.name);

      setMessage("");
      setSelectedCard(null);

      if (!stolenSet) {
        console.error("No se recibió el set robado desde el servicio.");
        setStep("discard_op");
        return;
      }
      switch (stolenSet.name) {
        case "Hercule Poirot":
        case "Miss Marple":
          setStep("sel_reveal_secret");
          break;

        case "Mr Satterthwaite":
        case "Lady Eileen 'Bundle' Brent":
        case "Tommy Beresford":
        case "Tuppence Beresford":
        case "Beresford Brothers":
          setStep("sel_player_reveal");
          break;
        case "Parker Pyne":
          setStep("sel_hide_secret");
          break;
        default:
          console.log(`Set robado ${stolenSet.name} no tiene acción.`);
          setStep("discard_op");
      }
    } catch (err) {
      console.error("Error al robar set:", err);
      setMessage("Error al robar set. Intenta de nuevo.");
      setTimeout(() => setMessage(""), 3000);
      setStep("start");
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
    if (step == "delay_escape_selection") {
      setSelectedDiscardIds((prevIds: number[]) => {
        if (prevIds.includes(clickedCardId)) {
          return prevIds.filter((id) => id !== clickedCardId);
        } else if (prevIds.length < 5) {
          return [...prevIds, clickedCardId];
        }
        return prevIds;
      });
      setSelectedCard(null);
    } else if (step == "look_into_the_ashes") {
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
      setSelectedDiscardIds([]);
    }
  };

  const handleDelayEscape = async () => {
    if (lock || !activeEventCard) return;
    if (
      !selectedDiscardIds ||
      selectedDiscardIds.length === 0 ||
      selectedDiscardIds.length > 5
    ) {
      setMessage("Debes seleccionar entre 1 y 5 cartas del descarte.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLock(true);
    setMessage("Devolviendo cartas al mazo...");

    try {
      await cardService.delayEscape(
        playerId,
        selectedDiscardIds,
        activeEventCard.card_id
      );
      setMessage("¡Cartas devueltas al mazo! Evento retirado.");
      setTimeout(() => setMessage(""), 2000); // Mensaje de éxito corto
    } catch (err) {
      console.error("Error en Delay Escape:", err);
      setMessage(
        err instanceof Error
          ? err.message
          : "Error desconocido al ejecutar Delay Escape."
      );
      // No reseteamos el mensaje con timeout para que el error permanezca visible
    } finally {
      setSelectedDiscardIds([]);
      setActiveEventCard(null);
      setSelectedCard(null); // Limpia selección única por si acaso
      setStep("discard_op"); // Ir a descarte opcional
      setLock(false);
    }
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
        case "Cards off the table":
          setStep("cards_off_the_table");
          return;
        case "And then there was one more...":
          setStep("and_then_there_was_one_more");
          return;
        case "Delay the murderer's escape!":
          setStep("delay_escape_selection");
          return;
        default:
          if (activeEventCard) {
            // descarto evento generico si no tiene accion especial
            await cardService.discardSelectedList(playerId, [
              activeEventCard.card_id,
            ]);
            console.log("Evento genérico descartado:", activeEventCard.name);
          }
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

  const handleConfirmPlayerReveal = async () => {
    if (lock || !selectedTargetPlayer) {
      setMessage("Debe seleccionar un jugador.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLock(true);
    try {
      await playerService.selectPlayer(selectedTargetPlayer.player_id);

      // 2. Pasamos al estado de espera
      setStep("wait_reveal_secret");
    } catch (err) {
      console.error("Error al seleccionar jugador para revelar:", err);
      setMessage("Error al seleccionar jugador. Intenta de nuevo.");
      setTimeout(() => setMessage(""), 3000);
      setStep("sel_player_reveal");
    } finally {
      setLock(false);
    }
  };

  const handleRevealSecret = async () => {
    if (lock) return;
    setMessage("");

    if (selectedSecret === null) {
      setMessage("Debe seleccionar un secreto para ocultar.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLock(true);
>>>>>>> Stashed changes
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
