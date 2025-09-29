import "./HomePage.css";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import destinations from "../../navigation/destinations";

export default function HomePage() {
  const [playerName, setPlayerName] = useState("");
  const [playerDate, setPlayerDate] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const validate = () => {
    if (!playerName.trim()) {
      setError("Debe ingresar un nombre");
      return false;
    }
    if (!playerDate) {
      setError("Debe ingresar su fecha de nacimiento");
      return false;
    }
    const birthDate = new Date(playerDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    if (age < 15) {
      setError("El juego es solo para mayores de 15 años.");
      return false;
    }
    setError("");
    return true;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      navigate(destinations.crearPartida, {
        state: { playerName, playerDate },
      });
    }
  };

  const handleList = () => {
    if (validate()) {
      navigate(destinations.listarPartidas, {
        state: { playerName, playerDate },
      });
      //Redirigimos para mostrar las partidas disponibles
    }
  };

  return (
    <div className="home-page">
      <form className="form-container">
        <h1 className="form-title">¡Bienvenido!</h1>

        <div className="form-field">
          <label htmlFor="nombre" className="form-label">
            Nombre
          </label>
          <InputField
            id="nombre"
            placeholder="Ingrese su nombre"
            value={playerName}
            maxLength={20}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPlayerName(e.target.value)
            }
          />
        </div>
        <div className="form-field">
          <label htmlFor="fecha-nacimiento" className="form-label">
            Fecha de nacimiento
          </label>
          <InputField
            id="fecha-nacimiento"
            type="date"
            placeholder="Ingrese su fecha de nacimiento"
            value={playerDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPlayerDate(e.target.value)
            }
          />
        </div>

        <p className={`error-message ${error ? "active" : ""}`}>{error}</p>

        <div className="form-buttons">
          <Button type="button" label="Nueva Partida" onClick={handleCreate} />
          <Button type="button" label="Listar Partidas" onClick={handleList} />
        </div>
      </form>
    </div>
  );
}
