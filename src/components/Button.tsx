import "./Button.css";

type Props = {
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
};

export default function Button({ label, onClick, type = "button" }: Props) {
  return (
    <button className="custom-button" onClick={onClick} type={type}>
      {label}
    </button>
  );
}
