import "./CardBase.css";

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
  return (
    <div className={`card card-${size}`}>
      {shown ? (
        <img src={image} alt="card" style={{ maxWidth: "90%" }} />
      ) : (
        <span style={{ color: "white" }}>?</span>
      )}
    </div>
  );
}
