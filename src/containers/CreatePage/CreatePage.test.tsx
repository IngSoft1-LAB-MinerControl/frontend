/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import CreatePage from "./CreatePage";
import destinations from "../../navigation/destinations";

// Mock de useNavigate
const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

// Mocks de servicios
import gameService from "../../services/gameService";
import playerService from "../../services/playerService";

vi.mock("../../services/gameService");
vi.mock("../../services/playerService");

describe("CreatePage", () => {
  beforeEach(() => {
    mockedNavigate.mockReset();

    // Configuramos los mocks de los servicios para que devuelvan valores simulados
    (gameService.createGame as any).mockResolvedValue({ game_id: 123 });
    (playerService.createPlayer as any).mockResolvedValue({});
  });

  it("renderiza título, inputs y botones", () => {
    render(
      <MemoryRouter>
        <CreatePage />
      </MemoryRouter>
    );

    expect(screen.getByText("Información de partida")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre de la Partida")).toBeInTheDocument();
    expect(screen.getByLabelText("Mínimo de jugadores")).toBeInTheDocument();
    expect(screen.getByLabelText("Máximo de jugadores")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Crear partida" })
    ).toBeInTheDocument();
  });

  it("muestra error si no se ingresa nombre para la partida", async () => {
    render(
      <MemoryRouter>
        <CreatePage />
      </MemoryRouter>
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Crear partida" })
    );

    expect(
      await screen.findByText("Debe ingresar un nombre")
    ).toBeInTheDocument();
  });

  it("muestra error si minPlayers > maxPlayers", async () => {
    render(
      <MemoryRouter>
        <CreatePage />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText("Nombre de la Partida");
    await userEvent.type(nameInput, "Partida Test");

    const minInput = screen.getByLabelText("Mínimo de jugadores");
    const maxInput = screen.getByLabelText("Máximo de jugadores");

    await userEvent.clear(minInput);
    await userEvent.type(minInput, "5");
    await userEvent.clear(maxInput);
    await userEvent.type(maxInput, "3");

    await userEvent.click(
      screen.getByRole("button", { name: "Crear partida" })
    );

    expect(
      await screen.findByText(
        "El número mínimo de jugadores no puede ser mayor al máximo"
      )
    ).toBeInTheDocument();
  });

  it("muestra error si jugadores fuera de rango 2-6", async () => {
    render(
      <MemoryRouter>
        <CreatePage />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText("Nombre de la Partida");
    await userEvent.type(nameInput, "Partida Test");

    const minInput = screen.getByLabelText("Mínimo de jugadores");
    const maxInput = screen.getByLabelText("Máximo de jugadores");

    await userEvent.clear(minInput);
    await userEvent.type(minInput, "1");
    await userEvent.clear(maxInput);
    await userEvent.type(maxInput, "7");

    await userEvent.click(
      screen.getByRole("button", { name: "Crear partida" })
    );

    expect(
      await screen.findByText(
        "La cantidad de jugadores debe estar entre 2 y 6."
      )
    ).toBeInTheDocument();
  });

  it("navega al lobby con datos válidos", async () => {
    render(
      <MemoryRouter>
        <CreatePage />
      </MemoryRouter>
    );

    const nameInput = await screen.findByLabelText("Nombre de la Partida");
    await userEvent.type(nameInput, "Partida Test");

    const minInput = await screen.findByLabelText("Mínimo de jugadores");
    const maxInput = await screen.findByLabelText("Máximo de jugadores");

    await userEvent.clear(minInput);
    await userEvent.type(minInput, "2");
    await userEvent.clear(maxInput);
    await userEvent.type(maxInput, "6");

    await userEvent.click(
      await screen.findByRole("button", { name: "Crear partida" })
    );

    expect(mockedNavigate).toHaveBeenCalled();
    expect(mockedNavigate).toHaveBeenCalledWith(
      destinations.lobby,
      expect.objectContaining({
        state: expect.objectContaining({
          playerName: undefined,
          playerDate: undefined,
          game: { game_id: 123 },
        }),
      })
    );
  });
});
