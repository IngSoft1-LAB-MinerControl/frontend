import "./Secret.css";
import cardBack from "/src/assets/card_back.png";
import secret from "/src/assets/secret.png";

type CardSize = "mini" | "medium" | "large";

export type CardBaseProps = {
  shown: boolean;
  size?: CardSize;
  image?: string;
};

export default function Secret({
  shown,
  size = "medium",
  image,
}: CardBaseProps) {
  // Si no hay imagen, usamos el back por defecto
  const imgSrc = shown ? image ?? secret : cardBack;

  return (
    <div className={`card secret-${size}`}>
      <img src={imgSrc} alt="secret" />
    </div>
  );
}
