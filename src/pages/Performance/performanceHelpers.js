export const STATUS_COLOR = {
  Finalized: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Submitted: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "Under Review": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Draft: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/40",
};

export const statusColor = (s) => STATUS_COLOR[s] || STATUS_COLOR.Draft;

export const RATING_LABEL_KEYS = {
  5: "performance:rating_exceptional",
  4: "performance:rating_exceeds",
  3: "performance:rating_meets",
  2: "performance:rating_needs_improvement",
  1: "performance:rating_unsatisfactory",
};

/** Translation key for a 1-5 rating, or null if unrated. Pass to t(). */
export const ratingLabelKey = (r) => {
  if (!r) return null;
  if (r >= 5) return RATING_LABEL_KEYS[5];
  if (r >= 4) return RATING_LABEL_KEYS[4];
  if (r >= 3) return RATING_LABEL_KEYS[3];
  if (r >= 2) return RATING_LABEL_KEYS[2];
  return RATING_LABEL_KEYS[1];
};

export const ratingColor = (r) => {
  if (!r) return "text-slate-400";
  if (r >= 4) return "text-emerald-600";
  if (r >= 3) return "text-blue-600";
  return "text-red-500";
};

/** Weighted average of achieved KPI scores (null until at least one KPI has an achieved score). */
export const weightedScore = (kpis) => {
  const filled = (kpis || []).filter((k) => k.achievedScore !== null && k.achievedScore !== undefined);
  if (!filled.length) return null;
  const totalWeight = filled.reduce((s, k) => s + k.weight, 0);
  const weightedSum = filled.reduce((s, k) => s + k.achievedScore * k.weight, 0);
  return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : null;
};
