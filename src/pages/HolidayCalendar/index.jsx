import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { IoAdd } from "react-icons/io5";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import Pagination from "components/Pagination";
import { LuCalendarDays, LuTrash2, LuPencil } from "react-icons/lu";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import DataState from "components/DataState";
import { SkeletonCards } from "components/Skeleton";
import { cardRows, holidayTypeOptions, holidayTypeFilterOptions } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import {
  fetchHolidays,
  fetchHolidaysSummary,
  showHolidays,
  showHolidaysTotal,
  showHolidaysLoading,
  showHolidaysSummary,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "store/slices/holidaySlice";
import { HOLIDAY_TYPE_BADGE } from "global/constant";
import { AuditLine } from "components/AuditMeta";

const { view_holiday, add_holiday, edit_holiday, delete_holiday } = alqadar_role_ids;

const HolidayCalendar = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selType, setSelType] = useState(holidayTypeOptions[0]);
  const [recurring, setRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useListFilters("hr-holiday-calendar", {
    search: "",
    filterType: null,
    page: 1,
    limitId: cardRows[0].id,
  });
  const { search, filterType, page } = filters;
  const selRows = cardRows.find((r) => r.id === filters.limitId) || cardRows[0];

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ mode: "onChange" });

  const rawHolidays = useSelector(showHolidays);
  const totalRecords = useSelector(showHolidaysTotal);
  const loading = useSelector(showHolidaysLoading);
  const summary = useSelector(showHolidaysSummary);

  const refreshList = () => dispatch(fetchHolidays({
    page,
    limit: selRows.id,
    search: search || undefined,
    type: filterType || undefined,
  }));
  const refreshSummary = () => dispatch(fetchHolidaysSummary());

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, selRows.id, search, filterType]);

  useEffect(() => {
    refreshSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const holidays = useMemo(
    () => rawHolidays.map((h) => ({ ...h, date: dayjs(h.date).format("YYYY-MM-DD") })),
    [rawHolidays],
  );
  const today = dayjs().format("YYYY-MM-DD");
  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handleRowsChange = (v) => setFilters({ limitId: v.id, page: 1 });

  const typeOpts = holidayTypeFilterOptions;

  const typeLabel = (type) =>
    holidayTypeOptions.find((o) => o.id === type)?.title || type;

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    reset({ name: "", date: "" });
    setRecurring(false);
    setSelType(holidayTypeOptions[0]);
  };

  const openAddForm = () => {
    if (showForm && !editingId) {
      closeForm();
      return;
    }
    setEditingId(null);
    reset({ name: "", date: "" });
    setRecurring(false);
    setSelType(holidayTypeOptions[0]);
    setShowForm(true);
  };

  const openEditForm = (holiday) => {
    setEditingId(holiday.id);
    reset({ name: holiday.name, date: holiday.date });
    setRecurring(holiday.recurring);
    setSelType(holidayTypeOptions.find((o) => o.id === holiday.type) || holidayTypeOptions[0]);
    setShowForm(true);
  };

  const onSubmit = async (data) => {
    if (!selType?.id) {
      toast.error(t("hrhub:holiday_type_required", "Holiday type is required"));
      return;
    }
    setSubmitting(true);
    try {
      const payload = { name: data.name, date: data.date, type: selType.id, recurring };
      if (editingId) {
        await dispatch(updateHoliday({ id: editingId, data: payload })).unwrap();
      } else {
        await dispatch(createHoliday(payload)).unwrap();
      }
      closeForm();
      refreshList();
      refreshSummary();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    await dispatch(deleteHoliday(id)).unwrap();
    refreshList();
    refreshSummary();
  };

  if (!checkRoleAuth(view_holiday)) return null;

  const canMutateForm = editingId ? checkRoleAuth(edit_holiday) : checkRoleAuth(add_holiday);

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        {/* Header */}
        <div className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:text-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("hrhub:holiday_title")}</h1>
            <p className="text-mutedForeground mt-1">{t("hrhub:holiday_desc")}</p>
          </div>
          {checkRoleAuth(add_holiday) && (
            <Button
              className="!w-auto !rounded-lg !h-10 !px-4 !border-0 !text-white !bg-gradient-to-br !from-emerald-500 !to-emerald-600 hover:!from-emerald-600 hover:!to-emerald-700"
              onClick={openAddForm}
              type="button"
              title={t("hrhub:add_holiday")}
              icon={IoAdd}
              iconClass="h-4 w-4 text-white"
            />
          )}
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="mb-6">
            <SkeletonCards count={3} columns="grid-cols-2 lg:grid-cols-3" />
          </div>
        ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 text-white">
            <p className="text-sm font-medium opacity-80">{t("hrhub:total_holidays")}</p>
            <p className="text-3xl font-bold mt-1">{summary.total}</p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-sm font-medium opacity-80">{t("hrhub:upcoming_holidays")}</p>
            <p className="text-3xl font-bold mt-1">{summary.upcoming}</p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white col-span-2 lg:col-span-1">
            <p className="text-sm font-medium opacity-80">{t("hrhub:next_holiday")}</p>
            <p className="text-lg font-bold mt-1 truncate">{summary.next ? summary.next.name : "�"}</p>
            {summary.next && <p className="text-xs opacity-80">{dayjs(summary.next.date).format("ddd, DD MMM YYYY")}</p>}
          </div>
        </div>
        )}

        {/* Add / Edit form */}
        {showForm && canMutateForm && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-6 mb-6"
          >
            <p className="text-sm font-semibold text-slate-700 dark:text-white/90 mb-4">
              {editingId ? t("hrhub:edit_holiday") : t("hrhub:add_holiday")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
              <FormInput label={t("hrhub:holiday_name")} name="name" register={register} errors={errors} required
                pattern={/[a-zA-Z0-9\s.'-]/} minLength={2} maxLength={100} />
              <FormInput label={t("hrhub:holiday_date")} name="date" type="date" register={register} errors={errors} required />
              <SelectDropdown
                label={t("hrhub:holiday_type")}
                data={holidayTypeOptions}
                selected={selType}
                setSelected={(v) => setSelType(v || selType)}
                required
                hideClear
              />
              <label className="flex items-center gap-2 h-11 text-sm text-slate-700 dark:text-white/80 cursor-pointer">
                <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="h-4 w-4 accent-teal-500" />
                {t("hrhub:recurring")}
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <Button type="button" title={t("hrhub:cancel")} onClick={closeForm} className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
              <Button type="submit" title={t("hrhub:save")} btn="primary" disabled={submitting} className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0" />
            </div>
          </form>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <SearchInput
              onSearch={(v) => setFilters({ search: v, page: 1 })}
              initialValue={search}
              placeholder={t("hrhub:search_holidays", "Search holidays")}
            />
          </div>
          <div className="w-full sm:w-44">
            <SelectDropdown
              data={typeOpts}
              selected={typeOpts.find((x) => x.id === (filterType || "")) || typeOpts[0]}
              setSelected={(v) => setFilters({ filterType: v?.id || null, page: 1 })}
              hideClear
            />
          </div>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-5 sm:p-7">
          <DataState loading={loading} data={holidays} text={t("hrhub:no_holidays")}>
            <div className="space-y-3">
              {holidays.map((h) => {
                const past = h.date < today;
                return (
                  <div
                    key={h.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${past ? "border-slate-100 dark:border-white/10 opacity-60" : "border-slate-200 dark:border-white/15 hover:border-teal-300"}`}
                  >
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 shrink-0">
                      <span className="text-lg font-bold leading-none">{dayjs(h.date).format("DD")}</span>
                      <span className="text-[10px] uppercase">{dayjs(h.date).format("MMM")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white truncate">{h.name}</p>
                      <p className="text-xs text-slate-500 dark:text-white/50 flex items-center gap-1.5">
                        <LuCalendarDays className="h-3.5 w-3.5" />
                        {dayjs(h.date).format("dddd, DD MMM YYYY")}
                        {h.recurring && <span className="ml-1">� {t("hrhub:recurring")}</span>}
                      </p>
                    </div>
                    <AuditLine record={h} className="max-w-[180px]" />
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${HOLIDAY_TYPE_BADGE[h.type]}`}>{typeLabel(h.type)}</span>
                    {past && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50">
                        {t("hrhub:past_holiday")}
                      </span>
                    )}
                    {(checkRoleAuth(edit_holiday) || checkRoleAuth(delete_holiday)) && !past && (
                      <div className="flex items-center gap-1 shrink-0">
                        {checkRoleAuth(edit_holiday) && (
                          <button
                            type="button"
                            onClick={() => openEditForm(h)}
                            className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/10"
                            aria-label={t("edit")}
                          >
                            <LuPencil className="h-4 w-4" />
                          </button>
                        )}
                        {checkRoleAuth(delete_holiday) && (
                          <button
                            type="button"
                            onClick={() => handleDelete(h.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            aria-label={t("delete")}
                          >
                            <LuTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DataState>

          {holidays.length > 0 && (
            <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-teal-500 [&_.pagination_li.selected_a]:!text-white">
              <div className="flex items-center gap-3">
                <SelectDropdown data={cardRows} selected={selRows} setSelected={handleRowsChange} hideClear classes="!h-10 !rounded-lg" />
                <span className="text-sm text-slate-600 dark:text-white/70">{t("per_page")}</span>
              </div>
              <div className="pagination ltr:ml-auto rtl:mr-auto">
                <Pagination
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

export default HolidayCalendar;
