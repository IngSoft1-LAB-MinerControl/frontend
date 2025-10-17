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

describe("Validaciones del formulario en inicio", () => {
  beforeEach(() => {
    mockedNavigate.mockReset();
  });

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

  it("muestra error si no se completa ningún campo", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Nueva Partida" })
    );

    expect(
      await screen.findByText(
        "Debe ingresar un nombre, fecha de nacimiento y avatar"
      )
    ).toBeInTheDocument();
  });

  it("muestra error si falta nombre y avatar", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await userEvent.type(
      screen.getByLabelText("Fecha de nacimiento"),
      "2000-01-01"
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Nueva Partida" })
    );

    expect(
      await screen.findByText("Debe ingresar un nombre y seleccionar un avatar")
    ).toBeInTheDocument();
  });

  it("muestra error si falta fecha y avatar", async () => {
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
      await screen.findByText(
        "Debe ingresar su fecha de nacimiento y seleccionar un avatar"
      )
    ).toBeInTheDocument();
  });

  it("muestra error si falta nombre y fecha", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByText("Elija"));
    await userEvent.click(screen.getByAltText("Avatar 1"));
    await userEvent.click(
      screen.getByRole("button", { name: "Nueva Partida" })
    );

    expect(
      await screen.findByText("Debe ingresar su nombre y fecha de nacimiento")
    ).toBeInTheDocument();
  });

  it("muestra error si falta solo el avatar", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText("Nombre"), "Juan");
    await userEvent.type(
      screen.getByLabelText("Fecha de nacimiento"),
      "2000-01-01"
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Nueva Partida" })
    );

    expect(
      await screen.findByText("Debe elegir un avatar")
    ).toBeInTheDocument();
  });

  it("muestra error si falta solo el nombre", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await userEvent.type(
      screen.getByLabelText("Fecha de nacimiento"),
      "2000-01-01"
    );
    await userEvent.click(screen.getByText("Elija"));
    await userEvent.click(screen.getByAltText("Avatar 1"));
    await userEvent.click(
      screen.getByRole("button", { name: "Nueva Partida" })
    );

    expect(
      await screen.findByText("Debe ingresar un nombre")
    ).toBeInTheDocument();
  });

  it("muestra error si falta solo la fecha", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText("Nombre"), "Juan");
    await userEvent.click(screen.getByText("Elija"));
    await userEvent.click(screen.getByAltText("Avatar 1"));
    await userEvent.click(
      screen.getByRole("button", { name: "Nueva Partida" })
    );

    expect(
      await screen.findByText("Debe ingresar su fecha de nacimiento")
    ).toBeInTheDocument();
  });

  it("muestra error si el jugador es menor de 15 años", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const today = new Date();
    const underageYear = today.getFullYear() - 10;
    const birthDate = `${underageYear}-01-01`;

    await userEvent.type(screen.getByLabelText("Nombre"), "Juan");
    await userEvent.type(
      screen.getByLabelText("Fecha de nacimiento"),
      birthDate
    );
    await userEvent.click(screen.getByText("Elija"));
    await userEvent.click(screen.getByAltText("Avatar 1"));
    await userEvent.click(
      screen.getByRole("button", { name: "Nueva Partida" })
    );

    expect(
      await screen.findByText("El juego es solo para mayores de 15 años.")
    ).toBeInTheDocument();
  });

  it("no permite ingresar más de 20 caracteres en el nombre", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const input = screen.getByLabelText("Nombre");
    const longName = "a".repeat(25);
    await userEvent.type(input, longName);

    expect(input).toHaveValue("a".repeat(20));
  });

  it("navega a crearPartida con datos válidos", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const name = "Juan Perez";
    const birth = "2000-01-01";
    const avatarAlt = "Avatar 1";

    await userEvent.type(screen.getByLabelText("Nombre"), name);
    await userEvent.type(screen.getByLabelText("Fecha de nacimiento"), birth);
    await userEvent.click(screen.getByText("Elija"));
    await userEvent.click(screen.getByAltText(avatarAlt));
    await userEvent.click(
      screen.getByRole("button", { name: "Nueva Partida" })
    );

    expect(mockedNavigate).toHaveBeenCalledWith(destinations.crearPartida, {
      state: {
        playerName: name,
        playerDate: birth,
        playerAvatar: "/src/assets/bart.png",
      },
    });
  });
});
