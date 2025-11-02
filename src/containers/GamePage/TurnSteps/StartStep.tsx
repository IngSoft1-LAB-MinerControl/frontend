import React from "react";
import { useGameContext } from "../../../context/GameContext";
import TextType from "../../../components/TextType";

export const StartStep = () => {
  const { dispatch, isSocialDisgrace } = useGameContext();

  if (isSocialDisgrace) {
    return (
      <div className="action-step-container">
        <TextType
          className="menu-indications"
          text={["Procesando turno..."]}
          typingSpeed={50}
        />
      </div>
    );
  }

  return (
    <div className="action-step-container">
      <TextType
        className="menu-indications"
        text={["¿Qué acción desea realizar?"]}
        typingSpeed={50}
      />
      <div className="action-buttons-group">
        <button
          className="action-button"
          onClick={() => dispatch({ type: "SET_STEP", payload: "p_set" })}
        >
          Bajar Set
        </button>
        <button
          className="action-button"
          onClick={() => dispatch({ type: "SET_STEP", payload: "p_event" })}
        >
          Jugar Evento
        </button>
        <button
          className="action-button"
          onClick={() =>
            dispatch({ type: "SET_STEP", payload: "discard_skip" })
          }
        >
          Saltear
        </button>
      </div>
    </div>
  );
};
