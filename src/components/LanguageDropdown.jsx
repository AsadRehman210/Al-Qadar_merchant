import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import clsx from "clsx";
import { FaCheck, FaChevronDown } from "react-icons/fa6";
import { language } from "global/constant";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiGlobe } from "react-icons/ci";

export default function LanguageDropdown({ className, listClass }) {
  const [selected, setSelected] = useState(language[0]);
  const { i18n, t } = useTranslation();
  useEffect(() => {
    const lang = localStorage.getItem("lng");
    const filLang = language?.find((item) => item.id == lang);
    if (filLang) {
      setSelected(filLang);
    } else {
      setSelected(language[0]);
    }
  }, []);
  const onChange = (item) => {
    setSelected(item);
    i18n.changeLanguage(item.id);
    localStorage.setItem("lng", item.id);
    if (item.id == "ar") {
      document.body.dir = "rtl";
    } else {
      document.body.dir = "ltr";
    }
  };
  return (
    <Listbox value={selected} onChange={onChange}>
      <ListboxButton
        className={`${className || ""} ${clsx(
          "h-[46px] text-sm rounded-lg transition flex gap-2 items-center duration-300 p-[8px_16px] text-[#64748B]",
          "focus:outline-none"
        )}`}
      >
        <CiGlobe className="text-2xl" />
        <span>{t(selected?.title)}</span>
        <FaChevronDown className="size-3 text-head ltr:ml-[2px] rtl:mr-[2px]" />
      </ListboxButton>
      <Transition
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <ListboxOptions
          anchor={i18n.language === "ar" ? "bottom start" : "bottom end"}
          className={`${listClass} w-32 !max-h-[250px] z-[999] rounded-lg border shadow-lg bg-white  p-1 [--anchor-gap:var(--spacing-1)] empty:hidden`}
        >
          {language?.map((lang, idx) => (
            <ListboxOption
              key={idx}
              value={lang}
              className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 group-data-[selected]:bg-black/10 px-3 select-none data-[focus]:bg-black/10"
            >
              <FaCheck className="invisible size-4 fill-black group-data-[selected]:visible" />
              <div className="text-sm/6 text-black">{t(lang.title)}</div>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Transition>
    </Listbox>
  );
}
