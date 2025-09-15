import "./HomePage.css";
import InputField from "../../components/InputField";
import Button from "../../components/Button";

export default function HomePage() {
  return (
    <div className="home-page">
      <form className="form-container">
        <h1 className="form-title">Bienvenido/a!</h1>

        <div className="form-input">
          <div className="input-group">
            <label className="form-label">Nombre</label>
            <InputField placeholder="Ingrese su nombre" />
          </div>

          <div className="input-group">
            <label className="form-label">Fecha de nacimiento</label>
            <InputField
              type="date"
              placeholder="Ingrese su fecha de nacimiento"
            />
          </div>
        </div>

        <div className="form-button">
          <Button label="Crear Partida" />
          <Button label="Listar Partidas" />
        </div>
      </form>
    </div>
  );
}
