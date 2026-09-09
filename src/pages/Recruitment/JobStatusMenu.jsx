import { useDispatch } from "react-redux";
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from "@headlessui/react";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import { toast } from "react-toastify";
import { jobStatusOptions } from "global/constant";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { updateJob } from "store/slices/recruitmentSlice";

const { edit_recruitment } = alqadar_role_ids;

export const jobStatusColor = (s) => {
  if (s === "Open") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  if (s === "On Hold") return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  return "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/40";
};

/** Inline, clickable status pill — lets HR change a job's status from the list or detail header without opening Edit. */
const JobStatusMenu = ({ jobId, status, onChanged, size = "sm" }) => {
  const dispatch = useDispatch();
  const canEdit = checkRoleAuth(edit_recruitment);
  const pillCls = `${size === "sm" ? "text-xs px-2.5 py-1" : "text-sm px-3 py-1.5"} ${jobStatusColor(status)}`;

  const handleSelect = async (e, newStatus) => {
    e.stopPropagation();
    if (newStatus === status) return;
    try {
      await dispatch(updateJob({ id: jobId, data: { status: newStatus } })).unwrap();
      await onChanged?.(newStatus);
    } catch (err) {
      toast.error(err || "Failed to update job status.");
    }
  };

  if (!canEdit) {
    return (
      <span className={`inline-flex items-center rounded-full font-medium ${pillCls}`}>
        {status}
      </span>
    );
  }

  return (
    <Menu as="div" className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <MenuButton
        className={`flex items-center gap-1 rounded-full font-medium transition-opacity hover:opacity-80 ${pillCls}`}
      >
        {status}
        <FiChevronDown className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </MenuButton>
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <MenuItems
          anchor="bottom start"
          className="z-50 w-40 rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-gray-900 p-1.5 shadow-lg [--anchor-gap:6px]"
        >
          {jobStatusOptions.map((opt) => (
            <MenuItem key={opt.id}>
              <button
                type="button"
                onClick={(e) => handleSelect(e, opt.id)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm data-[focus]:bg-slate-100 dark:data-[focus]:bg-white/10"
              >
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${jobStatusColor(opt.id)}`}>
                  {opt.title}
                </span>
                {opt.id === status && <FiCheck className="h-3.5 w-3.5 text-teal-500 shrink-0" />}
              </button>
            </MenuItem>
          ))}
        </MenuItems>
      </Transition>
    </Menu>
  );
};

export default JobStatusMenu;
