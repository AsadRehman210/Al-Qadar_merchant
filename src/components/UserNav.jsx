import { Fragment, useRef } from "react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { FiLogOut, FiSettings, FiUser } from "react-icons/fi";
import { logOut } from "../global/helper";
import { useNavigate } from "react-router";
import ImageWithFallback from "components/ImageWithFallback";
import { useSelector, useDispatch } from "react-redux";
import { showUserData } from "store/slices/uniqueSlice";
import ActionPopup from "components/ActionPopup";
import { useTranslation } from "react-i18next";
import { logoutErp, showStatus } from "store/slices/authSlice";
import { toast } from "react-toastify";
import { useSocket } from "../context/SocketContext";
export default function UserNav() {
  const userData = useSelector(showUserData);
  const navigate = useNavigate();
  const status = useSelector(showStatus);
  const popup = useRef();
  const { disconnect } = useSocket();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const logOutUser = async () => {
    try {
      await dispatch(logoutErp()).unwrap();
    } catch {
      // Non-fatal — the session is always cleared locally below regardless
      // of whether the API call itself succeeded.
    }
    disconnect();
    logOut(navigate, false);
    toast.success("Logged out successfully.");
  };
  return (
    <>
      <Menu as="div" className="relative">
        <MenuButton as={Fragment}>
          <div className="md:size-9 size-7 bg-gray-100 rounded-full cursor-pointer">
            <ImageWithFallback
              src={""}
              alt={userData?.first_name + " " + userData?.last_name}
              fontSize={0.37}
              bold={true}
              className="md:size-9 size-7 object-cover object-center rounded-full"
            />
          </div>
        </MenuButton>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems className="absolute right-0 rtl:left-0 rtl:right-auto rtl:origin-top-left mt-2 w-56 rounded-lg bg-white shadow-lg focus:outline-none dark:bg-gray-800 origin-top-right">
            <div className="px-4 py-3">
              <p className="text-sm font-medium">
                {userData?.first_name} {userData?.last_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {userData?.email}
              </p>
            </div>
            {/* <div className="border-t border-gray-200 dark:border-gray-700">
              <MenuItem>
                {({ active }) => (
                  <button
                    className={`${
                      active ? "bg-gray-100 dark:bg-gray-700" : ""
                    } flex w-full items-center px-4 py-2 text-sm`}
                  >
                    <FiUser className="mr-2 h-4 w-4" />
                    Profile
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ active }) => (
                  <button
                    className={`${
                      active ? "bg-gray-100 dark:bg-gray-700" : ""
                    } flex w-full items-center px-4 py-2 text-sm`}
                  >
                    <FiSettings className="mr-2 h-4 w-4" />
                    Settings
                  </button>
                )}
              </MenuItem>
            </div> */}
            <div className="border-t border-gray-200 dark:border-gray-700">
              <MenuItem>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => popup.current.openModal()}
                    className={`${
                      active ? "bg-gray-100 dark:bg-gray-700" : ""
                    } flex w-full items-center px-4 py-2 text-sm text-red-600`}
                  >
                    <FiLogOut className="me-2 h-4 w-4" />
                    {t("sidebar_logout")}
                  </button>
                )}
              </MenuItem>
            </div>
          </MenuItems>
        </Transition>
      </Menu>

      <ActionPopup
        ref={popup}
        title={t("logout")}
        description={t("logout_confirmation")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={logOutUser}
        loading={status}
      />
    </>
  );
}
