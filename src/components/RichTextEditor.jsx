import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "./RichTextEditor.css";

const TOOLBAR_OPTIONS = [
  [{ header: [false, 3, 4] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["clean"],
];

/**
 * Thin wrapper around react-quill-new so callers get a plain
 * {value, onChange} controlled component — wire it up with react-hook-form's
 * <Controller> since Quill isn't a native input register() can attach to.
 */
export default function RichTextEditor({
  label,
  labelClass,
  required,
  value,
  onChange,
  placeholder,
  error,
  className,
}) {
  return (
    <div className={className}>
      {label ? (
        <label className={labelClass || "text-sm font-medium text-linkText mb-1 block"}>
          {label} {required ? <span className="text-[#EC1212]">*</span> : null}
        </label>
      ) : null}
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        modules={{ toolbar: TOOLBAR_OPTIONS }}
      />
      {error ? (
        <p className="text-red text-xs mt-1 font-medium">{error.message}</p>
      ) : null}
    </div>
  );
}
