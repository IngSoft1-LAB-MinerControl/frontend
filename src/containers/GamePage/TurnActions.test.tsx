/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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
  {
    card_id: 3,
    game_id: gameId,
    player_id: playerId,
    type: "detective",
    name: "Miss Marple",
    picked_up: true,
    dropped: false,
  },
  {
    card_id: 4,
    game_id: gameId,
    player_id: playerId,
    type: "detective",
    name: "Parker Pyne",
    picked_up: true,
    dropped: false,
  },
  {
    card_id: 5,
    game_id: gameId,
    player_id: playerId,
    type: "detective",
    name: "Tommy Beresford",
    picked_up: true,
    dropped: false,
  },
  {
    card_id: 6,
    game_id: gameId,
    player_id: playerId,
    type: "detective",
    name: "Tuppence Beresford",
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
    name: "Point your suspicions",
    picked_up: true,
    dropped: false,
  },
  {
    card_id: 9,
    game_id: gameId,
    player_id: playerId,
    type: "event",
    name: "Dead card folly",
    picked_up: true,
    dropped: false,
  },
  {
    card_id: 10,
    game_id: gameId,
    player_id: playerId,
    type: "event",
    name: "Another Victim",
    picked_up: true,
    dropped: false,
  },
  {
    card_id: 11,
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
  detective: [detectiveCards[4], detectiveCards[5]], // Tommy + Tuppence
};

describe("TurnActions Component - Tests completos", () => {
  let setSelectedCard: ReturnType<typeof vi.fn>;
  let setSelectedCardIds: ReturnType<typeof vi.fn>;
  let setStep: ReturnType<typeof vi.fn>;
  let onTurnUpdated: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setSelectedCard = vi.fn();
    setSelectedCardIds = vi.fn();
    setStep = vi.fn();
    onTurnUpdated = vi.fn();

    render(
      <TurnActions
        gameId={gameId}
        playerId={playerId}
        selectedCardIds={[]}
        setSelectedCardIds={setSelectedCardIds}
        step={0}
        setStep={setStep}
        cardCount={5}
        selectedCard={null}
        setSelectedCard={setSelectedCard}
        discardedCards={discardedCards}
        selectedSet={mockSet}
        onTurnUpdated={onTurnUpdated}
      />
    );
  });

  it("Renderiza menú inicial con opciones de turno", () => {
    expect(screen.getByText("¿Qué acción desea realizar?")).toBeDefined();
    expect(screen.getByText("Bajar Set")).toBeDefined();
    expect(screen.getByText("Jugar Evento")).toBeDefined();
    expect(screen.getByText("Saltear")).toBeDefined();
  });

  it("Avanza al paso Jugar Set correctamente", async () => {
    await userEvent.click(screen.getByText("Bajar Set"));
    expect(setStep).toHaveBeenCalledWith(1);
  });

  it("Avanza al paso Jugar Evento correctamente", async () => {
    await userEvent.click(screen.getByText("Jugar Evento"));
    expect(setStep).toHaveBeenCalledWith(2);
  });

  it("Avanza al paso Saltear correctamente", async () => {
    await userEvent.click(screen.getByText("Saltear"));
    expect(setStep).toHaveBeenCalledWith(3);
  });

  it("Renderiza opciones de descarte al saltear", () => {
    render(
      <TurnActions
        gameId={gameId}
        playerId={playerId}
        selectedCardIds={[detectiveCards[0].card_id]}
        setSelectedCardIds={setSelectedCardIds}
        step={3}
        setStep={setStep}
        cardCount={6}
        selectedCard={detectiveCards[0]}
        setSelectedCard={setSelectedCard}
        discardedCards={discardedCards}
        selectedSet={mockSet}
        onTurnUpdated={onTurnUpdated}
      />
    );

    expect(screen.getByText("Descartar Selección")).toBeDefined();
    expect(screen.getByText("Volver")).toBeDefined();
  });

  it("Renderiza selección de set ", async () => {
    render(
      <TurnActions
        gameId={gameId}
        playerId={playerId}
        selectedCardIds={[]}
        setSelectedCardIds={setSelectedCardIds}
        step={1}
        setStep={setStep}
        cardCount={5}
        selectedCard={detectiveCards[1]}
        setSelectedCard={setSelectedCard}
        discardedCards={discardedCards}
        selectedSet={mockSet}
        onTurnUpdated={onTurnUpdated}
      />
    );

    expect(screen.getByText("Seleccione set")).toBeDefined();
    expect(screen.getByText("Jugar Set")).toBeDefined();
    expect(screen.getByText("Volver")).toBeDefined();
  });

  it("Renderiza selección de evento", () => {
    render(
      <TurnActions
        gameId={gameId}
        playerId={playerId}
        selectedCardIds={[]}
        setSelectedCardIds={setSelectedCardIds}
        step={2}
        setStep={setStep}
        cardCount={5}
        selectedCard={eventCards[0]}
        setSelectedCard={setSelectedCard}
        discardedCards={discardedCards}
        selectedSet={mockSet}
        onTurnUpdated={onTurnUpdated}
      />
    );
    expect(screen.getByText("Seleccione carta de evento")).toBeDefined();
    expect(screen.getByText("Jugar Evento Seleccionado")).toBeDefined();
    expect(screen.getByText("Volver")).toBeDefined();
  });

  it("Permite descartar carta seleccionada", async () => {
    render(
      <TurnActions
        gameId={gameId}
        playerId={playerId}
        selectedCardIds={[detectiveCards[0].card_id]}
        setSelectedCardIds={setSelectedCardIds}
        step={3}
        setStep={setStep}
        cardCount={5}
        selectedCard={detectiveCards[0]}
        setSelectedCard={setSelectedCard}
        discardedCards={discardedCards}
        selectedSet={mockSet}
        onTurnUpdated={onTurnUpdated}
      />
    );

    await userEvent.click(screen.getByText("Descartar Selección"));
  });

  it("Permite volver al paso anterior desde descarte", async () => {
    render(
      <TurnActions
        gameId={gameId}
        playerId={playerId}
        selectedCardIds={[detectiveCards[0].card_id]}
        setSelectedCardIds={setSelectedCardIds}
        step={3}
        setStep={setStep}
        cardCount={5}
        selectedCard={detectiveCards[0]}
        setSelectedCard={setSelectedCard}
        discardedCards={discardedCards}
        selectedSet={mockSet}
        onTurnUpdated={onTurnUpdated}
      />
    );

    await userEvent.click(screen.getByText("Volver"));
    expect(setStep).toHaveBeenCalled();
  });
});
