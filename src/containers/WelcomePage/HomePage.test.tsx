/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import HomePage from "./HomePage";
import destinations from "../../navigation/destinations";

// Mock de useNavigate para espiar la navegación
const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe("HomePage", () => {
  // Antes de cada test, reseteamos el mock para que no quede información de tests anteriores
  beforeEach(() => {
    mockedNavigate.mockReset();
  });

  // Test básico: que se renderice el título, labels y botones
  it("renderiza título, inputs y botones", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText("¡Bienvenido!")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Fecha de nacimiento")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nueva Partida" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Listar Partidas" })
    ).toBeInTheDocument();
  });

  // Test: error si no se ingresa nombre
  it("muestra error si no se ingresa nombre", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Nueva Partida" })
    );

    expect(
      await screen.findByText("Debe ingresar un nombre")
    ).toBeInTheDocument();
  });

  // Test: error si no se ingresa fecha
  it("muestra error si no se ingresa fecha", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText("Nombre"), "Juan");
    await userEvent.click(
      screen.getByRole("button", { name: "Nueva Partida" })
    );

    expect(
      await screen.findByText("Debe ingresar su fecha de nacimiento")
    ).toBeInTheDocument();
  });
  // Test: límite de 20 caracteres en el nombre
  it("no permite ingresar más de 20 caracteres en el nombre", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const input = screen.getByLabelText("Nombre");
    const longName = "a".repeat(25); // 25 caracteres
    await userEvent.type(input, longName);

    // Comprobamos que el valor se cortó a 20 caracteres
    expect(input).toHaveValue("a".repeat(20));
  });

  // Test: error si el jugador tiene menos de 15 años
  it("muestra error si el jugador es menor de 15 años", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText("Nombre");
    const dateInput = screen.getByLabelText("Fecha de nacimiento");

    const today = new Date();
    const underageYear = today.getFullYear() - 10; // 10 años
    const birthDate = `${underageYear}-01-01`;

    await userEvent.type(nameInput, "Juan");
    await userEvent.type(dateInput, birthDate);

    await userEvent.click(
      screen.getByRole("button", { name: "Nueva Partida" })
    );

    expect(
      await screen.findByText("El juego es solo para mayores de 15 años.")
    ).toBeInTheDocument();
  });

  // Test: navegación a crearPartida con datos válidos
  it("navega a crearPartida con datos válidos", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const name = "Juan Perez";
    const birth = "2000-01-01";

    await userEvent.type(screen.getByLabelText("Nombre"), name);
    await userEvent.type(screen.getByLabelText("Fecha de nacimiento"), birth);
    await userEvent.click(
      screen.getByRole("button", { name: "Nueva Partida" })
    );

    expect(mockedNavigate).toHaveBeenCalledWith(destinations.crearPartida, {
      state: { playerName: name, playerDate: birth },
    });
  });
});
