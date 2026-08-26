import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiEye } from "react-icons/fi";
import { FaRegEdit } from "react-icons/fa";
import Button from "components/Button";
import {
  fetchAssetCategories,
  fetchAssets,
  showAssetCategories,
  showAssets,
  showAssetsLoading,
} from "store/slices/assetSlice";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { assetStatusBadge } from "global/constant";
import { SkeletonTable } from "components/Skeleton";
import EmptyState from "components/EmptyState";

const statusClass = (s) => {
  return assetStatusBadge[s] || assetStatusBadge["In use"];
};

const { edit_customer } = rafeeqi_role_ids;

const CategoryDetail = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const categories = useSelector(showAssetCategories);
  const linkedAssets = useSelector(showAssets);
  const assetsLoading = useSelector(showAssetsLoading);

  useEffect(() => {
    if (!categories.length) dispatch(fetchAssetCategories());
  }, [dispatch, categories.length]);

  useEffect(() => {
    if (id) dispatch(fetchAssets({ categoryId: id, limit: 200 }));
  }, [dispatch, id]);

  const row = categories.find((x) => x.id === id);

  const isRTL = i18n.language === "ar";

  if (!row) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">
          {t("no_record_found")}
        </p>
        <Button
          title={t("back")}
          onClick={() => navigate("/assets-categories")}
          className="mt-4"
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/assets-categories")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{row.name}</h1>
            <p className="text-mutedForeground text-sm">
              {row.code} •{" "}
              {row.status === "Active"
                ? t("asset:active")
                : t("asset:inactive")}
            </p>
          </div>
          {checkRoleAuth(edit_customer) && (
            <Button
              title={t("edit")}
              icon={FaRegEdit}
              type="button"
              onClick={() => navigate(`/assets-categories/edit/${row.id}`)}
              className="!w-auto !rounded-lg !h-11 !px-5 !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600"
            />
          )}
        </div>

        <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            {t("asset:category_detail")}
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-mutedForeground">{t("asset:code")}</dt>
              <dd className="font-medium text-slate-800 dark:text-white/90 mt-1">
                {row.code}
              </dd>
            </div>
            <div>
              <dt className="text-mutedForeground">{t("asset:status")}</dt>
              <dd className="font-medium mt-1">
                {row.status === "Active"
                  ? t("asset:active")
                  : t("asset:inactive")}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-mutedForeground">{t("asset:description")}</dt>
              <dd className="text-slate-700 dark:text-white/85 mt-1 whitespace-pre-wrap">
                {row.description || "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              {t("asset:assets_in_category")}
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300">
              {linkedAssets.length}
            </span>
          </div>

          {assetsLoading ? (
            <SkeletonTable rows={5} columns={5} />
          ) : !linkedAssets.length ? (
            <EmptyState title={t("asset:no_assets_in_category")} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5">
                    {[t("asset:asset_tag"), t("asset:asset_name"), t("asset:location"), t("asset:status"), ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-start text-xs font-semibold text-slate-600 dark:text-white/70">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linkedAssets.map((a) => (
                    <tr key={a.id} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-4 py-2.5 font-mono text-xs">{a.assetTag}</td>
                      <td className="px-4 py-2.5 font-medium">{a.name}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{a.location || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass(a.status)}`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-2.5 text-end">
                        <Link to={`/assets/detail/${a.id}`} className="text-slate-500 dark:text-white/80 hover:text-teal-600 dark:hover:text-teal-300" title={t("view")}>
                          <FiEye className="h-4 w-4 inline" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryDetail;
