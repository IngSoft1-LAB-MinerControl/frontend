import "./InputField.css";

type Props = {
  id?: string;
  name?: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function InputField({
  id,
  name,
  placeholder,
  type = "text",
  value,
  onChange,
}: Props) {
  return (
    <input
      id={id}
      name={name}
      className="input-field"
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}
