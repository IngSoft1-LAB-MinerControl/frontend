import "./InputField.css";

type Props = {
  id?: string;
  name?: string;
  placeholder: string;
  type?: string;
  value: string;
  maxLength?: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function InputField({
  id,
  placeholder,
  type = "text",
  value,
  maxLength,
  onChange,
}: Props) {
  return (
    <input
      id={id}
      className="input-field"
      type={type}
      placeholder={placeholder}
      value={value}
      maxLength={maxLength}
      onChange={onChange}
    />
  );
}
