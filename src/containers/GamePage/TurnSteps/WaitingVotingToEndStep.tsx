import TextType from "../../../components/TextType";

export const WaitingVotingToEndStep = () => {
  return (
    <div className="action-step-container">
      <TextType
        className="menu-indications"
        text={["Votación en progreso..."]}
        typingSpeed={35}
      />
    </div>
  );
};
