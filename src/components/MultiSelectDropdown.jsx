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
import { useState } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Error from "images/icons/error.png";

export default function MultiSelectDropdown({
  label,
  data,
  selected = [],
  setSelected,
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
  emptyMessage,
  loading = false,
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const selectedArray = Array.isArray(selected) ? selected : [];
    if (selectedArray.length > 0 && setValue && trigger) {
      setValue(name, selectedArray.map((item) => item?.title).join(","));
      trigger(name);
    }
  }, [selected, setValue, trigger, name]);

  const filteredData =
    query === ""
      ? data
      : data?.filter((person) => {
          return person?.title?.toLowerCase().includes(query?.toLowerCase());
        });

  const handleSelectionChange = (values) => {
    // If no values are selected, clear the selection
    if (values.length === 0) {
      setSelected([]);
      return;
    }
    const lastSelected = values[values.length - 1];
    const isAlreadySelected = selected.some(
      (item) => item?._id === lastSelected?._id
    );

    if (isAlreadySelected) {
      setSelected(selected.filter((item) => item?._id !== lastSelected?._id));
    } else {
      setSelected([...selected, lastSelected]);
    }
  };

  const handleRemoveItem = (itemToRemove, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(selected.filter((item) => item?._id !== itemToRemove?._id));
  };

  const handleClearAll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected([]);
    setQuery("");
  };

  const getErrorMessage = () => {
    if (!name) return null;
    const nameParts = name?.split(/[[\].]+/).filter(Boolean);
    let error = errors;
    for (const part of nameParts) {
      error = error?.[part];
      if (!error) break;
    }
    return error?.message;
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="w-full relative">
      {label && (
        <label
          className={`text-sm text-linkText font-medium leading-6 mb-1 block ${
            labelClass || ""
          }`}
        >
          {typeof label === "string" ? t(label) : label}{" "}
          <span className="text-[#EC1212]">{required ? "*" : ""}</span>
        </label>
      )}

      {name && (
        <input
          value={
            Array.isArray(selected)
              ? selected.map((item) => item?.title).join(",")
              : ""
          }
          {...register(name, { required })}
          className="absolute pointer-events-none -z-10 inset-0 opacity-0"
          type="text"
        />
      )}

      <Combobox
        multiple
        value={selected}
        onChange={handleSelectionChange}
        onClose={() => setQuery("")}
        disabled={disabled}
      >
        <div className="relative">
          <div
            className={`text-start ${
              errors && errors[name] ? "border-red" : "border-[#E2E8F0]"
            } ${selected?.length == 0 ? "text-head" : "text-head"} ${clsx(
              "min-h-[46px]  disabled:!cursor-not-allowed rounded-lg border bg-white relative transition duration-300 text-sm hover:border-[#ffba32] border-[#E0E5F2] focus:border-[#ffba32] focus:outline-0 z-10 disabled:bg-[#fafafa] capitalize flex gap-3 items-center justify-between  w-full",
              "focus:outline-none"
            )}`}
          >
            <ComboboxButton
              className="absolute top-0 left-0 w-full h-full opacity-0"
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
            <div className="flex items-center gap-1.5 flex-wrap w-full">
              <div className="grow">
                {Array.isArray(selected) && selected?.length > 0 && (
                  <ul className="flex items-center gap-1.5 flex-wrap w-full pb-[16px] pl-[8px] pr-[65px] pt-[8px]">
                    {selected?.map((person, idx) => (
                      <li
                        key={idx}
                        className="relative z-20 bg-[rgba(220,224,228,0.51)] py-1.5 px-3 rounded-2xl text-xs text-black flex items-center gap-2"
                      >
                        {person?.title ? t(person.title) : ""}
                        <IoCloseOutline
                          className="size-4 fill-black cursor-pointer"
                          onClick={(e) => handleRemoveItem(person, e)}
                        />
                      </li>
                    ))}
                  </ul>
                )}

                <ComboboxInput
                  className={`w-full pr-[65px] p-[8px_16px] ${
                    Array.isArray(selected) && selected.length !== 0 ? "" : ""
                  }`}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={placeholder || t("search_placeholder")}
                  value={query}
                />
              </div>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 absolute -z-10  left-auto right-2"></div>
              ) : (
                <FaChevronDown
                  className={`${
                    iconClass || ""
                  } size-4 group-data-[hover]:fill-black absolute -z-10  left-auto right-2`}
                />
              )}
            </div>
            <div className="group flex gap-3 items-center absolute ltr:right-6 rtl:left-0 z-10">
              {Array.isArray(selected) && selected.length !== 0 && (
                <IoCloseOutline
                  className="size-6 fill-black group-data-[hover]:fill-black cursor-pointer"
                  onClick={handleClearAll}
                />
              )}
            </div>
          </div>
        </div>
        <Transition
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}
        >
          <ComboboxOptions
            anchor="bottom"
            className={`w-[var(--button-width)] ${
              listClass || ""
            } max-h-[250px] z-[51] rounded-lg border shadow-lg bg-white p-1 empty:hidden`}
            static
          >
            <div className="overflow-auto max-h-[200px]">
              {loading ? (
                <div className="px-3 py-2 text-sm flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                  {t("loading")}
                </div>
              ) : filteredData?.length === 0 ? (
                <div className="px-3 py-2 text-sm ">
                  {emptyMessage || t("no_record_found")}
                </div>
              ) : (
                filteredData?.map((person, idx) => (
                  <ComboboxOption
                    key={idx}
                    value={person}
                    className={`${
                      Array.isArray(selected) &&
                      selected?.some((item) => item?._id === person?._id)
                        ? "bg-black/10"
                        : ""
                    } group flex hover:bg-gray-100 cursor-pointer items-center gap-2 rounded-lg py-1.5 my-px px-3 select-none`}
                  >
                    <FaCheck className="invisible size-4 fill-black group-data-[selected]:visible" />
                    <div className="text-sm/6 text-black">
                      {person?.title ? t(person.title) : ""}
                    </div>
                  </ComboboxOption>
                ))
              )}
            </div>
          </ComboboxOptions>
        </Transition>
      </Combobox>
      {errorMessage && (
        <p className="text-red text-xs flex items-center gap-2 mt-1 font-medium">
          <img src={Error} alt="Error" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}
