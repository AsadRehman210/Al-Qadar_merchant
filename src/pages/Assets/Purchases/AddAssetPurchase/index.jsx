import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { HiOutlinePlusCircle, HiOutlineTrash } from "react-icons/hi2";
import Button from "components/Button";
import FormInput from "components/FormInput";
import FormTextarea from "components/FormTextarea";
import SelectDropdown from "components/SelectDropdown";
import SearchablePaginatedDropdown from "components/SearchablePaginatedDropdown";
import { SkeletonDetail } from "components/Skeleton";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { purchaseTaxRecoverableOptions } from "global/constant";
import {
  fetchSuppliersDropdown,
  showSupplierDropdownOptions,
  showSupplierDropdownPage,
  showSupplierDropdownHasMore,
  showSupplierDropdownLoading,
  resetSupplierDropdown,
} from "store/slices/supplierSlice";
import { fetchAssetCategories, showAssetCategories } from "store/slices/assetSlice";
import {
  createAssetPurchase,
  updateAssetPurchase,
  fetchAssetPurchaseById,
  showCurrentAssetPurchase,
  showCurrentAssetPurchaseLoading,
  clearCurrentAssetPurchase,
} from "store/slices/assetPurchaseSlice";

const { add_asset_purchase, edit_asset_purchase } = alqadar_role_ids;

const emptyLine = () => ({ name: "", categoryId: "", qty: 1, price: "", serialNumber: "", location: "" });

