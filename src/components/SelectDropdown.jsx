import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import clsx from "clsx";
import { FaCheck, FaChevronDown } from "react-icons/fa6";
import Error from "images/icons/error.png";
import { useEffect } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";

export default function SelectDropdown({
  label,
  data,
  selected,
  setSelected,
  classes,
  labelClass,
  placeholder,
  iconClass,
  listClass,
  errors,
  name,
  register,
  required,
  trigger,
  setValue,
  disabled,
  hideClear,
  viewOnly,
  emptyMessage,
  loading = false,
  valueKey,
}) {
  const { t } = useTranslation();
  const formValue = valueKey ? selected?.[valueKey] : selected?.title;

  useEffect(() => {
    // Deliberately keyed off the primitive `formValue`, not the `selected`
    // object — `selected` is often re-derived fresh every render by the
    // caller (e.g. an array .find() over a freshly-mapped list), which
    // gives a new object reference with identical content on every render.
    // Depending on that reference re-fires this effect (setValue -> a
    // watched field changes -> re-render -> new `selected` reference ->
    // effect fires again) forever. `formValue` is a stable primitive, so it
    // only actually changes when the selection truly changes.
    if (formValue != null && formValue !== "" && setValue && trigger && name) {
      setValue(name, formValue);
      trigger(name);
    }
  }, [formValue, setValue, trigger, name]);

  const getErrorMessage = () => {
    if (!name) return null;

    const nameParts = name?.split(/[[\].]+/).filter(Boolean);
    let error = errors;
    for (const part of nameParts) {
      error = error?.[part];
      if (!error) break; // If no error found, break out of the loop
    }
    return error?.message;
  };

  const errorMessage = getErrorMessage(); // Cache the error message to avoid multiple checks

  return (
    <div className="w-full relative">
      {label && (
        <label
          className={`text-sm font-medium text-linkText leading-6 mb-1 block ${
            labelClass || ""
          }`}
        >
          {t(label)}{" "}
          <span className="text-[#EC1212]">{required ? "*" : ""}</span>
        </label>
      )}

      {/* Bind input with react-hook-form for validation */}
      {name && (
        <input
          value={formValue ?? ""} // Must match what the effect below writes via setValue (selected[valueKey] when valueKey is set, else selected.title) — otherwise this DOM value wins on re-render and the wrong one gets submitted.
          {...register(name, { required })}
          className="absolute pointer-events-none -z-10 inset-0 opacity-0"
          type="text"
        />
      )}
      <Listbox value={selected} onChange={setSelected}>
        <ListboxButton
          className={`${classes || ""}  ${
            errorMessage ? "border-red" : "!border-[#E0E5F2]"
          } ${!selected?.title ? "text-gray font-normal" : "text-black"} ${clsx(
            "h-10 capitalize disabled:!cursor-not-allowed rounded-md border bg-white transition duration-300 text-sm hover:border-[#ffba32] border-[#E0E5F2] focus:border-[#ffba32] focus:outline-0 flex gap-3 items-center justify-between p-[8px_16px] w-full",
            "focus:outline-none",
          )}`}
          disabled={disabled}
        >
          <span className="truncate" id={name}>
            {t(selected?.title) || t(placeholder) || t("select_here")}
          </span>
          {selected?.title && !hideClear && (
            <IoCloseOutline
              className="size-6 shrink-0 fill-black/60 group-data-[hover]:fill-black cursor-pointer ltr:ml-auto rtl:mr-auto"
              onClick={() => setSelected({})}
            />
          )}
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          ) : !disabled ? (
            <FaChevronDown
              className={`${
                iconClass || ""
              } size-4 group-data-[hover]:fill-black`}
            />
          ) : null}
        </ListboxButton>
        {!viewOnly && (
          <Transition
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions
              anchor="bottom"
              className={`w-[var(--button-width)] ${
                listClass || ""
              } !max-h-[250px] z-[9999] rounded-lg shadow-md border-[#e9ecef] bg-white  p-1 [--anchor-gap:var(--spacing-1)] empty:hidden`}
            >
              {loading ? (
                <div className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 group-data-[selected]:bg-black/10 px-3 select-none data-[focus]:bg-black/10">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                  <div className="text-sm/6 text-black">{t("loading")}</div>
                </div>
              ) : data && data?.length > 0 ? (
                data?.map((item, idx) => (
                  <ListboxOption
                    key={idx}
                    value={item}
                    className={`group flex cursor-pointer capitalize items-center gap-2 rounded-lg py-1.5 px-3 select-none hover:bg-gray-100 data-[selected]:bg-black/10`}
                  >
                    <FaCheck
                      className={`size-4 invisible fill-black shrink-0 group-data-[selected]:visible `}
                    />
                    <div className="text-sm/6 text-black">{t(item.title)}</div>
                  </ListboxOption>
                ))
              ) : (
                <div className="group flex cursor-pointer items-center gap-2 rounded-lg py-1.5 group-data-[selected]:bg-black/10 px-3 select-none data-[focus]:bg-black/10">
                  <div className="text-sm/6 text-black">
                    {emptyMessage || t("no_option")}
                  </div>
                </div>
              )}
            </ListboxOptions>
          </Transition>
        )}
      </Listbox>
      {/* Show error message */}
      {errorMessage && (
        <p className="text-red text-xs flex items-center gap-2 mt-1 font-medium">
          <img src={Error} alt="Error" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}
