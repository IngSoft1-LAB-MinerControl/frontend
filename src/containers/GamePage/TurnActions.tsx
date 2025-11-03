//import React from "react";
import { useGameContext } from "../../context/GameContext";
//import type { Steps } from "./TurnActionsTypes"; // <-- El nuevo archivo de tipos

// 1. Importa todos los nuevos componentes de paso
// (Aún no los creamos, pero este es el plan)
import { StartStep } from "./TurnSteps/StartStep";
import { PlaySetStep } from "./TurnSteps/PlaySetStep";
import { PlayEventStep } from "./TurnSteps/PlayEventStep";
import { DiscardStep } from "./TurnSteps/DiscardStep";
import { DrawStep } from "./TurnSteps/DrawStep";
import { AnotherVictimStep } from "./TurnSteps/AnotherVictimStep";
import { LookIntoAshesStep } from "./TurnSteps/LookIntoAshesStep";
import { CardsOffTableStep } from "./TurnSteps/CardsOffTableStep";
import { AndThenThereWasOneMoreStep } from "./TurnSteps/AndThenThereWasOneMoreStep";
import { DelayEscapeStep } from "./TurnSteps/DelayEscapeStep";
import { RevealSecretStep } from "./TurnSteps/RevealSecretStep";
import { HideSecretStep } from "./TurnSteps/HideSecretStep";
import { SelectPlayerRevealStep } from "./TurnSteps/SelectPlayerRevealStep";
import { WaitRevealStep } from "./TurnSteps/WaitRevealStep";
import { PointYourSuspicionsStep } from "./TurnSteps/PointYourSuspicionsStep";
import { WaitWinnerRevealStep } from "./TurnSteps/WaitWinnerRevealStep";

// Importa los estilos (los mismos de antes)
import "./TurnActions.css";
import { VoteStep } from "./TurnSteps/VoteStep";

export default function TurnActions() {
  const { state } = useGameContext();
  const { currentStep } = state;

  // El 'div' contenedor se mantiene
  return (
    <div className="turn-actions-box">
      {/* Este switch renderiza el componente de UI correcto
        basado en el 'currentStep' del GameContext.
      */}
      {(() => {
        switch (currentStep) {
          // --- Pasos Principales ---
          case "start":
            return <StartStep />;
          case "p_set":
            return <PlaySetStep />;
          case "p_event":
            return <PlayEventStep />;
          case "discard_skip":
          case "discard_op":
            return <DiscardStep />;
          case "draw":
            return <DrawStep />;

          // --- Pasos de Eventos ---
          case "another_victim":
            return <AnotherVictimStep />;
          case "look_into_the_ashes":
            return <LookIntoAshesStep />;
          case "cards_off_the_table":
            return <CardsOffTableStep />;
          case "and_then_there_was_one_more":
            return <AndThenThereWasOneMoreStep />;
          case "delay_escape_selection":
            return <DelayEscapeStep />;
          case "point_your_suspicions":
            return <PointYourSuspicionsStep />;
          case "vote":
            return <VoteStep />;
          case "wait_winner_reveal":
            return <WaitWinnerRevealStep />;

          // --- Pasos de Sets ---
          case "sel_reveal_secret":
            return <RevealSecretStep />;
          case "sel_hide_secret":
            return <HideSecretStep />;
          case "sel_player_reveal":
            return <SelectPlayerRevealStep />;
          case "wait_reveal_secret":
            return <WaitRevealStep />;

          default:
            return <div>Paso desconocido: {currentStep}</div>;
        }
      })()}
    </div>
  );
}
