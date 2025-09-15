import "./WelcomeForm.css";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import AvatarSelector from "../../components/AvatarSelector";

export default function WelcomeForm() {
  const avatars = ["Avatar1"];
  return (
    <div className="form-container">
      <h2 className="form-title">Bienvenido/a!</h2>

      <div className="form-inputs">
        <InputField placeholder="Ingrese su nombre" />
        <InputField placeholder="Ingrese su fecha de nacimiento" type="date" />
      </div>
      <div className="form-avatar">
        <AvatarSelector avatars={avatars} />
      </div>

      <div className="form-actions">
        <Button label="Crear Partida" />
        <Button label="Listar Partidas" />
      </div>
    </div>
  );
}
