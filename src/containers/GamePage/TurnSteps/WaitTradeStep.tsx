import TextType from "../../../components/TextType";

export const WaitTradeStep = () => {
  return (
    <div className="action-step-container">
      <TextType
        className="menu-indications"
        text={["Intercambio en progreso..."]}
        typingSpeed={35}
      />
    </div>
  );
};
