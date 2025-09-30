import { useState } from "react";
import "./TurnActions.css";

export default function TurnActions() {
  const [step, setStep] = useState<0 | 1 | 2>(0);

  return (
    <div className="turn-actions">
      {step === 0 && (
        <button className="action-button" onClick={() => setStep(1)}>
          SALTEAR TURNO
        </button>
      )}

      {step === 1 && (
        <button className="action-button" onClick={() => setStep(2)}>
          DESCARTAR
        </button>
      )}

      {step === 2 && (
        <button
          className="action-button"
          onClick={() => {
            console.log("Acción: reponer carta");
            setStep(0); // vuelve al inicio
          }}
        >
          REPONER
        </button>
      )}
    </div>
  );
}
