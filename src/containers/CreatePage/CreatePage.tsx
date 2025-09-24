import "./CreatePage.css"
import InputField from "../../components/InputField"
import Button from "../../components/Button"
import { useState } from "react";

export default function CreatePage() {
  const [gameName, setGameName] = useState("");
  // const [gamePassword, setGamePassword] = useState("");
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [error, setError] = useState("");

  const validate = () => {
    if (minPlayers < 2 || maxPlayers > 6) {
      setError("La cantidad de jugadores debe estar entre 2 y 6.");
      return false;
    }
    if (minPlayers > maxPlayers) {
      setError("El número minimo de jugadores no puede ser mayor al máximo");
      return false;
    }
    setError("");
    return true;
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setError("");
      console.log({
        gameName,
        // gamePassword,
        minPlayers,
        maxPlayers,
      });
      alert(`Partida creada: ${gameName} (${minPlayers} - ${maxPlayers} jugadores)`);
    }
  };

    return (
      <div className="home-page">
        <form className="form-container">
          <h1 className="form-title">Información de partida</h1>
  
          <div className="form-field">
            <label className="form-label">Nombre de la Partida</label>
            <InputField
              placeholder="Ingrese un nombre para la partida."
              value={gameName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setGameName(e.target.value)
              }
            />
          </div>
          <div className="double-container">
            <div className="double-field">
              <label className="form-label">Minimo de jugadores</label>
              <InputField
                type="number"
                value={minPlayers.toString()}
                placeholder=""
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMinPlayers(Number(e.target.value))
                }
              />
            </div>
            <div className="double-field">
              <label className="form-label">Maximo de jugadores</label>
              <InputField
                type="number"
                value={maxPlayers.toString()}
                placeholder=""
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMaxPlayers(Number(e.target.value))
                }
              />
            </div>
          </div>

          <p className={`error-message ${error ? "active" : ""}`}>{error}</p>

          <Button type="button" label="Crear Partida" onClick={handleSubmit} />
        </form>
      </div>
    );
}