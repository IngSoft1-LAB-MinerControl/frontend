import "./WelcomeForm.css";
import InputField from "../../components/InputField";
import Button from "../../components/Button";

export default function WelcomeForm() {
  return (
    <form /*onSubmit={handleSubmit}*/ className="form-container">
      <h1 className="form-title">Bienvenido/a!</h1>
      <div className="form-input">
        <label className="form-label">Nombre</label>
        <InputField placeholder="Ingrese su nombre" />
        <label className="form-label">Fecha de nacimiento</label>
        <InputField placeholder="Ingrese su fecha de nacimiento" type="date" />
      </div>
      <div className="form-button">
        <Button label="Crear Partida" />
        <Button label="Listar Partidas" />
      </div>
    </form>
  );
}
