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
  const [nameError, setNameError] = useState(false);
  const [dateError, setDateError] = useState(false);

  const navigate = useNavigate();

  const validate = () => {
    let valid = true;

    setError("");
    setNameError(false);
    setDateError(false);

    if (!playerName.trim() && !playerDate) {
      setError("Debe ingresar un nombre y fecha de nacimiento");
      setNameError(true);
      setDateError(true);
      valid = false;
    } else if (!playerName.trim()) {
      setError("Debe ingresar un nombre");
      setNameError(true);
      valid = false;
    } else if (!playerDate) {
      setError("Debe ingresar su fecha de nacimiento");
      setDateError(true);
      valid = false;
    } else {
      // validación de edad
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
        setDateError(true);
        valid = false;
      }
    }

    return valid;
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
            onChange={(e) => {
              setPlayerName(e.target.value);
              if (e.target.value.trim()) setNameError(false);
            }}
            error={nameError}
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
            onChange={(e) => {
              setPlayerDate(e.target.value);
              if (e.target.value.trim()) setDateError(false);
            }}
            error={dateError}
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
