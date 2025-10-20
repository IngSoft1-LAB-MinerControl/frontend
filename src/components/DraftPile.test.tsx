/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DraftPile from "./DraftPile";
import type { CardResponse } from "../services/cardService";

vi.mock("./Cards/Detectives", () => ({
  default: ({ name }: { name: string }) => (
    <div data-testid="detective-card">{name}</div>
  ),
}));
vi.mock("./Cards/Events", () => ({
  default: ({ name }: { name: string }) => (
    <div data-testid="event-card">{name}</div>
  ),
}));
vi.mock("./Button", () => ({
  default: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ),
}));

describe("DraftPile Component", () => {
  const mockCards: CardResponse[] = [
    {
      card_id: 1,
      type: "detective",
      name: "Sherlock Holmes",
      game_id: 1,
      player_id: 1,
      picked_up: false,
      dropped: true,
    },
    {
      card_id: 2,
      type: "event",
      name: "Mistery Unveiled",
      game_id: 1,
      player_id: 1,
      picked_up: false,
      dropped: true,
    },
  ];
  let onCardSelectMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    onCardSelectMock = vi.fn();
  });

  it("renders placeholders when no cards are provided", () => {
    render(
      <DraftPile
        cards={[]}
        selectedCard={null}
        onCardSelect={onCardSelectMock}
        isMyTurn={false}
      />
    );
    // Buscamos por la clase que se usa para los placeholders
    const placeholders = document.querySelectorAll(".draft-placeholder");
    expect(placeholders.length).toBe(3);
    expect(screen.queryByText("Sherlock Holmes")).not.toBeInTheDocument();
  });

  it("renders cards correctly when provided", () => {
    render(
      <DraftPile
        cards={mockCards}
        selectedCard={null}
        onCardSelect={onCardSelectMock}
        isMyTurn={true}
      />
    );
    expect(screen.getByText("Sherlock Holmes")).toBeInTheDocument();
    expect(screen.getByText("Mistery Unveiled")).toBeInTheDocument();
  });

  it("expands and collapses when the toggle button is clicked", async () => {
    render(
      <DraftPile
        cards={mockCards}
        selectedCard={null}
        onCardSelect={onCardSelectMock}
        isMyTurn={true}
      />
    );

    const viewButton = screen.getByRole("button", { name: /Ver Draft/i });
    await userEvent.click(viewButton);

    // Assert: El botón de ver desaparece y el de volver aparece
    expect(
      screen.queryByRole("button", { name: /Ver Draft/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Volver/i })).toBeInTheDocument();

    const backButton = screen.getByRole("button", { name: /Volver/i });
    await userEvent.click(backButton);

    expect(
      screen.getByRole("button", { name: /Ver Draft/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Volver/i })
    ).not.toBeInTheDocument();
  });

  it("calls onCardSelect when a card is clicked and it's the player's turn", async () => {
    render(
      <DraftPile
        cards={mockCards}
        selectedCard={null}
        onCardSelect={onCardSelectMock}
        isMyTurn={true}
      />
    );

    const cardElement = screen.getByText("Sherlock Holmes");
    await userEvent.click(cardElement);

    expect(onCardSelectMock).toHaveBeenCalledTimes(1);
    expect(onCardSelectMock).toHaveBeenCalledWith(mockCards[0]);
  });

  it("does NOT call onCardSelect when a card is clicked and it's NOT the player's turn", async () => {
    render(
      <DraftPile
        cards={mockCards}
        selectedCard={null}
        onCardSelect={onCardSelectMock}
        isMyTurn={false}
      />
    );

    const cardElement = screen.getByText("Sherlock Holmes");
    await userEvent.click(cardElement);

    expect(onCardSelectMock).not.toHaveBeenCalled();
  });

  it("applies 'selected' class to the selected card", () => {
    render(
      <DraftPile
        cards={mockCards}
        selectedCard={mockCards[0]}
        onCardSelect={onCardSelectMock}
        isMyTurn={true}
      />
    );

    const selectedCardElement =
      screen.getByText("Sherlock Holmes").parentElement;
    expect(selectedCardElement).toHaveClass("selected");

    const notSelectedCardElement =
      screen.getByText("Mistery Unveiled").parentElement;
    expect(notSelectedCardElement).not.toHaveClass("selected");
  });
});
