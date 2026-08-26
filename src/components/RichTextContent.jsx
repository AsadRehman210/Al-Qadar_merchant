import DOMPurify from "dompurify";
import "react-quill-new/dist/quill.snow.css";
import "./RichTextContent.css";

/**
 * Renders HTML saved from <RichTextEditor> (Quill) as a static, read-only
 * block — e.g. a Description/Requirements field on a detail page. See
 * RichTextContent.css for why plain `.ql-editor` styling alone isn't enough
 * to show list bullets/numbers outside of a live editor instance.
 */
export default function RichTextContent({ html, className = "" }) {
  return (
    <div
      className={`ql-editor ql-readonly !p-0 ${className}`}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html || "") }}
    />
  );
}
