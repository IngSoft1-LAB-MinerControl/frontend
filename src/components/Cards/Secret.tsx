import "./Secret.css";
import cardBack from "/src/assets/card_back.png";
import secretBaseImg from "/src/assets/secret.png";

type CardSize = "mini" | "medium" | "large";

export type SecretBaseProps = {
  secret_id?: number;
  size?: CardSize;
  mine: boolean;
  revealed: boolean;
};

export default function Secret({
  secret_id,
  size = "medium",
  mine,
  revealed,
}: SecretBaseProps) {
  let imgSrc: string;
  let cssClass = "";

  if (mine) {
    imgSrc = secretBaseImg;
    cssClass = revealed ? "normal-brightness" : "dim-secret";
  } else {
    if (revealed) {
      imgSrc = secretBaseImg;
      cssClass = "normal-brightness";
    } else {
      imgSrc = cardBack;
      cssClass = "";
    }
  }

  return (
    <div
      className={`card secret-${size} ${cssClass}`}
      data-secret-id={secret_id}
    >
      <img src={imgSrc} alt={`secret-${secret_id}`} />
    </div>
  );
}
