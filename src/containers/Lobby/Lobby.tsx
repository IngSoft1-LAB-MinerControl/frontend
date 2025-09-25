import "./Lobby.css";

function Lobby() {
  return (
    <div className="lobby-page">
      {/* Título fuera del rectángulo, centrado arriba */}
      <h1 className="lobby-title">SALA DE ESPERA</h1>

      {/* Rectángulo grande */}
      <section className="lobby-card" aria-label="Sala de espera">
        {/* 6 rectángulos negros iguales */}
        <div className="lobby-slots" aria-label="Jugadores">
          <div className="lobby-slot" aria-label="Lugar 1" />
          <div className="lobby-slot" aria-label="Lugar 2" />
          <div className="lobby-slot" aria-label="Lugar 3" />
          <div className="lobby-slot" aria-label="Lugar 4" />
          <div className="lobby-slot" aria-label="Lugar 5" />
          <div className="lobby-slot" aria-label="Lugar 6" />
        </div>

        {/* Botón centrado abajo */}
        <div className="lobby-actions">
          <button
            type="button"
            className="lobby-button"
            onClick={() => console.log("INICIAR")}
          >
            INICIAR
          </button>
        </div>
      </section>
    </div>
  );
}

export default Lobby;
