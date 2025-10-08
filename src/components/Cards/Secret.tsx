import "./Secret.css";
import cardBack from "/src/assets/card_back.png";
import secret from "/src/assets/secret.png";

type CardSize = "mini" | "medium" | "large";

export type SecretBaseProps = {
  s_id?: number;
  shown: boolean;
  size?: CardSize;
  image?: string;
};

export default function Secret({
  s_id,
  shown,
  size = "medium",
  image,
}: SecretBaseProps) {
  // Si no hay imagen, usamos el back por defecto
  const imgSrc = shown ? image ?? secret : cardBack;

  return (
    <div className={`card secret-${size}`} data-secret-id={s_id}>
      <img src={imgSrc} alt={`secret-${s_id}`} />
    </div>
  );
}
