import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import Button from "components/Button";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import PersonalDetails from "./PersonalDetails";
import OfficialDetails from "./OfficialDetails";
import Qualification from "./Qualification";
import Documents from "./Documents";
import Salary from "./Salary";
import { useParams, useNavigate } from "react-router";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { checkRoleAuth } from "global/helper";
import {
  fetchEmployeeById,
  showCurrentEmployee,
  setCurrentEmployee,
} from "store/slices/employeeSlice";

const { add_employee, edit_employee } = rafeeqi_role_ids;

const dateOrEmpty = (d) => (d ? moment(d).format("DD-MM-YYYY") : "");

const TAB_CLASS =
  "min-w-[120px] whitespace-nowrap cursor-pointer py-2 px-4 rounded-lg h-11 flex justify-center items-center font-semibold text-sm text-slate-500 dark:text-white/80 transition-all outline-none data-[selected]:bg-[var(--color-teal-500)] data-[selected]:text-white data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed hover:not([data-disabled]):text-teal-700 hover:not([data-disabled]):bg-teal-500/10 dark:hover:not([data-disabled]):bg-teal-500/20";

const AddEmployees = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [validValues, setValidValues] = useState(0);
  const navigate = useNavigate();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  const existing = useSelector(showCurrentEmployee);

  const methods = useForm({
    mode: "onChange",
    defaultValues: {},
  });

  useEffect(() => {
    if (id) dispatch(fetchEmployeeById(id));
    return () => dispatch(setCurrentEmployee(null));
  }, [id, dispatch]);

  // Populate the form once the real record has loaded — every field name
  // here already matches the backend's own field names 1:1 (first_name,
  // last_name, departmentId, etc.), so this is a straight reset rather than
  // a remapping. Dates come back as ISO and need the DD-MM-YYYY the
  // Datepicker components expect.
  useEffect(() => {
    if (existing && existing.id === id) {
      methods.reset({
        ...existing,
        employeeCode: existing.employeeCode || "",
        dob: dateOrEmpty(existing.dob),
        national_id_expiry: dateOrEmpty(existing.national_id_expiry),
        work_permit_expiry: dateOrEmpty(existing.work_permit_expiry),
        joining_date: dateOrEmpty(existing.joining_date),
        probation_end: dateOrEmpty(existing.probation_end),
        resignation_date: dateOrEmpty(existing.resignation_date),
        retirement_date: dateOrEmpty(existing.retirement_date),
        termination_date: dateOrEmpty(existing.termination_date),
        last_seen_date: dateOrEmpty(existing.last_seen_date),
        education: existing.education?.length
          ? existing.education.map((e) => ({ ...e, end_date: dateOrEmpty(e.end_date) }))
          : undefined,
        certificates: existing.certificates?.length
          ? existing.certificates.map((c) => ({
              ...c,
              issue_date: dateOrEmpty(c.issue_date),
              expiry_date: dateOrEmpty(c.expiry_date),
            }))
          : undefined,
      });
      setValidValues(4);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, id]);

  const handleTabChange = (index) => {
    setSelectedIndex(index);
    if (index > validValues) setValidValues(index);
  };

  if (id && !checkRoleAuth(edit_employee)) return null;
  if (!id && !checkRoleAuth(add_employee)) return null;

  const panelClass =
    "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 pl-9 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60 dark:[&_label]:!text-white/90 dark:[&_.font-medium]:!text-white/90 dark:[&_input]:!bg-white/10 dark:[&_input]:!border-white/20 dark:[&_input]:!text-white dark:[&_select]:!bg-white/10 dark:[&_select]:!border-white/20 dark:[&_select]:!text-white dark:[&_textarea]:!bg-white/10 dark:[&_textarea]:!border-white/20 dark:[&_textarea]:!text-white";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/employees")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 hover:-translate-x-0.5 rtl:hover:translate-x-0.5 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {id
                ? t("employees:update_employee")
                : t("employees:add_employee")}
            </h1>
            <p className="text-mutedForeground">
              {id
                ? t("employees:update_employee_desc")
                : t("employees:add_employee_desc")}
            </p>
          </div>
        </div>

        <FormProvider {...methods}>
          <TabGroup key={id && existing?.id !== id ? "loading" : id || "new"} selectedIndex={selectedIndex} onChange={handleTabChange}>
            <div className="overflow-x-auto">
              <TabList className="inline-flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-white/10 rounded-lg border border-slate-200 dark:border-white/20 mb-7">
                <Tab className={TAB_CLASS}>{t("employees:personal_details")}</Tab>
                <Tab disabled={validValues < 1} className={TAB_CLASS}>
                  {t("employees:official_details")}
                </Tab>
                <Tab disabled={validValues < 2} className={TAB_CLASS}>
                  {t("employees:qualification")}
                </Tab>
                <Tab disabled={validValues < 3} className={TAB_CLASS}>
                  {t("employees:documents")}
                </Tab>
                <Tab disabled={validValues < 4} className={TAB_CLASS}>
                  {t("employees:salary")}
                </Tab>
              </TabList>
            </div>

            <TabPanels className="mt-0">
              <TabPanel
                static
                className={selectedIndex === 0 ? "block" : "hidden"}
              >
                <div className={panelClass}>
                  <PersonalDetails
                    setSelectedIndex={setSelectedIndex}
                    setValidValues={setValidValues}
                    existing={id ? existing : null}
                  />
                </div>
              </TabPanel>
              <TabPanel
                static
                className={selectedIndex === 1 ? "block" : "hidden"}
              >
                <div className={panelClass}>
                  <OfficialDetails
                    setSelectedIndex={setSelectedIndex}
                    setValidValues={setValidValues}
                    existing={id ? existing : null}
                  />
                </div>
              </TabPanel>
              <TabPanel
                static
                className={selectedIndex === 2 ? "block" : "hidden"}
              >
                <div className={panelClass}>
                  <Qualification
                    setSelectedIndex={setSelectedIndex}
                    setValidValues={setValidValues}
                  />
                </div>
              </TabPanel>
              <TabPanel
                static
                className={selectedIndex === 3 ? "block" : "hidden"}
              >
                <div className={panelClass}>
                  <Documents
                    setSelectedIndex={setSelectedIndex}
                    setValidValues={setValidValues}
                  />
                </div>
              </TabPanel>
              <TabPanel
                static
                className={selectedIndex === 4 ? "block" : "hidden"}
              >
                <div className={panelClass}>
                  <Salary setSelectedIndex={setSelectedIndex} id={id} />
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </FormProvider>
      </div>
    </div>
  );
};

export default AddEmployees;
