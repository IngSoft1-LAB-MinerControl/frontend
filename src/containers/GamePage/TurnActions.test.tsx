/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TurnActions from "./TurnActions";
import type { CardResponse } from "../../services/cardService";
import type { SetResponse } from "../../services/setService";
import type { SecretResponse } from "../../services/secretService";

import gameService from "../../services/gameService";
import cardService from "../../services/cardService";
import setService from "../../services/setService";
import secretService from "../../services/secretService";

vi.mock("../../components/TextType", () => ({
  default: ({ text }: { text: string }) => <div>{text}</div>,
}));
vi.mock("../../components/Cards/Detectives", () => ({
  default: ({ name }: { name: string }) => <div>Detective: {name}</div>,
}));
vi.mock("../../components/Cards/Events", () => ({
  default: ({ name }: { name: string }) => <div>Evento: {name}</div>,
}));
vi.mock("../../services/gameService", () => ({
  default: { updateTurn: vi.fn().mockResolvedValue({ success: true }) },
}));
vi.mock("../../services/cardService", () => ({
  default: {
    drawCard: vi.fn().mockResolvedValue({} as CardResponse),
    pickUpDraftCard: vi.fn().mockResolvedValue({} as CardResponse),
    discardSelectedList: vi.fn().mockResolvedValue({} as CardResponse),
    pickUpFromDiscard: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock("../../services/setService", () => ({
  default: {
    playSet2: vi.fn().mockResolvedValue({}),
    playSet3: vi.fn().mockResolvedValue({}),
    stealSet: vi.fn().mockResolvedValue({} as SetResponse),
  },
}));

vi.mock("../../services/secretService", () => ({
  default: {
    revealSecret: vi.fn().mockResolvedValue({}),
    hideSecret: vi.fn().mockResolvedValue({}),
  },
}));
const gameId = 1;
const playerId = 1;
const detectiveCards: CardResponse[] = [
  {
    card_id: 1,
    game_id: gameId,
    player_id: playerId,
    type: "detective",
    name: "Harley Quin Wildcard",
    picked_up: true,
    dropped: false,
  },
  {
    card_id: 2,
    game_id: gameId,
    player_id: playerId,
    type: "detective",
    name: "Adriane Oliver",
    picked_up: true,
    dropped: false,
  },
];
const eventCards: CardResponse[] = [
  {
    card_id: 7,
    game_id: gameId,
    player_id: playerId,
    type: "event",
    name: "Delay the murderer's escape!",
    picked_up: true,
    dropped: false,
  },
  {
    card_id: 8,
    game_id: gameId,
    player_id: playerId,
    type: "event",
    name: "Another Victim",
    picked_up: true,
    dropped: false,
  },
  {
    card_id: 9,
    game_id: gameId,
    player_id: playerId,
    type: "event",
    name: "Look into the ashes",
    picked_up: true,
    dropped: false,
  },
];
const discardedCards: CardResponse[] = [...detectiveCards, ...eventCards];
const mockSet: SetResponse = {
  game_id: gameId,
  player_id: playerId,
  set_id: 1,
  name: "Beresford brothers",
  detective: [detectiveCards[0], detectiveCards[1]],
};
const mockSecret: SecretResponse = {
  secret_id: 1,
  player_id: playerId,
  game_id: gameId,
  revelated: false,
  murderer: false,
  accomplice: false,
};
const revelatedMockSecret: SecretResponse = {
  secret_id: 2,
  player_id: playerId,
  game_id: gameId,
  revelated: true,
  murderer: false,
  accomplice: true,
};

describe("TurnActions Component - Tests completos", () => {
  let setSelectedCard: ReturnType<typeof vi.fn>;
  let setSelectedCardIds: ReturnType<typeof vi.fn>;
  let setStep: ReturnType<typeof vi.fn>;
  let onTurnUpdated: ReturnType<typeof vi.fn>;
  let setSelectedSecret: ReturnType<typeof vi.fn>;
  let baseProps: any;

  beforeEach(() => {
    setSelectedCard = vi.fn();
    setSelectedCardIds = vi.fn();
    setStep = vi.fn();
    onTurnUpdated = vi.fn();
    setSelectedSecret = vi.fn();
    cleanup();

    vi.clearAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => {});

    baseProps = {
      gameId,
      playerId,
      onTurnUpdated,
      selectedCardIds: [],
      setSelectedCardIds,
      cardCount: 5,
      selectedCard: null,
      setSelectedCard,
      discardedCards,
      selectedSet: mockSet,
      selectedSecret: null,
      setSelectedSecret,
    };
  });

  it("Renderiza menú inicial con opciones de turno", () => {
    render(<TurnActions {...baseProps} step={"start"} setStep={setStep} />);

    expect(screen.getByText("¿Qué acción desea realizar?")).not.toBeNull();
    expect(screen.getByText("Bajar Set")).not.toBeNull();
    expect(screen.getByText("Jugar Evento")).not.toBeNull();
    expect(screen.getByText("Saltear")).not.toBeNull();
  });

  it("Avanza al paso Jugar Set correctamente", async () => {
    render(<TurnActions {...baseProps} step={"start"} setStep={setStep} />);

    await userEvent.click(screen.getByText("Bajar Set"));
    expect(setStep).toHaveBeenCalledWith("p_set");
  });

  it("Avanza al paso Jugar Evento correctamente", async () => {
    render(<TurnActions {...baseProps} step={"start"} setStep={setStep} />);

    await userEvent.click(screen.getByText("Jugar Evento"));
    expect(setStep).toHaveBeenCalledWith("p_event");
  });

  it("Avanza al paso Saltear correctamente", async () => {
    render(<TurnActions {...baseProps} step={"start"} setStep={setStep} />);

    await userEvent.click(screen.getByText("Saltear"));
    expect(setStep).toHaveBeenCalledWith("discard_skip");
  });

  it("Renderiza opciones de descarte al saltear", () => {
    render(
      <TurnActions {...baseProps} step={"discard_skip"} setStep={setStep} />
    );

    expect(screen.getByText("Descartar Selección")).not.toBeNull();
    expect(screen.getByText("Volver")).not.toBeNull();
  });

  it("Renderiza selección de set", () => {
    render(<TurnActions {...baseProps} step={"p_set"} setStep={setStep} />);

    expect(screen.getByText("Seleccione set")).not.toBeNull();
    expect(screen.getByText("Jugar Set")).not.toBeNull();
    expect(screen.getByText("Volver")).not.toBeNull();
  });

  it("Renderiza selección de evento", () => {
    render(<TurnActions {...baseProps} step={"p_event"} setStep={setStep} />);
    expect(screen.getByText("Seleccione carta de evento")).not.toBeNull();
    expect(screen.getByText("Jugar Evento Seleccionado")).not.toBeNull();
    expect(screen.getByText("Volver")).not.toBeNull();
  });

  it("Permite descartar carta seleccionada", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"discard_skip"}
        setStep={setStep}
        selectedCardIds={[detectiveCards[0].card_id]}
      />
    );

    await userEvent.click(screen.getByText("Descartar Selección"));
  });

  it("Permite volver al paso anterior desde descarte", async () => {
    render(
      <TurnActions {...baseProps} step={"discard_skip"} setStep={setStep} />
    );
    await userEvent.click(screen.getByText("Volver"));
    expect(setStep).toHaveBeenCalledWith("start");
  });

  it("permite bajar un set de 2 cartas y avanza a set_actions", async () => {
    const playSet2Mock = vi.spyOn(setService, "playSet2");
    render(
      <TurnActions
        {...baseProps}
        step={"p_set"}
        setStep={setStep}
        selectedCardIds={[1, 2]}
      />
    );
    await userEvent.click(screen.getByText("Jugar Set"));
    expect(playSet2Mock).toHaveBeenCalledWith(1, 2);
    expect(setSelectedCardIds).toHaveBeenCalledWith([]);
    expect(setStep).toHaveBeenCalledWith("set_actions");
  });
  it("handlePlaySet: permite bajar un set de 3 cartas y avanza a set_actions", async () => {
    const playSet3Mock = vi.spyOn(setService, "playSet3");
    render(
      <TurnActions
        {...baseProps}
        step={"p_set"}
        setStep={setStep}
        selectedCardIds={[1, 2, 3]}
      />
    );
    await userEvent.click(screen.getByText("Jugar Set"));
    expect(playSet3Mock).toHaveBeenCalledWith(1, 2, 3);
    expect(setSelectedCardIds).toHaveBeenCalledWith([]);
    expect(setStep).toHaveBeenCalledWith("set_actions");
  });

  it("handlePlaySet: muestra mensaje si se intenta bajar set con menos de 2 cartas", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"p_set"}
        setStep={setStep}
        selectedCardIds={[1]}
      />
    );
    await userEvent.click(screen.getByText("Jugar Set"));
    expect(screen.getByText("Seleccione un set válido")).toBeInTheDocument();
    expect(setStep).not.toHaveBeenCalled();
    expect(screen.queryByText("Seleccione un set válido")).toBeInTheDocument();
  });

  it("handlePlaySet: muestra mensaje de error si el servicio falla", async () => {
    const playSet2Mock = vi
      .spyOn(setService, "playSet2")
      .mockRejectedValue(new Error("Error de set"));
    render(
      <TurnActions
        {...baseProps}
        step={"p_set"}
        setStep={setStep}
        selectedCardIds={[1, 2]}
      />
    );
    await userEvent.click(screen.getByText("Jugar Set"));
    expect(playSet2Mock).toHaveBeenCalled();
    expect(
      screen.getByText("Set inválido. Elija otra combinacigón")
    ).toBeInTheDocument();
    expect(setStep).not.toHaveBeenCalled();
  });

  it("handlePlayEvent: redirige a 'another_victim' si se selecciona 'Another Victim'", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"p_event"}
        setStep={setStep}
        selectedCard={eventCards[1]}
      />
    );
    await userEvent.click(screen.getByText("Jugar Evento Seleccionado"));
    expect(setStep).toHaveBeenCalledWith("another_victim");
    expect(setSelectedCard).not.toHaveBeenCalled();
  });
  it("handlePlayEvent: redirige a 'look_into_the_ashes' si se selecciona 'Look into the ashes'", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"p_event"}
        setStep={setStep}
        selectedCard={eventCards[2]}
      />
    );
    await userEvent.click(screen.getByText("Jugar Evento Seleccionado"));
    expect(setStep).toHaveBeenCalledWith("look_into_the_ashes");
  });
  it("handlePlayEvent: muestra mensaje si no se selecciona una carta de evento", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"p_event"}
        setStep={setStep}
        selectedCard={detectiveCards[0]}
      />
    );
    await userEvent.click(screen.getByText("Jugar Evento Seleccionado"));
    expect(
      screen.getByText(/seleccione un evento valido/i)
    ).toBeInTheDocument();
    expect(setStep).not.toHaveBeenCalled();
  });

  it("handleDiscardSel: muestra mensaje si no se selecciona ninguna carta para descartar", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"discard_skip"}
        setStep={setStep}
        selectedCardIds={[]}
      />
    );
    await userEvent.click(screen.getByText("Descartar Selección"));

    await waitFor(() => {
      expect(
        screen.getByText("No seleccionaste ninguna carta.")
      ).toBeInTheDocument();
    });

    expect(setStep).not.toHaveBeenCalled();
  });

  it("handleDiscardSel: muestra mensaje de error si el servicio de descarte falla", async () => {
    vi.spyOn(cardService, "discardSelectedList").mockRejectedValue(
      new Error("Error de descarte")
    );
    render(
      <TurnActions
        {...baseProps}
        step={"discard_skip"}
        setStep={setStep}
        selectedCardIds={[detectiveCards[0].card_id]}
      />
    );
    await userEvent.click(screen.getByText("Descartar Selección"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Error al descartar cartas seleccionadas. Intenta de nuevo."
        )
      ).toBeInTheDocument();
    });

    expect(setStep).not.toHaveBeenCalled();
  });

  it("handleEndTurn: finaliza el turno y restablece el paso a 'start'", async () => {
    const updateTurnMock = vi.spyOn(gameService, "updateTurn");
    render(
      <TurnActions
        {...baseProps}
        step={"draw"}
        setStep={setStep}
        cardCount={6}
      />
    ); // cardCount > 5 para mostrar el botón de finalizar turno
    await userEvent.click(screen.getByText("Finalizar Turno"));
    expect(updateTurnMock).toHaveBeenCalledWith(gameId);
    expect(setStep).toHaveBeenCalledWith("start");
  });

  it("handleEndTurn: muestra mensaje de error si falla al finalizar el turno", async () => {
    vi.spyOn(gameService, "updateTurn").mockRejectedValue(
      new Error("Error de turno")
    );
    render(
      <TurnActions
        {...baseProps}
        step={"draw"}
        setStep={setStep}
        cardCount={6}
      />
    );
    await userEvent.click(screen.getByText("Finalizar Turno"));
    await waitFor(() => {
      expect(
        screen.getByText("Error al finalizar turno. Intenta de nuevo.")
      ).toBeInTheDocument();
    });
    expect(setStep).not.toHaveBeenCalledWith("start");
  });

  it("handleDraw: roba una carta del mazo principal", async () => {
    const drawCardMock = vi.spyOn(cardService, "drawCard");
    render(
      <TurnActions
        {...baseProps}
        step={"draw"}
        setStep={setStep}
        cardCount={5}
      />
    );
    await userEvent.click(screen.getByText("Robar Mazo Principal"));
    expect(drawCardMock).toHaveBeenCalledWith(playerId, gameId);
  });

  it("handleDraw: muestra alerta si falla al robar del mazo principal", async () => {
    vi.spyOn(cardService, "drawCard").mockRejectedValue(
      new Error("Error al robar")
    );
    render(
      <TurnActions
        {...baseProps}
        step={"draw"}
        setStep={setStep}
        cardCount={5}
      />
    );
    await userEvent.click(screen.getByText("Robar Mazo Principal"));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Error al robar carta. Intenta de nuevo."
      );
    });
  });

  it("handleDrawDraft: roba una carta del draft y avanza a draw", async () => {
    const pickUpDraftCardMock = vi.spyOn(cardService, "pickUpDraftCard");
    render(
      <TurnActions
        {...baseProps}
        step={"draw"}
        setStep={setStep}
        cardCount={5}
        selectedCard={detectiveCards[0]}
      />
    );
    await userEvent.click(screen.getByText("Robar Mazo Draft"));
    expect(pickUpDraftCardMock).toHaveBeenCalledWith(
      gameId,
      detectiveCards[0].card_id,
      playerId
    );
    expect(setSelectedCard).toHaveBeenCalledWith(null);
    expect(setStep).toHaveBeenCalledWith("draw");
  });

  it("handleDrawDraft: muestra alerta si falla al robar del draft", async () => {
    vi.spyOn(cardService, "pickUpDraftCard").mockRejectedValue(
      new Error("Error de draft")
    );
    render(
      <TurnActions
        {...baseProps}
        step={"draw"}
        setStep={setStep}
        cardCount={5}
        selectedCard={detectiveCards[0]}
      />
    );
    await userEvent.click(screen.getByText("Robar Mazo Draft"));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Error al robar la carta del draft. Intenta de nuevo."
      );
    });
  });

  it("handleStealSet: muestra mensaje si no hay carta de evento activa (selectedCard es null)", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"another_victim"}
        setStep={setStep}
        selectedSet={mockSet}
        selectedCard={null}
      />
    );
    await userEvent.click(screen.getByText("Robar"));
    expect(
      screen.getByText("Debe seleccionar un set para robar.")
    ).toBeInTheDocument();
    expect(setService.stealSet).not.toHaveBeenCalled();
    expect(setStep).not.toHaveBeenCalled();
  });

  it("handleStealSet: muestra mensaje de error si falla al robar set", async () => {
    (setService.stealSet as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Error al robar set")
    );

    const { rerender } = render(
      <TurnActions
        {...baseProps}
        step={"p_event"}
        setStep={setStep}
        selectedCard={eventCards[1]}
        setSelectedCard={setSelectedCard}
        selectedSet={null}
      />
    );

    await userEvent.click(screen.getByText("Jugar Evento Seleccionado"));
    expect(setStep).toHaveBeenCalledWith("another_victim");

    rerender(
      <TurnActions
        {...baseProps}
        step={"another_victim"}
        setStep={setStep}
        selectedSet={mockSet}
        selectedCard={eventCards[1]}
        setSelectedCard={setSelectedCard}
      />
    );

    await userEvent.click(screen.getByText("Robar"));

    await waitFor(() => {
      expect(
        screen.getByText("Error al robar set. Intenta de nuevo.")
      ).toBeInTheDocument();
    });

    expect(setStep).not.toHaveBeenCalledWith("discard_op");
  });

  it("handleStealSet: cancelar desde another_victim vuelve a start y resetea selectedCard", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"another_victim"}
        setStep={setStep}
        selectedCard={eventCards[1]}
      />
    );
    await userEvent.click(screen.getByText("Cancelar"));
    expect(setSelectedCard).toHaveBeenCalledWith(null);
    expect(setStep).toHaveBeenCalledWith("start");
  });

  it("handleDiscardCardSelect: selecciona una carta del descarte", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"look_into_the_ashes"}
        setStep={setStep}
        discardedCards={discardedCards}
      />
    );
    const cardToSelect = discardedCards[0];
    await userEvent.click(screen.getByText(`Detective: ${cardToSelect.name}`));
    expect(setSelectedCard).toHaveBeenCalledWith(cardToSelect);
  });

  it("handleDiscardCardSelect: deselecciona una carta del descarte si ya estaba seleccionada", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"look_into_the_ashes"}
        setStep={setStep}
        discardedCards={discardedCards}
        selectedCard={discardedCards[0]}
      />
    );
    const cardToDeselect = discardedCards[0];
    await userEvent.click(
      screen.getByText(`Detective: ${cardToDeselect.name}`)
    );
    expect(setSelectedCard).toHaveBeenCalledWith(null);
  });

  it("handleDiscardCardSelect: selecciona una nueva carta si ya había una seleccionada diferente", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"look_into_the_ashes"}
        setStep={setStep}
        discardedCards={discardedCards}
        selectedCard={discardedCards[0]}
      />
    );
    const newCardToSelect = discardedCards[1];
    await userEvent.click(
      screen.getByText(`Detective: ${newCardToSelect.name}`)
    );
    expect(setSelectedCard).toHaveBeenCalledWith(newCardToSelect);
  });

  it("handlePickUpFromDiscard: roba una carta del descarte y descarta la carta de evento 'Look into the ashes'", async () => {
    const pickUpFromDiscardMock = vi
      .spyOn(cardService, "pickUpFromDiscard")
      .mockResolvedValue();
    const discardSelectedListMock = vi.spyOn(
      cardService,
      "discardSelectedList"
    );

    const { rerender } = render(
      <TurnActions
        {...baseProps}
        step={"p_event"}
        setStep={setStep}
        selectedCard={eventCards[2]}
        setSelectedCard={setSelectedCard}
        discardedCards={discardedCards}
      />
    );

    await userEvent.click(screen.getByText("Jugar Evento Seleccionado"));
    expect(setStep).toHaveBeenCalledWith("look_into_the_ashes");

    rerender(
      <TurnActions
        {...baseProps}
        step={"look_into_the_ashes"}
        setStep={setStep}
        selectedCard={discardedCards[0]}
        setSelectedCard={setSelectedCard}
        discardedCards={discardedCards}
      />
    );

    await userEvent.click(screen.getByText("Robar Carta"));

    await waitFor(() => {
      expect(pickUpFromDiscardMock).toHaveBeenCalledWith(
        playerId,
        discardedCards[0].card_id
      );
      expect(discardSelectedListMock).toHaveBeenCalledWith(playerId, [
        eventCards[2].card_id,
      ]);
      expect(setSelectedCard).toHaveBeenCalledWith(null);
      expect(setStep).toHaveBeenCalledWith("discard_op");
    });
  });

  it("handlePickUpFromDiscard: muestra mensaje si no se selecciona una carta del descarte", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"look_into_the_ashes"}
        setStep={setStep}
        discardedCards={discardedCards}
        selectedCard={null}
      />
    );
    await userEvent.click(screen.getByText("Robar Carta"));
    expect(
      screen.getByText("Debe seleccionar una carta del descarte.")
    ).toBeInTheDocument();
    expect(cardService.pickUpFromDiscard).not.toHaveBeenCalled();
    expect(setStep).not.toHaveBeenCalled();
  });

  it("handlePickUpFromDiscard: muestra mensaje de error si falla al robar del descarte", async () => {
    vi.spyOn(cardService, "pickUpFromDiscard").mockRejectedValue(
      new Error("Error al robar descarte")
    );

    const { rerender } = render(
      <TurnActions
        {...baseProps}
        step={"p_event"}
        setStep={setStep}
        selectedCard={eventCards[2]}
      />
    );
    await userEvent.click(screen.getByText("Jugar Evento Seleccionado"));
    expect(setStep).toHaveBeenCalledWith("look_into_the_ashes");

    rerender(
      <TurnActions
        {...baseProps}
        step={"look_into_the_ashes"}
        setStep={setStep}
        discardedCards={discardedCards}
        selectedCard={discardedCards[0]}
      />
    );
    await userEvent.click(screen.getByText("Robar Carta"));
    await waitFor(() => {
      expect(
        screen.getByText("Error al robar del descarte. Intenta de nuevo.")
      ).toBeInTheDocument();
    });
    expect(setStep).not.toHaveBeenCalledWith("discard_op");
  });

  it("handlePickUpFromDiscard: cancelar desde look_into_the_ashes vuelve a start y resetea selectedCard", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"look_into_the_ashes"}
        setStep={setStep}
        selectedCard={discardedCards[0]}
      />
    );
    await userEvent.click(screen.getByText("Cancelar"));
    expect(setSelectedCard).toHaveBeenCalledWith(null);
    expect(setStep).toHaveBeenCalledWith("start");
  });

  it("renderiza el menú set_actions después de bajar un set", async () => {
    render(
      <TurnActions {...baseProps} step={"set_actions"} setStep={setStep} />
    );
    expect(screen.getByText("Seleccione una acción")).toBeInTheDocument();
    expect(screen.getByText("Revelar secreto")).toBeInTheDocument();
    expect(screen.getByText("Ocultar secreto")).toBeInTheDocument();
  });

  it("Avanza al paso 'reveal_secret' desde 'set_actions'", async () => {
    render(
      <TurnActions {...baseProps} step={"set_actions"} setStep={setStep} />
    );
    await userEvent.click(screen.getByText("Revelar secreto"));
    expect(setStep).toHaveBeenCalledWith("reveal_secret");
  });

  it("Avanza al paso 'hide_secret' desde 'set_actions'", async () => {
    render(
      <TurnActions {...baseProps} step={"set_actions"} setStep={setStep} />
    );
    await userEvent.click(screen.getByText("Ocultar secreto"));
    expect(setStep).toHaveBeenCalledWith("hide_secret");
  });

  it("handleRevealSecret: revela un secreto y avanza a 'discard_op'", async () => {
    const revealSecretMock = vi.spyOn(secretService, "revealSecret");
    render(
      <TurnActions
        {...baseProps}
        step={"reveal_secret"}
        setStep={setStep}
        selectedSecret={mockSecret}
      />
    );
    await userEvent.click(screen.getByText("Revelar"));
    expect(revealSecretMock).toHaveBeenCalledWith(mockSecret.secret_id);
    expect(setSelectedSecret).toHaveBeenCalledWith(null);
    expect(setStep).toHaveBeenCalledWith("discard_op");
  });

  it("handleRevealSecret: muestra mensaje si no se selecciona un secreto para revelar", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"reveal_secret"}
        setStep={setStep}
        selectedSecret={null}
      />
    );
    await userEvent.click(screen.getByText("Revelar"));
    expect(
      screen.getByText("Debe seleccionar un secreto para revelar.")
    ).toBeInTheDocument();
    expect(secretService.revealSecret).not.toHaveBeenCalled();
    expect(setStep).not.toHaveBeenCalled();
  });

  it("handleRevealSecret: muestra mensaje de error si falla al revelar el secreto", async () => {
    vi.spyOn(secretService, "revealSecret").mockRejectedValue(
      new Error("Error al revelar")
    );
    render(
      <TurnActions
        {...baseProps}
        step={"reveal_secret"}
        setStep={setStep}
        selectedSecret={mockSecret}
      />
    );
    await userEvent.click(screen.getByText("Revelar"));
    await waitFor(() => {
      expect(
        screen.getByText("Error al revelar secreto. Intenta de nuevo.")
      ).toBeInTheDocument();
    });
    expect(setStep).not.toHaveBeenCalledWith("discard_op");
  });

  it("handleRevealSecret: cancelar desde reveal_secret vuelve a start y resetea selectedSecret", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"reveal_secret"}
        setStep={setStep}
        selectedSecret={mockSecret}
      />
    );
    await userEvent.click(screen.getByText("Cancelar"));
    expect(setSelectedSecret).toHaveBeenCalledWith(null);
    expect(setStep).toHaveBeenCalledWith("start");
  });

  it("handleHideSecret: oculta un secreto y avanza a 'discard_op'", async () => {
    const hideSecretMock = vi.spyOn(secretService, "hideSecret");
    render(
      <TurnActions
        {...baseProps}
        step={"hide_secret"}
        setStep={setStep}
        selectedSecret={revelatedMockSecret}
      />
    );
    await userEvent.click(screen.getByText("Ocultar"));
    expect(hideSecretMock).toHaveBeenCalledWith(revelatedMockSecret.secret_id);
    expect(setSelectedSecret).toHaveBeenCalledWith(null);
    expect(setStep).toHaveBeenCalledWith("discard_op");
  });

  it("handleHideSecret: muestra mensaje si no se selecciona un secreto para ocultar", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"hide_secret"}
        setStep={setStep}
        selectedSecret={null}
      />
    );
    await userEvent.click(screen.getByText("Ocultar"));
    expect(
      screen.getByText("Debe seleccionar un secreto para revelar.")
    ).toBeInTheDocument();
    expect(secretService.hideSecret).not.toHaveBeenCalled();
    expect(setStep).not.toHaveBeenCalled();
  });

  it("handleHideSecret: muestra mensaje de error si falla al ocultar el secreto", async () => {
    vi.spyOn(secretService, "hideSecret").mockRejectedValue(
      new Error("Error al ocultar")
    );
    render(
      <TurnActions
        {...baseProps}
        step={"hide_secret"}
        setStep={setStep}
        selectedSecret={revelatedMockSecret}
      />
    );
    await userEvent.click(screen.getByText("Ocultar"));
    await waitFor(() => {
      expect(
        screen.getByText("Error al ocultar secreto. Intenta de nuevo.")
      ).toBeInTheDocument();
    });
    expect(setStep).not.toHaveBeenCalledWith("discard_op");
  });

  it("handleHideSecret: cancelar desde hide_secret vuelve a set_actions y resetea selectedSecret", async () => {
    render(
      <TurnActions
        {...baseProps}
        step={"hide_secret"}
        setStep={setStep}
        selectedSecret={revelatedMockSecret}
      />
    );
    await userEvent.click(screen.getByText("Cancelar"));
    expect(setSelectedSecret).toHaveBeenCalledWith(null);
    expect(setStep).toHaveBeenCalledWith("set_actions");
  });

  it("Renderiza opciones de descarte al estar en 'discard_op'", () => {
    render(
      <TurnActions {...baseProps} step={"discard_op"} setStep={setStep} />
    );
    expect(screen.getByText("Seleccione una o mas cartas")).toBeInTheDocument();
    expect(screen.getByText("Descartar Selección")).toBeInTheDocument();
    expect(screen.getByText("No Descartar")).toBeInTheDocument();
  });

  it("handleDiscardSel: permite descartar carta seleccionada desde discard_op y avanza a draw", async () => {
    const discardSelectedListMock = vi.spyOn(
      cardService,
      "discardSelectedList"
    );
    render(
      <TurnActions
        {...baseProps}
        step={"discard_op"}
        setStep={setStep}
        selectedCardIds={[detectiveCards[0].card_id]}
      />
    );

    await userEvent.click(screen.getByText("Descartar Selección"));
    await waitFor(() => {
      expect(discardSelectedListMock).toHaveBeenCalledWith(playerId, [
        detectiveCards[0].card_id,
      ]);
    });
    expect(setSelectedCardIds).toHaveBeenCalledWith([]);
    expect(setStep).toHaveBeenCalledWith("draw");
  });

  it("Desde 'discard_op', 'No Descartar' avanza a 'draw'", async () => {
    render(
      <TurnActions {...baseProps} step={"discard_op"} setStep={setStep} />
    );
    await userEvent.click(screen.getByText("No Descartar"));
    expect(setStep).toHaveBeenCalledWith("draw");
  });
});
