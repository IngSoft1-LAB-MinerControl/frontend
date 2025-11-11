/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "./HomePage";
import { useNavigate } from "react-router-dom";
import destinations from "../../navigation/destinations";

// Mocks de Assets (avatares)
vi.mock("../../assets/bart.png", () => ({ default: "/mock/bart.png" }));
vi.mock("../../assets/nelson.png", () => ({ default: "/mock/nelson.png" }));
vi.mock("../../assets/lisa.png", () => ({ default: "/mock/lisa.png" }));
vi.mock("../../assets/homero.png", () => ({ default: "/mock/homero.png" }));
vi.mock("../../assets/milhouse.jpeg", () => ({
  default: "/mock/milhouse.jpeg",
}));
vi.mock("../../assets/burns.png", () => ({ default: "/mock/burns.png" }));

// Mock de React Router
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

// Mocks de Componentes Hijos
vi.mock("../../components/InputField", () => ({
  default: ({ value, onChange, id, error, ...rest }: any) => (
    <input
      id={id}
      data-testid={id}
      value={value}
      onChange={onChange}
      data-error={error}
      {...rest}
    />
  ),
}));
vi.mock("../../components/Button", () => ({
  default: ({ label, onClick, type }: any) => (
    <button type={type} onClick={onClick}>
      {label}
    </button>
  ),
}));

const mockNavigate = vi.fn();

describe("HomePage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);
  });

  // --- Helpers para llenar el formulario ---
  const fillForm = async (
    name: string | null = "Jugador 1",
    date: string | null = "2000-01-01",
    avatarAlt: string | null = "Avatar 1" // Usamos el Alt Text (Avatar 1-6)
  ) => {
    const nameInput = screen.getByTestId("nombre");
    const dateInput = screen.getByTestId("fecha-nacimiento");

    if (name) await userEvent.type(nameInput, name);
    if (date) await userEvent.type(dateInput, date);

    if (avatarAlt) {
      const avatarButton = screen.getByRole("button", { name: /Elija/i });
      await userEvent.click(avatarButton);
      const avatarOption = screen.getByRole("button", { name: avatarAlt });
      await userEvent.click(avatarOption);
    }
  };

  it("should render all form fields", () => {
    render(<HomePage />);
    expect(screen.getByTestId("nombre")).toBeInTheDocument();
    expect(screen.getByTestId("fecha-nacimiento")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Elija/i })).toBeInTheDocument();
  });

  it("should open and select from avatar menu", async () => {
    render(<HomePage />);
    const avatarButton = screen.getByRole("button", { name: /Elija/i });

    // 1. Placeholder está visible
    expect(screen.getByText("Elija")).toBeInTheDocument();

    // 2. Abrir menú
    await userEvent.click(avatarButton);
    const avatarMenu = screen.getByRole("menu");
    expect(avatarMenu).toBeInTheDocument();

    // 3. Seleccionar opción
    const option = screen.getByRole("button", { name: "Avatar 2" });
    await userEvent.click(option);

    // 4. Menú se cierra y el avatar se actualiza
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    const img = screen.getByRole("img", { name: "Avatar seleccionado" });
    expect(img).toHaveAttribute("src", "/mock/nelson.png");
  });

  describe("Validation", () => {
    it("should show error if form is completely empty", async () => {
      render(<HomePage />);
      await userEvent.click(
        screen.getByRole("button", { name: "Nueva Partida" })
      );
      expect(
        screen.getByText(
          "Debe ingresar un nombre, fecha de nacimiento y avatar"
        )
      ).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should show error if no name", async () => {
      render(<HomePage />);
      await fillForm(null, "2000-01-01", "Avatar 1"); // Sin nombre
      await userEvent.click(
        screen.getByRole("button", { name: "Nueva Partida" })
      );
      expect(screen.getByText("Debe ingresar un nombre")).toBeInTheDocument();
    });

    it("should show error if no date", async () => {
      render(<HomePage />);
      await fillForm("Jugador 1", null, "Avatar 1"); // Sin fecha
      await userEvent.click(
        screen.getByRole("button", { name: "Nueva Partida" })
      );
      expect(
        screen.getByText("Debe ingresar su fecha de nacimiento")
      ).toBeInTheDocument();
    });

    it("should show error if no avatar", async () => {
      render(<HomePage />);
      // Llenamos solo nombre y fecha
      await userEvent.type(screen.getByTestId("nombre"), "Jugador 1");
      await userEvent.type(
        screen.getByTestId("fecha-nacimiento"),
        "2000-01-01"
      );

      await userEvent.click(
        screen.getByRole("button", { name: "Nueva Partida" })
      );
      expect(screen.getByText("Debe elegir un avatar")).toBeInTheDocument();
    });

    it("should show error if player is underage (e.g., 14)", async () => {
      // Asumimos que "hoy" es 2025-11-10
      render(<HomePage />);
      await fillForm("Jugador Joven", "2010-11-11", "Avatar 1"); // Cumple 15 mañana
      await userEvent.click(
        screen.getByRole("button", { name: "Nueva Partida" })
      );
      expect(
        screen.getByText("El juego es solo para mayores de 15 años.")
      ).toBeInTheDocument();
    });

    it("should pass validation if player is 15", async () => {
      // Asumimos que "hoy" es 2025-11-10
      render(<HomePage />);
      await fillForm("Jugador Justo", "2010-11-10", "Avatar 1"); // Cumple 15 hoy
      await userEvent.click(
        screen.getByRole("button", { name: "Nueva Partida" })
      );
      expect(
        screen.queryByText("El juego es solo para mayores de 15 años.")
      ).not.toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe("Navigation", () => {
    it("should navigate to CreatePage on handleCreate", async () => {
      render(<HomePage />);
      await fillForm("Jugador Creador", "1990-05-10", "Avatar 3"); // Avatar 3 es Lisa
      await userEvent.click(
        screen.getByRole("button", { name: "Nueva Partida" })
      );

      expect(mockNavigate).toHaveBeenCalledWith(destinations.crearPartida, {
        state: {
          playerName: "Jugador Creador",
          playerDate: "1990-05-10",
          playerAvatar: "/mock/lisa.png", // El mock de src
        },
      });
    });

    it("should navigate to ListGames on handleList", async () => {
      render(<HomePage />);
      await fillForm("Jugador Buscador", "1995-02-15", "Avatar 4"); // Avatar 4 es Homero
      await userEvent.click(
        screen.getByRole("button", { name: "Listar Partidas" })
      );

      expect(mockNavigate).toHaveBeenCalledWith(destinations.listarPartidas, {
        state: {
          playerName: "Jugador Buscador",
          playerDate: "1995-02-15",
          playerAvatar: "/mock/homero.png", // El mock de src
        },
      });
    });
  });
});
