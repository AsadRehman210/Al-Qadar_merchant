import {
  Transition,
  Popover,
  PopoverPanel,
  PopoverButton,
} from "@headlessui/react";
import { FiSliders } from "react-icons/fi";

export default function SelectDropdown({ label, children }) {
  return (
    <Popover>
      <PopoverButton className="gap-3 text-linkText text-sm font-medium flex whitespace-nowrap items-center gap-2 px-4 py-2 bg-white border rounded-lg">
        <FiSliders className="rotate-90 w-4 h-4 text-linkText font-medium" />
        {label ? label : "Advanced Filters"}
      </PopoverButton>
      <Transition>
        <PopoverPanel className="absolute z-10 w-80 p-4 mt-2 bg-white border rounded-lg shadow-lg">
          {children}
        </PopoverPanel>
      </Transition>
    </Popover>
  );
}
