import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { AiOutlineEdit } from "react-icons/ai";
import Button from "components/Button";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids, flattenRoleModules } from "global/rafeeqiRoles";
import { showUserData } from "store/slices/uniqueSlice";
import {
  fetchUserById,
  clearCurrentUser,
  showCurrentErpUser,
  showCurrentErpUserLoading,
} from "store/slices/userSlice";

const { edit_user } = rafeeqi_role_ids;

const Row = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
    <span className="text-sm font-medium dark:text-white">{value || "—"}</span>
  </div>
);

const UserDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const session = useSelector(showUserData);
  const user = useSelector(showCurrentErpUser);
  const loading = useSelector(showCurrentErpUserLoading);
  const tr = (key, fallback) => (key && i18n.exists(key) ? t(key) : fallback);

  useEffect(() => {
    // Sub-user must not open their own Users-module detail (API also blocks this).
    if (!session?.is_default_user && session?.userId && id && String(id) === String(session.userId)) {
      navigate("/users", { replace: true });
      return undefined;
    }
    if (!id) return undefined;
    let active = true;
    dispatch(fetchUserById(id))
      .unwrap()
      .catch(() => {
        if (active) navigate("/users", { replace: true });
      });
    return () => {
      active = false;
      dispatch(clearCurrentUser());
    };
  }, [id, dispatch, navigate, session?.is_default_user, session?.userId]);

  const grantedByModule = useMemo(() => {
    const held = new Set(user?.permissions || []);
    return flattenRoleModules()
      .map((mod) => ({
        title: tr(mod.title_key, mod.title),
        items: mod.sub_modules.filter((s) => held.has(s.id)).map((s) => tr(s.title_key, s.title)),
      }))
      .filter((m) => m.items.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading || !user) {
    return <div className="p-10 text-center text-mutedForeground">{t("loading")}...</div>;
  }

  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.user_name || "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-white">{fullName}</h1>
          <p className="text-mutedForeground">{user.email}</p>
        </div>
        {checkRoleAuth(edit_user) && (
          <Button
            className="!w-auto !rounded-lg"
            onClick={() => navigate(`/users/edit/${user.id}`)}
            title={t("edit")}
            icon={AiOutlineEdit}
            btn="primary"
            iconClass="h-4 w-4 text-white"
          />
        )}
      </div>

      <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Row label={t("name")} value={fullName} />
        <Row label={t("email")} value={user.email} />
        <Row label={t("mobile_number")} value={user.phone} />
        <Row label={t("role")} value={user.roleName} />
        <Row label={t("status")} value={user.status === "active" ? t("active") : t("inactive")} />
      </div>

      <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">{t("permissions")}</h3>
        {grantedByModule.length === 0 ? (
          <p className="text-sm text-mutedForeground">{t("no_record_found")}</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {grantedByModule.map((m) => (
              <div key={m.title} className="rounded-2xl border border-slate-200 dark:border-white/10 p-4">
                <h4 className="font-semibold text-sm mb-2 dark:text-white">{m.title}</h4>
                <div className="flex flex-wrap gap-2">
                  {m.items.map((it) => (
                    <span
                      key={it}
                      className="px-2 py-0.5 rounded-full text-xs bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300"
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetail;
