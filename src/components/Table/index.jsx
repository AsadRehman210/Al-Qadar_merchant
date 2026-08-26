/**
 * The one shared wrapper every data table in this app should render inside —
 * keeps the rounded corners/border consistent everywhere (matches FormInput's
 * own rounded-md) instead of each page hand-rolling its own overflow/rounded/
 * border wrapper around a bare <table>. Callers keep writing their own
 * <table>/<thead>/<tbody> markup as children; this only owns the outer shell.
 */
const Table = ({ children, className = "" }) => (
  <div className={`overflow-x-auto rounded-md border border-slate-200 dark:border-white/20 ${className}`}>
    {children}
  </div>
);

export default Table;
