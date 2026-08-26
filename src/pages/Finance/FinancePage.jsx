/** Shared layout for finance modules */
const FinancePage = ({ title, description, action, children }) => (
  <div className="relative min-h-[60vh] overflow-hidden">
    <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
    <div className="relative z-[1]">
      <div className="mb-7 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
        <div className="flex flex-col space-y-2 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-mutedForeground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 animate-[partners-cardIn_0.5s_ease-out_0.08s_both]">
        {children}
      </div>
    </div>
  </div>
);

export default FinancePage;
