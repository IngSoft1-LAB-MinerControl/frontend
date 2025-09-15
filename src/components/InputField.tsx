import "./InputField.css";

type Props = {
  placeholder: string;
  type?: string;
};

export default function InputField({ placeholder, type = "text" }: Props) {
  return (
    <input className="input-field" type={type} placeholder={placeholder} />
  );
}
