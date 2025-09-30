import "./CardBase.css";
import cardBack from "/src/assets/card_back.png";
import notSoFast from "/src/assets/not_so_fast.png";

type CardSize = "mini" | "medium" | "large";

export type CardBaseProps = {
  shown: boolean;
  size?: CardSize;
  image?: string;
};

export default function CardBase({
  shown,
  size = "medium",
  image,
}: CardBaseProps) {
  // Si no hay imagen, usamos el back por defecto
  const imgSrc = shown ? image ?? notSoFast : cardBack;

  return (
    <div className={`card card-${size}`}>
      <img src={imgSrc} alt="card" />
    </div>
  );
}
