const DetailField = ({ label, value }) => {
  return (
    <div>
      <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-slate-900 dark:text-white/95">{value || "—"}</p>
    </div>
  );
};

export default DetailField;
