import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
  useMemo,
} from "react";
import "./TurnActions.css";
import gameService from "../../services/gameService";
import cardService, { type CardResponse } from "../../services/cardService";
import TextType from "../../components/TextType";
import setService, { type SetResponse } from "../../services/setService";
import Detective from "../../components/Cards/Detectives";
import Event from "../../components/Cards/Events";
import type { SecretResponse } from "../../services/secretService";
import secretService from "../../services/secretService";
import playerService, {
  type PlayerStateResponse,
} from "../../services/playerService";

export type Steps =
  | "start"
  | "p_set"
  | "p_event"
  | "discard_skip"
  | "discard_op"
  | "draw"
  | "another_victim"
  | "look_into_the_ashes"
  | "cards_off_the_table"
  | "and_then_there_was_one_more"
  | "set_actions"
  | "sel_reveal_secret"
  | "sel_hide_secret"
  | "wait_reveal_secret"
  | "sel_player_reveal"
  | "delay_escape_selection"
  | "point_your_suspicions"
  | "vote";

interface TurnActionProps {
  players: PlayerStateResponse[];
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
  selectedTargetPlayer: PlayerStateResponse | null;
  setSelectedTargetPlayer: (p: PlayerStateResponse | null) => void;
  selectedDiscardIds: number[];
  setSelectedDiscardIds: Dispatch<SetStateAction<number[]>>; //anotacion mia (uli) (no la saquen porque no entiendo dispatch ;))useState<number[]>() en GamePage devuelve un setter con tipo Dispatch<SetStateAction<number[]>>, que acepta tanto un number[] como una función prev => newArr.
}

