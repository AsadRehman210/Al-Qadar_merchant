import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition,
} from "@headlessui/react";
import clsx from "clsx";
import { FaCheck, FaChevronDown } from "react-icons/fa6";
import { useEffect, useState } from "react";
import Error from "images/icons/error.png";
import { IoCloseOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";

export default function SearchDropdown({
  label,
  data,
  selected,
  setSelected,
  classes,
  labelClass,
  errors,
  name,
  register,
  required,
  trigger,
  setValue,
  className,
  disabled,
  placeholder,
  hideClear,
  emptyMessage,
  loading = false,
}) {
  const [query, setQuery] = useState("");
  const { t } = useTranslation();

  const filteredData =
    !query || query === ""
      ? data
      : data?.filter((person) =>
          person.title.toLowerCase().includes(query.toLowerCase())
        );

  useEffect(() => {
    // Check if selected is empty object or has a title
    const hasSelection =
      selected && Object.keys(selected).length > 0 && selected.title;

    if (hasSelection) {
      setQuery(selected.title); // Set the input value
      if (setValue && trigger) {
        setValue(name, selected.title); // Set the form value
        trigger(name); // Trigger validation
      }
    } else {
      // Clear the input when selected is empty
      setQuery("");
      if (setValue) {
        setValue(name, "");
      }
    }
  }, [selected, setValue, trigger, name]);

  const handleSelect = (value) => {
    setSelected(value);
    setQuery(value?.title || ""); // Update input value
  };

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

  const isSelected = (item, selectedItem) => {
    if (item?._id) {
      return item?._id === selectedItem?._id;
    } else {
      return item.id === selectedItem.id;
    }
  };

  return (
    <div className="w-full relative">
      {label && (
        <label
          className={`text-sm text-linkText font-medium leading-6 mb-1 block ${
            labelClass || ""
          }`}
        >
          {label} <span className="text-[#EC1212]">{required ? "*" : ""}</span>
        </label>
      )}

      {name && (
        <input
          value={selected?.title || ""}
          {...register(name, { required })}
          className="absolute pointer-events-none -z-10 inset-0 opacity-0"
          type="text"
        />
      )}

      <Combobox value={selected} onChange={(value) => handleSelect(value)}>
        <div className="relative">
          <ComboboxInput
            className={`${classes || ""} ${
              errors && errors[name] ? "border-red" : "border-[#E2E8F0]"
            } ${clsx(
              "h-[46px] p-[8px_16px] rounded-lg border bg-white placeholder:text-gray  text-black transition duration-300 text-sm hover:border-[#ffba32] border-[#E0E5F2] focus:border-[#ffba32] focus:outline-0 w-full"
            )} disabled:!cursor-not-allowed`}
            id={name}
            disabled={disabled}
            placeholder={placeholder || t("select_here")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          {!hideClear && selected?.title && (
            <button
              type="button"
              className={`group absolute inset-y-0 inline-flex items-center ltr:right-7 rtl:left-7 px-2 ${
                disabled ? "z-0" : "z-[50]"
              }`}
              onClick={(e) => e.preventDefault()}
            >
              <IoCloseOutline
                className="size-6 text-[#64748B] group-data-[hover]:fill-black cursor-pointer"
                onClick={() => {
                  setSelected({});
                  setQuery("");
                }}
              />
            </button>
          )}

          <ComboboxButton
            className="group absolute inset-0 right-0 z-40 px-2.5 flex justify-end items-center disabled:!cursor-not-allowed"
            disabled={disabled}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            ) : (
              <FaChevronDown className="size-4 fill-black/60 group-data-[hover]:fill-black" />
            )}
          </ComboboxButton>
        </div>
        <Transition
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ComboboxOptions
            anchor="bottom"
            className={`${className} w-[var(--input-width)] !max-h-[250px] rounded-lg shadow-lg bg-white  p-1 [--anchor-gap:var(--spacing-1)] empty:hidden !z-40`}
          >
            {loading ? (
              <ComboboxOption className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 group-data-[selected]:bg-black/10 px-3 select-none data-[focus]:bg-black/10">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                <div className="text-sm/6 text-black">{t("loading")}</div>
              </ComboboxOption>
            ) : filteredData?.length > 0 ? (
              <>
                {filteredData?.map((person, idx) => (
                  <ComboboxOption
                    key={idx}
                    value={person}
                    className="group flex cursor-pointer items-center gap-2 rounded-lg py-1.5 data-[selected]:bg-black/10 px-3 select-none data-[focus]:bg-black/10"
                  >
                    <FaCheck
                      className={`${
                        isSelected && selected && isSelected(person, selected)
                          ? "visible"
                          : "invisible"
                      } size-4 fill-black`}
                    />
                    <div className="text-sm/6 text-black">{person?.title}</div>
                  </ComboboxOption>
                ))}
              </>
            ) : (
              <ComboboxOption className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 group-data-[selected]:bg-black/10 px-3 select-none data-[focus]:bg-black/10">
                <FaCheck className="invisible size-4 fill-black group-data-[selected]:visible" />
                <div className="text-sm/6 text-black">
                  {emptyMessage || t("no_option")}
                </div>
              </ComboboxOption>
            )}
          </ComboboxOptions>
        </Transition>
      </Combobox>
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
