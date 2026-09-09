import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Checkboxes from "components/Checkboxes";
import { alqadar_roles, flattenRoleModules } from "global/alqadarRoles";

// Controlled permission picker for the Role builder. `value` is a flat array of
// permission strings; `onChange` receives the next array.
// Layout: section heading → module cards (with module + section select-all).
export default function PermissionMatrix({ value = [], onChange }) {
  const { t } = useTranslation();
  const trSection = (key, fallback) => t(key, { defaultValue: fallback || key });
  const trMod = (key, fallback) => t(key, { defaultValue: fallback || key });
  const trPerm = (key, fallback) => t(`perm.${key}`, { defaultValue: fallback || key });
  const selected = useMemo(() => new Set(value), [value]);

  const allIds = useMemo(
    () => flattenRoleModules().flatMap((m) => m.sub_modules.map((s) => s.id)),
    [],
  );

  const toggle = (id, on) => {
    const next = new Set(selected);
    if (on) next.add(id);
    else next.delete(id);
    onChange(Array.from(next));
  };

  const toggleIds = (ids, on) => {
    const next = new Set(selected);
    ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
    onChange(Array.from(next));
  };

  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-lg font-semibold dark:text-white">{t("permissions")}</h3>
        <Checkboxes
          label={t("select_all")}
          enabled={allSelected}
          onChange={(on) => onChange(on ? [...allIds] : [])}
          labelClass="text-sm font-medium text-slate-600 dark:text-white/70"
        />
      </div>

      <div className="space-y-8">
        {alqadar_roles.map((sec) => {
          const sectionIds = (sec.modules || []).flatMap((m) => m.sub_modules.map((s) => s.id));
          const sectionAll = sectionIds.length > 0 && sectionIds.every((id) => selected.has(id));
          return (
            <div key={sec.title_key || sec.title}>
              <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-200 dark:border-white/10">
                <h4 className="text-base font-bold tracking-tight text-slate-800 dark:text-white">
                  {trSection(sec.title_key, sec.title)}
                </h4>
                <Checkboxes
                  label={t("select_all")}
                  enabled={sectionAll}
                  onChange={(on) => toggleIds(sectionIds, on)}
                  labelClass="text-xs text-slate-500 dark:text-white/60"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {(sec.modules || []).map((mod) => {
                  const modIds = mod.sub_modules.map((s) => s.id);
                  const modAll = modIds.length > 0 && modIds.every((id) => selected.has(id));
                  return (
                    <div
                      key={mod.title_key || mod.title}
                      className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                        <h5 className="font-semibold text-sm dark:text-white">
                          {trMod(mod.title_key, mod.title)}
                        </h5>
                        <Checkboxes
                          label={t("select_all")}
                          enabled={modAll}
                          onChange={(on) => toggleIds(modIds, on)}
                          labelClass="text-xs text-slate-500 dark:text-white/60"
                        />
                      </div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {mod.sub_modules.map((s) => (
                          <Checkboxes
                            key={s.id}
                            label={trPerm(s.title_key, s.title)}
                            enabled={selected.has(s.id)}
                            onChange={(on) => toggle(s.id, on)}
                            labelClass="text-sm text-slate-600 dark:text-white/80"
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
