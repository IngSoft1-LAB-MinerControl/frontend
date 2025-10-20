/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TurnActions from "./TurnActions";
import type { CardResponse } from "../../services/cardService";
import type { SetResponse } from "../../services/setService";

vi.mock("../../components/TextType", () => ({
  default: ({ text }: { text: string }) => <div>{text}</div>,
}));
vi.mock("../../services/gameService", () => ({
  default: { updateTurn: vi.fn().mockResolvedValue({ success: true }) },
}));
vi.mock("../../services/cardService", () => ({
  default: {
    drawCard: vi.fn().mockResolvedValue({}),
    pickUpDraftCard: vi.fn().mockResolvedValue({}),
    discardSelectedList: vi.fn().mockResolvedValue({ success: true }),
    pickUpFromDiscard: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock("../../services/setService", () => ({
  default: {
    playSet2: vi.fn().mockResolvedValue({}),
    playSet3: vi.fn().mockResolvedValue({}),
    stealSet: vi.fn().mockResolvedValue({}),
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
];
const discardedCards: CardResponse[] = [...detectiveCards, ...eventCards];
const mockSet: SetResponse = {
  game_id: gameId,
  player_id: playerId,
  set_id: 1,
  name: "Beresford brothers",
  detective: [detectiveCards[0], detectiveCards[1]],
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
});
