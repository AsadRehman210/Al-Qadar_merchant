// Generic shimmer building block — every shaped skeleton below (table,
// cards, list, detail) is composed from this one pulsing block, matching
// the app's own rounded/border/dark-mode conventions instead of a separate
// design system.
const Block = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-white/10 ${className}`} />
);

// Table rows matching this app's own `<table>` list-page shape (checkbox +
// N text columns + actions). `columns` = how many text cells per row.
export const SkeletonTable = ({ rows = 6, columns = 5, showCheckbox = false }) => (
  <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
    <table className="w-full border-collapse text-sm mb-0">
      <thead>
        <tr className="bg-slate-100 dark:bg-white/10">
          {showCheckbox && <th className="w-10 px-4 py-4" />}
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-4 py-4"><Block className="h-3 w-20" /></th>
          ))}
          <th className="w-[100px] px-4 py-4" />
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r} className="border-t border-slate-100 dark:border-white/5">
            {showCheckbox && <td className="px-4 py-4"><Block className="h-4 w-4" /></td>}
            {Array.from({ length: columns }).map((_, c) => (
              <td key={c} className="px-4 py-4"><Block className={`h-3 ${c === 0 ? "w-24" : "w-32"}`} /></td>
            ))}
            <td className="px-4 py-4"><Block className="h-4 w-16" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// KPI/summary card grid — matches SummaryCard/KpiCard shape used across
// Dashboard and Reports.
export const SkeletonCards = ({ count = 4, columns = "grid-cols-2 lg:grid-cols-4" }) => (
  <div className={`grid ${columns} gap-4`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-2xl border border-slate-200 dark:border-white/10 p-4">
        <Block className="h-3 w-20 mb-3" />
        <Block className="h-6 w-16" />
      </div>
    ))}
  </div>
);

// A single panel's worth of chart placeholder (Dashboard graphs).
export const SkeletonChart = ({ height = 240 }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-6">
    <Block className="h-3 w-40 mb-5" />
    <Block className="w-full" style={{ height }} />
  </div>
);

// Detail-page field grid (dl/dt/dd shape used across every *Detail page).
export const SkeletonDetail = ({ fields = 8 }) => (
  <div className="rounded-3xl border border-slate-200 dark:border-white/10 p-7">
    <Block className="h-4 w-48 mb-6" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Block className="h-2.5 w-20 mb-2" />
          <Block className="h-3.5 w-32" />
        </div>
      ))}
    </div>
  </div>
);

// Plain vertical list rows (e.g. history/timeline entries).
export const SkeletonList = ({ rows = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10">
        <Block className="h-4 w-4 rounded-full shrink-0" />
        <Block className="h-3 flex-1 max-w-xs" />
        <Block className="h-3 w-16 shrink-0" />
      </div>
    ))}
  </div>
);

export default Block;