const AddAssetPurchase = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  const current = useSelector(showCurrentAssetPurchase);
  const loading = useSelector(showCurrentAssetPurchaseLoading);
  const categories = useSelector(showAssetCategories);
  const supplierOpts = useSelector(showSupplierDropdownOptions);
  const supplierPage = useSelector(showSupplierDropdownPage);
  const supplierHasMore = useSelector(showSupplierDropdownHasMore);
  const supplierLoading = useSelector(showSupplierDropdownLoading);

  const methods = useForm({
    mode: "onChange",
    defaultValues: {
      supplierId: "",
      date: dayjs().format("YYYY-MM-DD"),
      taxPercent: 0,
      taxRecoverable: "yes",
      notes: "",
      lines: [emptyLine()],
    },
  });
  const { handleSubmit, reset, control, register, setValue, watch, formState: { errors, isSubmitting } } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = useWatch({ control, name: "lines" }) || [];
  const taxPercent = useWatch({ control, name: "taxPercent" }) ?? 0;

  const [selSupplier, setSelSupplier] = useState(null);
  const [selTaxRecoverable, setSelTaxRecoverable] = useState(purchaseTaxRecoverableOptions[0]);
  const [supplierSearch, setSupplierSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAssetCategories({ limit: 200 }));
    dispatch(fetchSuppliersDropdown({ page: 1, search: "" }));
    if (id) dispatch(fetchAssetPurchaseById(id));
    return () => {
      dispatch(clearCurrentAssetPurchase());
      dispatch(resetSupplierDropdown());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (id && current) {
      reset({
        supplierId: current.supplierId || "",
        date: current.date ? String(current.date).slice(0, 10) : dayjs().format("YYYY-MM-DD"),
        taxPercent: current.taxPercent ?? 0,
        taxRecoverable: current.taxRecoverable === false ? "no" : "yes",
        notes: current.notes || "",
        lines: current.lines?.length
          ? current.lines.map((l) => ({
              name: l.name || "",
              categoryId: l.categoryId || "",
              qty: l.qty || 1,
              price: l.price ?? "",
              serialNumber: l.serialNumber || "",
              location: l.location || "",
            }))
          : [emptyLine()],
      });
    }
  }, [id, current, reset]);

  const supplierId = watch("supplierId");
  useEffect(() => {
    if (!supplierId) return;
    const o = supplierOpts.find((x) => x.id === supplierId);
    if (o) setSelSupplier({ ...o, title: o.name });
  }, [supplierId, supplierOpts]);

  const taxRecoverableValue = watch("taxRecoverable");
  useEffect(() => {
    setSelTaxRecoverable(taxRecoverableValue === "no" ? purchaseTaxRecoverableOptions[1] : purchaseTaxRecoverableOptions[0]);
  }, [taxRecoverableValue]);

  const categoryOpts = useMemo(
    () => categories.filter((c) => c.status === "Active").map((c) => ({ id: c.id, title: `${c.code} — ${c.name}` })),
    [categories],
  );

  const { subtotal, taxAmount, total } = useMemo(() => {
    let sub = 0;
    let tax = 0;
    for (const l of lines) {
      const lineSub = (Number(l.qty) || 0) * (Number(l.price) || 0);
      sub += lineSub;
      tax += lineSub * ((Number(taxPercent) || 0) / 100);
    }
    return { subtotal: sub, taxAmount: tax, total: sub + tax };
  }, [lines, taxPercent]);

  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  useEffect(() => {
    if (id && !checkRoleAuth(edit_asset_purchase)) {
      toast.error(t("asset:not_authorized"));
      navigate("/assets/purchases");
    } else if (!id && !checkRoleAuth(add_asset_purchase)) {
      toast.error(t("asset:not_authorized"));
      navigate("/assets/purchases");
    }
  }, [id, navigate, t]);

  const onSubmit = async (data) => {
    if (!data.supplierId) {
      toast.error(t("asset:supplier_required"));
      return;
    }
    if (!data.lines?.length || data.lines.some((l) => !l.name || !l.categoryId || !Number(l.qty))) {
      toast.error(t("asset:purchase_lines_required"));
      return;
    }
    const payload = {
      supplierId: data.supplierId,
      date: data.date,
      taxPercent: Number(data.taxPercent) || 0,
      taxRecoverable: data.taxRecoverable !== "no",
      notes: data.notes,
      lines: data.lines.map((l) => ({
        name: l.name,
        categoryId: l.categoryId,
        qty: Number(l.qty) || 1,
        price: Number(l.price) || 0,
        serialNumber: l.serialNumber || undefined,
        location: l.location || undefined,
      })),
    };
    try {
      if (id) {
        await dispatch(updateAssetPurchase({ id, data: payload })).unwrap();
        toast.success(t("asset:purchase_updated"));
        navigate(`/assets/purchases/detail/${id}`);
      } else {
        const created = await dispatch(createAssetPurchase(payload)).unwrap();
        toast.success(t("asset:purchase_saved"));
        navigate(`/assets/purchases/detail/${created.id}`);
      }
    } catch (err) {
      toast.error(err?.message || err || "");
    }
  };

  if (id && !checkRoleAuth(edit_asset_purchase)) return null;
  if (!id && !checkRoleAuth(add_asset_purchase)) return null;
  if (id && loading && current?.id !== id) {
    return <div className="space-y-6"><SkeletonDetail fields={8} /></div>;
  }

  const locked = Boolean(id) && current?.status === "Posted";
  const supplierData = supplierOpts.map((o) => ({ ...o, title: o.name }));

  return (
    <div className="relative min-h-[60vh]">
      <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
        <Button type="button" onClick={() => navigate("/assets/purchases")} icon={isRTL ? FiArrowRight : FiArrowLeft}
          className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
        <div>
          <h1 className="text-3xl font-bold">{id ? t("asset:edit_purchase") : t("asset:add_purchase")}</h1>
          <p className="text-mutedForeground">{t("asset:purchases_desc")}</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SearchablePaginatedDropdown
              label={t("asset:supplier")}
              data={supplierData}
              selected={selSupplier}
              setSelected={(o) => {
                setSelSupplier(o || null);
                setValue("supplierId", o?.id || "");
              }}
              enableApiSearch
              onApiSearch={(v) => {
                setSupplierSearch(v);
                dispatch(fetchSuppliersDropdown({ page: 1, search: v }));
              }}
              hasMore={supplierHasMore}
              onLoadMore={() => {
                if (supplierHasMore && !supplierLoading) dispatch(fetchSuppliersDropdown({ page: supplierPage + 1, search: supplierSearch }));
              }}
              paginationLoading={supplierLoading && supplierPage > 1}
              loading={supplierLoading && supplierPage === 1}
              required
              disabled={locked}
            />
            <FormInput label={t("asset:date")} name="date" type="date" register={register} errors={errors} disabled={locked} />
            <SelectDropdown
              label={t("purchase:tax_recoverable_label")}
              data={purchaseTaxRecoverableOptions}
              selected={selTaxRecoverable}
              setSelected={(o) => {
                setSelTaxRecoverable(o || purchaseTaxRecoverableOptions[0]);
                setValue("taxRecoverable", o?.id || "yes");
              }}
              hideClear
              disabled={locked}
            />
            <FormInput label={t("purchase:tax_percent")} name="taxPercent" type="number" min={0} max={100} decimal decimalPlaces={2} register={register} errors={errors} disabled={locked} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">{t("asset:purchase_lines")}</h3>
              {!locked && (
                <Button type="button" title={t("asset:add_line")} icon={HiOutlinePlusCircle} onClick={() => append(emptyLine())}
                  className="!rounded-md !h-10 !px-4 !bg-teal-500 hover:!bg-teal-600 !text-white !border-0" />
              )}
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/20">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-white/10 text-left">
                    <th className="p-2">{t("asset:asset_name")}</th>
                    <th className="p-2">{t("asset:category")}</th>
                    <th className="p-2 w-20">{t("asset:qty")}</th>
                    <th className="p-2 w-28">{t("asset:unit_price")}</th>
                    <th className="p-2">{t("asset:serial_number")}</th>
                    <th className="p-2">{t("asset:location")}</th>
                    <th className="p-2 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id} className="border-t border-slate-100 dark:border-white/10 align-top">
                      <td className="p-2">
                        <FormInput name={`lines.${index}.name`} register={register} errors={errors} disabled={locked} inputClass="!h-9" />
                      </td>
                      <td className="p-2 min-w-[180px]">
                        <SelectDropdown
                          data={categoryOpts}
                          selected={categoryOpts.find((c) => c.id === lines[index]?.categoryId) || null}
                          setSelected={(o) => setValue(`lines.${index}.categoryId`, o?.id || "")}
                          disabled={locked}
                        />
                      </td>
                      <td className="p-2">
                        <FormInput name={`lines.${index}.qty`} type="number" min={1} register={register} errors={errors} disabled={locked} inputClass="!h-9" />
                      </td>
                      <td className="p-2">
                        <FormInput name={`lines.${index}.price`} type="number" min={0} decimal decimalPlaces={3} register={register} errors={errors} disabled={locked} inputClass="!h-9" />
                      </td>
                      <td className="p-2">
                        <FormInput name={`lines.${index}.serialNumber`} register={register} errors={errors} disabled={locked} inputClass="!h-9" />
                      </td>
                      <td className="p-2">
                        <FormInput name={`lines.${index}.location`} register={register} errors={errors} disabled={locked} inputClass="!h-9" />
                      </td>
                      <td className="p-2">
                        {fields.length > 1 && !locked && (
                          <button type="button" onClick={() => remove(index)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                            <HiOutlineTrash className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end text-sm">
              <div className="w-72 space-y-1">
                <div className="flex justify-between"><span>{t("purchase:subtotal")}</span><span>{fmt(subtotal)} SAR</span></div>
                <div className="flex justify-between"><span>{t("purchase:tax_amount")}</span><span>{fmt(taxAmount)} SAR</span></div>
                <div className="flex justify-between font-bold text-teal-600"><span>{t("purchase:total")}</span><span>{fmt(total)} SAR</span></div>
              </div>
            </div>
          </div>

          <FormTextarea label={t("asset:notes")} name="notes" register={register} errors={errors} rows={3} maxLength={500} disabled={locked} />

          <div className="flex justify-end gap-3">
            <Button type="button" title={t("cancel")} onClick={() => navigate("/assets/purchases")} className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
            {!locked && (
              <Button type="submit" title={id ? t("update") : t("save")} btn="primary" loading={isSubmitting} className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0" />
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default AddAssetPurchase;
