import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import { LuUserMinus, LuBriefcase, LuCalendarDays, LuArrowRight } from "react-icons/lu";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import ReactPaginate from "react-paginate";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import DataState from "components/DataState";
import { cardRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import Button from "components/Button";
import { EXIT_STATUS_BADGE } from "global/constant";
import { exitStatusFilterOptions } from "global/constant";
import {
  fetchExits,
  fetchExitsSummary,
  showExits,
  showExitsTotal,
  showExitsLoading,
  showExitsSummary,
} from "store/slices/offboardingSlice";

const STAT_TILES = [
  { key: "total", label: "offboarding:total", from: "from-slate-500", to: "to-slate-600" },
  { key: "noticePeriod", label: "offboarding:notice_period", from: "from-amber-500", to: "to-amber-600" },
  { key: "clearance", label: "offboarding:clearance", from: "from-blue-500", to: "to-blue-600" },
  { key: "settlement", label: "offboarding:settlement", from: "from-purple-500", to: "to-purple-600" },
  { key: "completed", label: "offboarding:completed", from: "from-emerald-500", to: "to-emerald-600" },
];

const Offboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [filters, setFilters] = useListFilters("talent-offboarding", {
    search: "",
    filterStatus: null,
    page: 1,
    limitId: cardRows[0].id,
  });
  const { search, filterStatus, page } = filters;
  const selRows = cardRows.find((r) => r.id === filters.limitId) || cardRows[0];

  const list = useSelector(showExits);
  const totalRecords = useSelector(showExitsTotal);
  const loading = useSelector(showExitsLoading);
  const summary = useSelector(showExitsSummary);

  useEffect(() => {
    dispatch(fetchExits({
      page,
      limit: selRows.id,
      search: search || undefined,
      status: filterStatus || undefined,
    }));
  }, [dispatch, page, selRows.id, search, filterStatus]);

  useEffect(() => {
    dispatch(fetchExitsSummary());
  }, [dispatch]);

  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handleRowsChange = (v) => setFilters({ limitId: v.id, page: 1 });

  const statusOpts = exitStatusFilterOptions;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 dark:text-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("offboarding:title")}</h1>
            <p className="text-mutedForeground mt-1">{t("offboarding:desc")}</p>
          </div>
          <Button
            type="button"
            title={t("offboarding:initiate_exit")}
            icon={LuUserMinus}
            onClick={() => navigate("/offboarding/add")}
            className="!w-auto !rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0 !text-white !px-5"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {STAT_TILES.map((tile) => (
            <div key={tile.key} className={`p-5 rounded-2xl bg-gradient-to-br ${tile.from} ${tile.to} text-white`}>
              <p className="text-sm font-medium opacity-80">{t(tile.label)}</p>
              <p className="text-3xl font-bold mt-1">{summary[tile.key]}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <SearchInput
              onSearch={(v) => setFilters({ search: v, page: 1 })}
              initialValue={search}
              placeholder={t("offboarding:search_exits", "Search by employee")}
            />
          </div>
          <div className="w-full sm:w-48">
            <SelectDropdown
              data={statusOpts}
              selected={statusOpts.find((x) => x.id === (filterStatus || "")) || statusOpts[0]}
              setSelected={(v) => setFilters({ filterStatus: v?.id || null, page: 1 })}
              hideClear
            />
          </div>
        </div>

        <DataState loading={loading} data={list} text={t("offboarding:no_exits")}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {list.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => navigate(`/offboarding/detail/${e.id}`)}
                className="text-start bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-6 hover:border-teal-500/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold shrink-0">
                      {(e.employeeName || "—").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-white truncate">{e.employeeName || "—"}</p>
                      <p className="text-xs text-slate-500 dark:text-white/50 flex items-center gap-1.5">
                        <LuBriefcase className="h-3.5 w-3.5" /> {e.designation} · {e.department}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${EXIT_STATUS_BADGE[e.status]}`}>
                    {e.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-white/50">
                  <span>{t("offboarding:exit_type")}: <strong className="text-slate-700 dark:text-white/80">{e.exitType}</strong></span>
                  <span className="flex items-center gap-1.5">
                    <LuCalendarDays className="h-3.5 w-3.5" /> {t("offboarding:last_working_day")}: {dayjs(e.lastWorkingDay).format("DD MMM YYYY")}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-end text-teal-600 dark:text-teal-300 text-sm font-medium">
                  {t("offboarding:view_details")} <LuArrowRight className="h-4 w-4 ltr:ml-1 rtl:mr-1 rtl:rotate-180" />
                </div>
              </button>
            ))}
          </div>
        </DataState>

        {list.length > 0 && (
          <div className="flex items-center flex-wrap gap-4 pt-6">
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
  );
};

export default Offboarding;
