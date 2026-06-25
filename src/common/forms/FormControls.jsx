import "./forms.css";

export function TextInput({ label, className = "", ...props }) {
  return (
    <label className={`form-control-wrap ${className}`.trim()}>
      {label && <span>{label}</span>}
      <input {...props} />
    </label>
  );
}

export function SelectInput({ label, children, className = "", ...props }) {
  return (
    <label className={`form-control-wrap ${className}`.trim()}>
      {label && <span>{label}</span>}
      <select {...props}>{children}</select>
    </label>
  );
}

export function TextArea({ label, className = "", ...props }) {
  return (
    <label className={`form-control-wrap ${className}`.trim()}>
      {label && <span>{label}</span>}
      <textarea {...props} />
    </label>
  );
}

export function SearchBar(props) {
  return <TextInput type="search" {...props} />;
}

export function DatePicker(props) {
  return <TextInput type="date" {...props} />;
}
