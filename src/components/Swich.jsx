import { Switch } from "@headlessui/react";

export default function Swich({ enabled, onChange }) {
  return (
    <Switch
      checked={enabled}
      onChange={onChange}
      className="group relative flex h-6 w-10 cursor-pointer rounded-full bg-[#CBD5E1] data-[checked]:bg-primary  p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-white"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none inline-block size-4 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out ltr:group-data-[checked]:translate-x-4 rtl:group-data-[checked]:-translate-x-5"
      />
    </Switch>
  );
}
