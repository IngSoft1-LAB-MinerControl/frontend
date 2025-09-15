import "./Button.css";

type Props = {
  label: string;
};

export default function Button({ label }: Props) {
  return <button className="custom-button">{label}</button>;
}
