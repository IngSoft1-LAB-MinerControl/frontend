import "./WelcomePage.css";
import WelcomeForm from "./WelcomeForm";

export default function WelcomePage() {
  return (
    <div className="welcome-page">
      <div className="overlay"></div>
      <WelcomeForm />
    </div>
  );
}
