import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Button from "components/Button";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { checkRoleAuth } from "global/helper";
import { toast } from "react-toastify";
import { DEFAULT_ADD_SUPPLIER_VALUES } from "../supplierFakeData";
import { createSupplier, updateSupplier, fetchSupplierById } from "store/slices/supplierSlice";
import SupplierForm from "./SupplierForm";

const { add_customer, edit_customer } = rafeeqi_role_ids;

const AddSupplier = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const [existing, setExisting] = useState(null);

  const methods = useForm({
    mode: "onChange",
    defaultValues: DEFAULT_ADD_SUPPLIER_VALUES,
  });
  const {
    handleSubmit,
    setValue,
    formState: { isValid, isSubmitting },
  } = methods;

  useEffect(() => {
    if (id) {
      dispatch(fetchSupplierById(id))
        .unwrap()
        .then((row) => {
          if (!row) return;
          setExisting(row);
          Object.keys(DEFAULT_ADD_SUPPLIER_VALUES).forEach((key) => {
            if (row[key] != null && row[key] !== "") {
              // Native <input type="date"> only accepts "YYYY-MM-DD" — the
              // API returns a full ISO datetime for licenseExpiryDate.
              const value = key === "licenseExpiryDate" ? String(row[key]).slice(0, 10) : row[key];
              setValue(key, value);
            }
          });
        })
        .catch(() => {});
    }
  }, [id, setValue, dispatch]);

  useEffect(() => {
    if (id && !checkRoleAuth(edit_customer)) {
      toast.error(t("suppliers:not_authorized"));
      navigate("/suppliers");
    } else if (!id && !checkRoleAuth(add_customer)) {
      toast.error(t("suppliers:not_authorized"));
      navigate("/suppliers");
    }
  }, [id, navigate, t]);

  const onSubmit = async (data) => {
    try {
      if (id) {
        const updated = await dispatch(updateSupplier({ id, data })).unwrap();
        toast.success(updated.message);
      } else {
        const created = await dispatch(createSupplier(data)).unwrap();
        toast.success(created.message);
      }
      navigate("/suppliers");
    } catch (err) {
      toast.error(err);
    }
  };

  if (id && !checkRoleAuth(edit_customer)) return null;
  if (!id && !checkRoleAuth(add_customer)) return null;

  const isRTL = i18n.language === "ar";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/suppliers")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 hover:-translate-x-0.5 rtl:hover:translate-x-0.5 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {id ? t("suppliers:edit_supplier") : t("suppliers:add_supplier")}
            </h1>
            <p className="text-mutedForeground">
              {id
                ? t("suppliers:update_supplier_desc")
                : t("suppliers:add_supplier_desc")}
            </p>
          </div>
        </div>

        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60"
          >
            <SupplierForm existing={existing} />

            <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
              <Button
                type="button"
                title={t("cancel")}
                onClick={() => navigate("/suppliers")}
                className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
              />
              <Button
                type="submit"
                title={id ? t("update") : t("save")}
                btn="primary"
                loading={isSubmitting}
                disabled={!isValid || isSubmitting}
                className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0"
              />
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default AddSupplier;
