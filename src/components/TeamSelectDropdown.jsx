import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import clsx from "clsx";
import { FaChevronDown } from "react-icons/fa6";
import { useEffect } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import Checkbox from "./Checkboxes";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import ImageWithFallback from "./ImageWithFallback";
import { Tooltip } from "react-tooltip";

export default function TeamSelectDropdown({
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
  showTeamType,
  emptyMessage,
  loading = false,
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (selected?.title && setValue && trigger) {
      setValue(name, selected.title); // Set the input value
      trigger(name); // Trigger validation
    }
  }, [selected, setValue, trigger, name]);

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
          className={`text-sm text-head font-medium leading-6 mb-1 block ${
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
          value={selected?.title || ""} // Ensure the value is not undefined
          {...register(name, { required })}
          className="absolute pointer-events-none -z-10 inset-0 opacity-0"
          type="text"
        />
      )}
      <Listbox value={selected} onChange={setSelected} multiple>
        <ListboxButton
          className={`${classes || ""}  ${
            errorMessage ? "border-red" : "border-[#E2E8F0]"
          } ${!selected?.title ? "text-para" : "text-head"} ${clsx(
            "h-[46px] rounded-xl disabled:bg-[#fafafa] capitalize text-sm   bg-white transition flex gap-3 items-center justify-between duration-300   hover:shadow-[0px_0px_0px_1px_#17B26A] p-[8px_16px] w-full",
            "focus:outline-none border"
          )}`}
          disabled={disabled}
        >
          <span className="truncate" id={name}>
            {selected.length == 1
              ? selected[0]?.title
              : selected.length == data.length
              ? `All ${showTeamType?.title}`
              : selected.length > 1
              ? `Multiple ${showTeamType.title}`
              : placeholder || "Select here"}
          </span>
          {selected?.title && !hideClear && (
            <IoCloseOutline
              className="size-6 shrink-0 fill-black/60 group-data-[hover]:fill-black cursor-pointer ltr:ml-auto rtl:mr-auto"
              onClick={() => setSelected({})}
            />
          )}
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          ) : (
            <FaChevronDown
              className={`${
                iconClass || ""
              } size-4 group-data-[hover]:fill-black`}
            />
          )}
        </ListboxButton>
        <Transition
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions
            anchor="bottom"
            className={`w-[var(--button-width)] ${
              listClass || ""
            } !max-h-[250px] z-[51] rounded-xl border shadow-lg bg-white  p-1 [--anchor-gap:var(--spacing-1)] empty:hidden`}
          >
            {loading ? (
              <div className="group flex cursor-default items-center gap-2 rounded-xl py-1.5 group-data-[selected]:bg-black/10 px-3 select-none data-[focus]:bg-black/10">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                <div className="text-sm/6 text-black">{t("loading")}</div>
              </div>
            ) : data && data?.length > 0 ? (
              data?.map((item, idx) => (
                <ListboxOption
                  key={idx}
                  value={item}
                  data-tooltip-id={`${item.id}-tooltip`}
                  data-tooltip-content={`${item.title}`}
                  className="group flex cursor-pointer capitalize items-center gap-2 rounded-base py-1.5 group-data-[selected]:bg-black/10 px-2 select-none data-[focus]:bg-gray-100"
                >
                  <div className="pointer-events-none">
                    <Checkbox
                      enabled={selected?.some((ent) => ent?._id == item?._id)}
                    />
                  </div>
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    path="customer"
                    className="size-5 rounded-full shrink-0 object-cover object-center"
                  />
                  <div className="text-sm text-black truncate">
                    {t(item.title)}
                  </div>

                  <Tooltip
                    id={`${item.id}-tooltip`}
                    style={{
                      backgroundColor: "gray",
                      color: "white",
                      borderRadius: "4px",
                      padding: "6px 8px",
                      fontSize: "14px",
                    }}
                  />
                </ListboxOption>
              ))
            ) : (
              <div className="group flex cursor-pointer items-center gap-2 rounded-base py-1.5 px-3 hover:bg-gray-100">
                <div className="text-sm/6 text-black">
                  {emptyMessage || t("no_option")}
                </div>
              </div>
            )}
          </ListboxOptions>
        </Transition>
      </Listbox>
      {/* Show error message */}
      {errorMessage && (
        <p className="text-red text-xs flex items-center gap-2 mt-1 font-medium">
          <HiOutlineExclamationCircle className="text-lg" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}
