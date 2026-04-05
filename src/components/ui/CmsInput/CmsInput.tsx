import s from "./CmsInput.module.css";

interface CmsInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  wrapClassName?: string;
}

export default function CmsInput({
  label,
  wrapClassName,
  className,
  ...rest
}: CmsInputProps) {
  return (
    <div className={`${s.wrap} ${wrapClassName ?? ""}`}>
      {label && <label className={s.label}>{label}</label>}
      <input className={`${s.input} ${className ?? ""}`} {...rest} />
    </div>
  );
}

interface CmsTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  wrapClassName?: string;
}

export function CmsTextarea({
  label,
  wrapClassName,
  className,
  ...rest
}: CmsTextareaProps) {
  return (
    <div className={`${s.wrap} ${wrapClassName ?? ""}`}>
      {label && <label className={s.label}>{label}</label>}
      <textarea className={`${s.input} ${s.textarea} ${className ?? ""}`} {...rest} />
    </div>
  );
}
