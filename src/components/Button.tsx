import "./Button.css";

type Props = {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export default function Button({ label, onClick }: Props) {
  return (
    <button className="custom-button" onClick={onClick}>
      {label}
    </button>
  );
}
