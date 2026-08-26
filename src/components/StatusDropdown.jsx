import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { t } from "i18next";
import { FaCheck, FaSpinner } from "react-icons/fa6";

export default function StatusDropdown({
  data,
  className = "",
  onClick,
  selected,
  viewOnly = false,
  placeholder = "",
  loading = false,
}) {
  const handleChange = (newValue) => {
    if (newValue !== selected) {
      onClick(newValue);
    }
  };

  return (
    <Listbox value={selected} onChange={handleChange}>
      <ListboxButton
        className={`px-3 py-1 inline-flex items-center rounded-full text-xs font-semibold transition-colors capitalize ${
          selected?.pill || "border"
        }`}
      >
        {loading ? (
          <FaSpinner className="size-4 animate-spin" />
        ) : (
          <span className="text-xs whitespace-nowrap">
            {t(selected?.title || placeholder)}
          </span>
        )}
      </ListboxButton>
      {!viewOnly && (
        <Transition
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions
            anchor="bottom"
            className={`w-32 ${className} !max-h-[250px] z-[51] rounded-lg border shadow-lg bg-white p-1 [--anchor-gap:var(--spacing-1)] empty:hidden`}
          >
            {data?.map(
              (item, idx) =>
                item.id !== 0 && (
                  <ListboxOption
                    key={idx}
                    value={item}
                    className="group flex capitalize cursor-pointer items-center gap-2 rounded-lg py-1.5 data-[selected]:bg-black/10 px-3 select-none data-[focus]:bg-black/10"
                  >
                    <FaCheck
                      className={`size-4 invisible fill-black shrink-0 group-data-[selected]:visible `}
                    />
                    <div className={`text-sm/6 text-black`}>
                      {t(item.title)}
                    </div>
                  </ListboxOption>
                )
            )}
          </ListboxOptions>
        </Transition>
      )}
    </Listbox>
  );
}
