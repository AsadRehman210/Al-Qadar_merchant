import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { LuChevronDown, LuChevronUp, LuUsers } from "react-icons/lu";
import { fetchEmployees, showEmployees, showEmployeesLoading } from "store/slices/employeeSlice";
import { fetchDepartments, showDepartments, showDepartmentsLoading } from "store/slices/departmentSlice";
import { fetchDesignations, showDesignations, showDesignationsLoading } from "store/slices/designationSlice";
import { SkeletonCards } from "components/Skeleton";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { view_employee } = alqadar_role_ids;

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const OrgNode = ({ employee, childrenByManager, expanded, onToggle, navigate }) => {
  const kids = childrenByManager[employee.id] || [];
  const isOpen = expanded.has(employee.id);
  const isInactive = employee.status !== "active";

  return (
    <div className="flex flex-col items-center">
      <div
        className={`group flex items-center gap-3 rounded-2xl border p-3 pr-4 w-[240px] shrink-0 transition-all ${
          isInactive
            ? "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 opacity-70"
            : "border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 hover:border-teal-400 hover:shadow-sm"
        }`}
      >
        <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center font-semibold text-sm shrink-0">
          {initials(employee.name)}
        </div>
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/employees/details/${employee.id}`)}>
          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{employee.name}</p>
          <p className="text-xs text-slate-500 dark:text-white/60 truncate">{employee.role} · {employee.department}</p>
        </div>
        {kids.length > 0 && (
          <button
            type="button"
            onClick={() => onToggle(employee.id)}
            className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-500 hover:bg-teal-50 hover:text-teal-600 dark:text-white/60 dark:hover:bg-teal-500/10 shrink-0"
          >
            {isOpen ? <LuChevronUp className="h-4 w-4" /> : <LuChevronDown className="h-4 w-4" />}
          </button>
        )}
        {kids.length > 0 && (
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 flex items-center gap-1">
            <LuUsers className="h-3 w-3" /> {kids.length}
          </span>
        )}
      </div>

      {isOpen && kids.length > 0 && (
        <>
          {/* Connector: parent down to the horizontal branch line */}
          <div className="w-px h-6 bg-slate-300 dark:bg-white/20" />
          <div className={`flex items-start ${kids.length > 1 ? "border-t border-slate-300 dark:border-white/20" : ""}`}>
            {kids.map((child) => (
              <div key={child.id} className="flex flex-col items-center px-4">
                <div className="w-px h-6 bg-slate-300 dark:bg-white/20" />
                <OrgNode
                  employee={child}
                  childrenByManager={childrenByManager}
                  expanded={expanded}
                  onToggle={onToggle}
                  navigate={navigate}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const OrgChart = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const employees = useSelector(showEmployees);
  const departments = useSelector(showDepartments);
  const designations = useSelector(showDesignations);
  // The tree can't be drawn until all three arrive — an employee's box shows
  // their designation and department, and a missing manager would briefly
  // promote their reports to roots.
  const loading =
    useSelector(showEmployeesLoading) ||
    useSelector(showDepartmentsLoading) ||
    useSelector(showDesignationsLoading);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
    dispatch(fetchDesignations());
  }, [dispatch]);

  const departmentsById = useMemo(() => Object.fromEntries(departments.map((d) => [d.id, d])), [departments]);
  const designationsById = useMemo(() => Object.fromEntries(designations.map((d) => [d.id, d])), [designations]);

  const { roots, childrenByManager, allIds } = useMemo(() => {
    const byManager = {};
    const ids = [];
    const enriched = employees.map((e) => ({
      id: e.id,
      managerEmployeeId: e.managerEmployeeId,
      status: e.status,
      name: `${e.first_name || ""} ${e.last_name || ""}`.trim(),
      role: designationsById[e.designationId]?.name || "—",
      department: departmentsById[e.departmentId]?.name || "—",
    }));
    enriched.forEach((e) => {
      ids.push(e.id);
      const key = e.managerEmployeeId || "__root__";
      byManager[key] = byManager[key] || [];
      byManager[key].push(e);
    });
    return { roots: byManager.__root__ || [], childrenByManager: byManager, allIds: ids };
  }, [employees, departmentsById, designationsById]);

  const [expanded, setExpanded] = useState(new Set());
  useEffect(() => {
    setExpanded(new Set(allIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allIds.length]);

  const onToggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!checkRoleAuth(view_employee)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 dark:text-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("orgHr:org_chart")}</h1>
            <p className="text-mutedForeground mt-1">{t("orgHr:org_chart_desc")}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setExpanded(new Set(allIds))}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20"
            >
              {t("orgHr:expand_all")}
            </button>
            <button
              type="button"
              onClick={() => setExpanded(new Set())}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20"
            >
              {t("orgHr:collapse_all")}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7 overflow-x-auto">
          {loading ? (
            <SkeletonCards count={6} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
          ) : roots.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-white/60 py-10">{t("no_record_found")}</p>
          ) : (
            <div className="flex items-start justify-center gap-10 min-w-fit">
              {roots.map((root) => (
                <OrgNode
                  key={root.id}
                  employee={root}
                  childrenByManager={childrenByManager}
                  expanded={expanded}
                  onToggle={onToggle}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgChart;