export default function TurnActions({
  gameId,
  playerId,
  players,
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
  selectedTargetPlayer,
  setSelectedTargetPlayer,
  selectedDiscardIds,
  setSelectedDiscardIds,
}: TurnActionProps) {
  const [lock, setLock] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [message, setMessage] = useState("");
  const [activeEventCard, setActiveEventCard] = useState<CardResponse | null>(
    null
  );

  const currentPlayer = useMemo(() => {
    return players.find((p) => p.player_id === playerId);
  }, [players, playerId]);

  const isSocialDisgrace = useMemo(() => {
    return currentPlayer?.social_disgrace ?? false;
  }, [currentPlayer]);

  useEffect(() => {
    // Si no estamos en el paso de espera, o no hay un jugador objetivo, no hacemos nada.
    if (step !== "wait_reveal_secret" || !selectedTargetPlayer) {
      return;
    }

    // Buscamos el estado actualizado de ese jugador en la lista 'players'
    // que viene de GamePage (y que se actualiza por WebSocket).
    const updatedTargetState = players.find(
      (p) => p.player_id === selectedTargetPlayer.player_id
    );

    // Si encontramos al jugador y su bandera 'isSelected' es false,
    // significa que ya completó la acción (reveló su secreto).
    if (updatedTargetState && !updatedTargetState.isSelected) {
      console.log(
        `El jugador ${updatedTargetState.name} ha revelado. Avanzando.`
      );
      // Limpiamos el jugador objetivo
      setSelectedTargetPlayer(null);
      // Avanzamos al siguiente paso (descartar)
      setStep("discard_op");
    }

    // Dependemos de 'players' (que se actualiza por WS)
  }, [players, step, selectedTargetPlayer, setStep, setSelectedTargetPlayer]);

  useEffect(() => {
    if (isSocialDisgrace && step === "start") {
      console.log("Jugador en desgracia social.");
      setStep("discard_skip");
    }
  }, [isSocialDisgrace, step, setStep]);

  const handleEndTurn = async () => {
    try {
      await gameService.updateTurn(gameId);
      setStep("start");
    } catch (err) {
      console.error("Error al finalizar el turno:", err);
      //alert("Error al finalizar turno. Intenta de nuevo.");
      setMessage("Error al finalizar turno. Intenta de nuevo.");
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
      //alert("No seleccionaste ninguna carta.");
      setMessage("No seleccionaste ninguna carta.");

      return;
    }
    setLock(true);
    try {
      await cardService.discardSelectedList(playerId, selectedCardIds);
      setSelectedCardIds([]);
      setStep("draw");
    } catch (err) {
      console.error("Error al descartar cartas seleccionadas:", err);
      //alert("Error al descartar cartas seleccionadas. Intenta de nuevo.");
      setMessage("Error al descartar cartas seleccionadas. Intenta de nuevo.");
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
        case "Beresford brothers":
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

      // 2. Descartamos la carta de evento
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
        case "Beresford brothers":
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
      if (selectedCard && selectedCard.card_id === card.card_id) {
        newValue = null;
      } else {
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
    } finally {
      setSelectedDiscardIds([]);
      setActiveEventCard(null);
      setSelectedCard(null);
      setStep("discard_op");
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
        case "Point your suspicions":
          setStep("point_your_suspicions");
          return;

        default:
          if (activeEventCard) {
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
    try {
      await secretService.revealSecret(selectedSecret.secret_id);
      console.log(`Se reveló el secreto con ID: ${selectedSecret.secret_id}`);

      setMessage("");
      setSelectedSecret(null);
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
      await secretService.hideSecret(selectedSecret.secret_id);
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

  const handleCardsOffTheTable = async (targetPlayerId: number) => {
    if (lock || !activeEventCard) return;
    setLock(true);
    setMessage("");

    try {
      const res = await cardService.cardsOffTheTable(targetPlayerId);
      console.log("Respuesta de cardsOffTheTable:", res);

      await cardService.discardSelectedList(playerId, [
        activeEventCard.card_id,
      ]);
      console.log("Se descartó", activeEventCard.name);

      setMessage("Cartas 'Not So Fast' eliminadas correctamente.");
    } catch (err) {
      console.error("Error al ejecutar Cards Off The Table:", err);
      const errorMessage =
        (err as any).response?.data?.message ||
        (err as Error).message ||
        "Error desconocido al ejecutar el evento.";
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setSelectedTargetPlayer(null);
      setActiveEventCard(null);
      setLock(false);
      setStep("discard_op");
    }
  };

  const handleAndThenThereWasOneMore = async () => {
    if (!selectedSecret) {
      setMessage("Debe seleccionar un secreto.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    if (!selectedSecret.revelated) {
      setMessage("Solo puede ocultar secretos revelados.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      await cardService.AndThenThereWasOneMore(
        selectedTargetPlayer!.player_id,
        selectedSecret.secret_id
      );

      console.log(
        `Evento 'And Then There Was One More' ejecutado. Jugador ${
          selectedTargetPlayer!.player_id
        } recibe secreto ${selectedSecret.secret_id}.`
      );

      if (activeEventCard) {
        await cardService.discardSelectedList(playerId, [
          activeEventCard.card_id,
        ]);
        console.log(`Evento '${activeEventCard.name}' descartado.`);
      }

      setMessage("Evento ejecutado exitosamente.");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error("Error al ejecutar evento:", err);
      setMessage("Error al ejecutar el evento.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSelectedSecret(null);
      setSelectedTargetPlayer(null);
      setActiveEventCard(null);
      setStep("discard_op");
    }
  };

  return (
    <div className="turn-actions-box">
      {message && <div className="turn-message">{message}</div>}
      {step === "start" && ( // ELEGIR ACCION
        <div className="action-step-container">
          {isSocialDisgrace ? (
            <TextType
              className="menu-indications"
              text={["Procesando turno..."]}
              typingSpeed={50}
            />
          ) : (
            <>
              <TextType
                className="menu-indications"
                text={["¿Qué acción desea realizar?"]}
                typingSpeed={50}
              />
              <div className="action-buttons-group">
                <button
                  className="action-button"
                  onClick={() => setStep("p_set")}
                >
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
            </>
          )}
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

      {step === "discard_skip" && ( // DESCARTE IF SALTEAR TURNO (O SOCIAL DISGRACE)
        <div className="action-step-container">
          {isSocialDisgrace ? (
            <TextType
              text={["Descartar una o mas cartas"]}
              typingSpeed={40}
              key="social-disgrace-discard"
            />
          ) : (
            <TextType text={["Seleccione una o mas cartas"]} typingSpeed={50} />
          )}
          <div className="action-buttons-group">
            <button
              className="action-button"
              onClick={handleDiscardSel}
              disabled={lock}
            >
              {lock ? "Descartando..." : "Descartar Selección"}
            </button>

            {!isSocialDisgrace && (
              <button
                className="action-button"
                onClick={() => setStep("start")}
              >
                Volver
              </button>
            )}
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
      {step === "point_your_suspicions" && (
        <div className="action-step-container">
          <TextType
            className="menu-indications"
            text={["¿Listo para votar?"]}
            typingSpeed={35}
          />
          <div className="action-buttons-group">
            <button
              className="action-button"
              onClick={async () => {
                try {
                  await cardService.pointYourSuspicions(gameId);

                  if (activeEventCard) {
                    await cardService.discardSelectedList(playerId, [
                      activeEventCard.card_id,
                    ]);
                    console.log("Evento descartado:", activeEventCard.name);
                  }

                  setActiveEventCard(null);
                } catch (error) {
                  console.error("Error al iniciar votación:", error);
                  setMessage("Error al iniciar votación. Intenta de nuevo.");
                  setTimeout(() => setMessage(""), 3000);
                }
              }}
            >
              Comenzar votación
            </button>
            <button
              className="action-button"
              onClick={() => {
                setActiveEventCard(null);
                setStep("start");
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {step === "vote" && (
        <div className="action-step-container">
          <TextType
            className="menu-indications"
            text={["Vota al jugador que creas culpable."]}
            typingSpeed={35}
          />
          <div className="action-buttons-group">
            {players.map((p) => (
              <button
                key={p.player_id}
                className={`action-button ${
                  selectedTargetPlayer?.player_id === p.player_id
                    ? "selected"
                    : ""
                }`}
                onClick={() => {
                  if (!hasVoted) onVote?.(p.player_id);
                }}
                disabled={hasVoted}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "and_then_there_was_one_more" && (
        <div className="action-step-container">
          <TextType
            key={selectedTargetPlayer ? "secret" : "player"}
            className="menu-indications"
            text={
              selectedTargetPlayer
                ? ["Seleccione un secreto revelado para ocultar."]
                : ["Clickee el nombre de un jugador que recibirá el secreto."]
            }
            typingSpeed={35}
          />

          <div className="action-buttons-group">
            {!selectedTargetPlayer ? (
              <>
                <button
                  className="action-button"
                  disabled={!selectedTargetPlayer}
                  onClick={() => {
                    if (!selectedTargetPlayer) {
                      setMessage("Debe seleccionar un jugador.");
                      setTimeout(() => setMessage(""), 3000);
                    }
                  }}
                >
                  Avanzar
                </button>
              </>
            ) : (
              <>
                <button
                  className="action-button"
                  onClick={async () => {
                    if (!selectedSecret) {
                      setMessage("Debe seleccionar un secreto.");
                      setTimeout(() => setMessage(""), 3000);
                      return;
                    }
                    if (!selectedSecret.revelated) {
                      setMessage("Solo puede ocultar secretos revelados.");
                      setTimeout(() => setMessage(""), 3000);
                      return;
                    }
                    await handleAndThenThereWasOneMore();
                  }}
                  disabled={!selectedSecret || lock}
                >
                  Ejecutar Evento
                </button>
                <button
                  className="action-button"
                  onClick={() => {
                    setSelectedSecret(null);
                    setSelectedTargetPlayer(null);
                    setActiveEventCard(null);
                    setStep("start");
                  }}
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {step === "cards_off_the_table" && ( // EVENTO: CARDS OFF THE TABLE
        <div className="action-step-container">
          <TextType
            className="menu-indications"
            text={[
              "Seleccione un jugador para descartar sus cartas 'Not So Fast'",
            ]}
            typingSpeed={35}
          />
          <div className="action-buttons-group">
            <button
              className="action-button"
              onClick={async () => {
                if (!selectedTargetPlayer) {
                  setMessage("Debe seleccionar un jugador.");
                  setTimeout(() => setMessage(""), 3000);
                  return;
                }
                await handleCardsOffTheTable(selectedTargetPlayer.player_id);
              }}
              disabled={!selectedTargetPlayer || lock}
            >
              Ejecutar Evento
            </button>
            <button
              className="action-button"
              onClick={() => {
                setSelectedTargetPlayer(null);
                setActiveEventCard(null);
                setStep("start");
              }}
            >
              Cancelar
            </button>
          </div>
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

      {step === "sel_player_reveal" && (
        <div className="action-step-container">
          <TextType
            className="menu-indications"
            text={["Seleccione un jugador para que revele un secreto"]}
            typingSpeed={35}
          />
          <div className="action-buttons-group">
            <button
              className="action-button"
              onClick={handleConfirmPlayerReveal}
              disabled={lock || !selectedTargetPlayer}
            >
              {lock ? "Seleccionando..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}

      {step === "wait_reveal_secret" && ( // Para Satterthwaite (Paso 2)
        <div className="action-step-container">
          <TextType
            className="menu-indications"
            text={[
              `Esperando a que ${
                selectedTargetPlayer?.name ?? "el oponente"
              } revele un secreto...`,
            ]}
            typingSpeed={50}
            loop={true}
          />
        </div>
      )}

      {step === "sel_reveal_secret" && ( // REVEAL SECRET
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
          </div>
        </div>
      )}

      {step === "sel_hide_secret" && ( // HIDE SECRET
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
          </div>
        </div>
      )}
      {step === "delay_escape_selection" && (
        <div className="action-step-container">
          <TextType
            className="menu-indications"
            text={[
              "Selecciona hasta 5 cartas del descarte para devolver al mazo.",
            ]}
            typingSpeed={35}
          />
          <div className="discard-preview visible">
            {discardedCards.map((card) => (
              <div
                key={card.card_id}
                className={`card-container ${
                  selectedDiscardIds.includes(card.card_id) ? "isSelected" : ""
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
              onClick={handleDelayEscape}
              disabled={lock || selectedDiscardIds.length === 0}
            >
              {lock
                ? "Procesando..."
                : `Devolver ${selectedDiscardIds.length} Cartas`}
            </button>
            <button
              className="action-button"
              onClick={() => {
                setSelectedDiscardIds([]);
                setActiveEventCard(null);
                setSelectedCard(null);
                setStep("start");
              }}
              disabled={lock}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
