import { useState } from 'react';
import './Create.css';

function Create() {
  const [gameName, setGameName] = useState("");
  const [gamePassword, setGamePassword] = useState("");
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [error, setError] = useState("");

  const validate = () => {
    if (minPlayers < 2 || maxPlayers > 6) {
      return "Los jugadores deben estar entre 2 y 6.";
    }
    if (minPlayers > maxPlayers) {
      return "El número minimo de jugadores no puede ser mayor al máximo";
    }
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    console.log({
      gameName,
      gamePassword,
      minPlayers,
      maxPlayers,
    });
    alert(`Partida creada: ${gameName} (${minPlayers} - ${maxPlayers} jugadores)`);
  };

  return (
    <div className='page-container'>
      <form onSubmit={handleSubmit} className='form-container'>
        <h1 className='form-title'>Configuración de la partida</h1>

        <div className='form-field'>
          <label className='form-label'>Nombre</label>
          <input
            type='text'
            value={gameName}
            onChange={(e)=> setGameName(e.target.value)}
            required
            className='form-input'
          />
        </div>
        <div className='form-field'>
          <label className='form-label'>Contraseña</label>
          <input
            type='text'
            placeholder='Dejar vacío para crear una partida publica'
            value={gamePassword}
            onChange={(e)=> setGamePassword(e.target.value)}
            className='form-input'
          />
        </div>
        <div className='form-cont-players'>
          <div className='form-players'>
          <label className='form-label'>Mínimo de jugadores</label>
            <input
              type='number'
              min={2}
              max={6}
              value={minPlayers}
              onChange={(e)=> setMinPlayers(Number(e.target.value))}
              className='form-input'
              />
          </div>

          <div className='form-players'>
          <label className='form-label'>Máximo de jugadores</label>
            <input
              type='number'
              min={minPlayers}
              max={6}
              value={maxPlayers}
              onChange={(e)=> setMaxPlayers(Number(e.target.value))}
              className='form-input'
              />
          </div>
        </div>        

        {/* Error */}
        {error && <p className='error-message'>{error}</p>}

        {/* Boton Crear */}
        <button
          type='submit'
          className='form-button'
          disabled={!!validate()}
        >
          Crear
        </button>
      </form>
    </div>
  );
}

export default Create