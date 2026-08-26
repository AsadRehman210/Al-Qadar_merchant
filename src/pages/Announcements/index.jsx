import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { IoAdd } from "react-icons/io5";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import ReactPaginate from "react-paginate";
import { LuPin, LuTrash2 } from "react-icons/lu";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import DataState from "components/DataState";
import { cardRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import { useForm } from "react-hook-form";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import {
  fetchAnnouncements,
  showAnnouncements,
  showAnnouncementsTotal,
  showAnnouncementsLoading,
  createAnnouncement,
  deleteAnnouncement,
} from "store/slices/announcementSlice";
import { ANN_CATEGORIES, ANN_CATEGORY_BADGE } from "./announcementsFakeData";

const { add_employee } = rafeeqi_role_ids;

const Announcements = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isHR = checkRoleAuth(add_employee);
  const [showForm, setShowForm] = useState(false);
  const [selCat, setSelCat] = useState(ANN_CATEGORIES[0]);
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useListFilters("hr-announcements", {
    search: "",
    filterCategory: null,
    page: 1,
    limitId: cardRows[0].id,
  });
  const { search, filterCategory, page } = filters;
  const selRows = cardRows.find((r) => r.id === filters.limitId) || cardRows[0];

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ mode: "onChange" });

  const list = useSelector(showAnnouncements);
  const totalRecords = useSelector(showAnnouncementsTotal);
  const loading = useSelector(showAnnouncementsLoading);

  const refreshList = () => dispatch(fetchAnnouncements({
    page,
    limit: selRows.id,
    search: search || undefined,
    category: filterCategory || undefined,
  }));

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, selRows.id, search, filterCategory]);

  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handleRowsChange = (v) => setFilters({ limitId: v.id, page: 1 });

  const catOpts = [
    { id: "", title: t("hrhub:all_categories", "All Categories") },
    ...ANN_CATEGORIES.map((c) => ({ id: c, title: c })),
  ];

  const catLabel = (c) =>
    ({ General: t("hrhub:cat_general"), Policy: t("hrhub:cat_policy"), Event: t("hrhub:cat_event"), Urgent: t("hrhub:cat_urgent") }[c] || c);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await dispatch(createAnnouncement({ title: data.title, body: data.body, category: selCat, pinned })).unwrap();
      reset();
      setShowForm(false);
      setPinned(false);
      setSelCat(ANN_CATEGORIES[0]);
      refreshList();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    await dispatch(deleteAnnouncement(id)).unwrap();
    refreshList();
  };

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        {/* Header */}
        <div className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:text-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("hrhub:ann_title")}</h1>
            <p className="text-mutedForeground mt-1">{t("hrhub:ann_desc")}</p>
          </div>
          {isHR && (
            <Button
              className="!w-auto !rounded-lg !h-10 !px-4 !border-0 !text-white !bg-gradient-to-br !from-purple-500 !to-purple-600 hover:!from-purple-600 hover:!to-purple-700"
              onClick={() => setShowForm((s) => !s)}
              type="button"
              title={t("hrhub:post_announcement")}
              icon={IoAdd}
              iconClass="h-4 w-4 text-white"
            />
          )}
        </div>

        {/* Post form */}
        {showForm && isHR && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-6 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput label={t("hrhub:ann_headline")} name="title" register={register} errors={errors} required
                minLength={2} maxLength={150} />
              <SelectDropdown
                label={t("hrhub:ann_category")}
                data={ANN_CATEGORIES.map((c) => ({ id: c, title: catLabel(c) }))}
                selected={{ id: selCat, title: catLabel(selCat) }}
                setSelected={(v) => setSelCat(v?.id || selCat)}
                hideClear
              />
            </div>
            <div className="mt-5">
              <label className="text-sm font-medium text-linkText leading-6 mb-1 block">
                {t("hrhub:ann_body")} <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                {...register("body", { required: true, minLength: { value: 5, message: "Minimum length is 5 characters" }, maxLength: { value: 2000, message: "Maximum length is 2000 characters" } })}
                className="w-full rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:outline-0"
              />
              {errors.body && errors.body.type !== "required" && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.body.message}</p>
              )}
            </div>
            <div className="flex items-center justify-between mt-5">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/80 cursor-pointer">
                <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4 accent-teal-500" />
                {t("hrhub:pinned")}
              </label>
              <div className="flex gap-3">
                <Button type="button" title={t("hrhub:cancel")} onClick={() => setShowForm(false)} className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
                <Button type="submit" title={t("hrhub:save")} btn="primary" disabled={submitting} className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0" />
              </div>
            </div>
          </form>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <SearchInput
              onSearch={(v) => setFilters({ search: v, page: 1 })}
              initialValue={search}
              placeholder={t("hrhub:search_announcements", "Search announcements")}
            />
          </div>
          <div className="w-full sm:w-48">
            <SelectDropdown
              data={catOpts}
              selected={catOpts.find((x) => x.id === (filterCategory || "")) || catOpts[0]}
              setSelected={(v) => setFilters({ filterCategory: v?.id || null, page: 1 })}
              hideClear
            />
          </div>
        </div>

        {/* Feed */}
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-5 sm:p-7">
          <DataState loading={loading} data={list} text={t("hrhub:no_announcements")}>
            <div className="space-y-4">
              {list.map((a) => (
                <div
                  key={a.id}
                  className={`bg-white dark:bg-white/10 border rounded-2xl p-5 sm:p-6 transition-all ${a.pinned ? "border-teal-300 dark:border-teal-500/40 border-l-4 !border-l-teal-500" : "border-slate-200 dark:border-white/20"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.pinned && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-300">
                          <LuPin className="h-3.5 w-3.5" /> {t("hrhub:pinned")}
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ANN_CATEGORY_BADGE[a.category]}`}>{catLabel(a.category)}</span>
                    </div>
                    {isHR && (
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 shrink-0"
                      >
                        <LuTrash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-2">{a.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-white/70 mt-1.5 leading-relaxed">{a.body}</p>
                  <p className="text-xs text-slate-400 dark:text-white/40 mt-3">
                    {t("hrhub:posted_by")} <span className="font-medium text-slate-500 dark:text-white/60">{t("hrhub:hr_department", "HR Department")}</span> · {a.createdAt ? dayjs(a.createdAt).format("DD MMM YYYY") : ""}
                  </p>
                </div>
              ))}
            </div>
          </DataState>

          {list.length > 0 && (
            <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-teal-500 [&_.pagination_li.selected_a]:!text-white">
              <div className="flex items-center gap-3">
                <SelectDropdown data={cardRows} selected={selRows} setSelected={handleRowsChange} hideClear classes="!h-10 !rounded-lg" />
                <span className="text-sm text-slate-600 dark:text-white/70">{t("per_page")}</span>
              </div>
              <div className="pagination ltr:ml-auto rtl:mr-auto">
                <ReactPaginate
                  breakLabel="..."
                  nextLabel={<FaAngleRight />}
                  previousLabel={<FaAngleLeft />}
                  onPageChange={(e) => setFilters({ page: e.selected + 1 })}
                  pageRangeDisplayed={3}
                  marginPagesDisplayed={1}
                  pageCount={totalPages}
                  forcePage={page - 1}
                  renderOnZeroPageCount={null}
                  containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
