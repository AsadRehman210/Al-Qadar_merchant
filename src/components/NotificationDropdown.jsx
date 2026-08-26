import { useState, useEffect } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { IoMdNotificationsOutline } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  fetchNotifications,
  showNotifications,
  showStatus,
} from "store/slices/headerSlice";
import { showUserData } from "store/slices/uniqueSlice";
import moment from "moment";
import DataState from "components/DataState";
import { showAllNotifications } from "../store/slices/headerSlice";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const notifications = useSelector(showNotifications);
  const allNotifications = useSelector(showAllNotifications);
  const userData = useSelector(showUserData);
  const status = useSelector(showStatus);

  useEffect(() => {
    if (userData?.user_id?._id && isOpen) {
      dispatch(fetchNotifications({ user_id: userData.user_id._id, limit: 5 }));
    }
  }, [dispatch, isOpen]);

  return (
    <Popover className="relative me-2">
      {({ open, close }) => {
        if (open !== isOpen) setIsOpen(open);

        return (
          <>
            <PopoverButton className="size-9 rounded-full bg-white flex items-center justify-center relative hover:bg-gray-100 focus:outline-none">
              <IoMdNotificationsOutline className="text-2xl" />
              {/* Notification count badge */}
              {allNotifications?.misc_data?.totalCountUnread > 0 && (
                <span className="absolute -top-1 -right-0.5 bg-red-500 text-white text-[8px] font-semibold min-w-5 min-h-5 rounded-full flex items-center justify-center">
                  {allNotifications.misc_data.totalCountUnread > 99
                    ? "99+"
                    : allNotifications.misc_data.totalCountUnread}
                </span>
              )}
            </PopoverButton>

            <PopoverPanel
              static={isOpen}
              className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50"
            >
              <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-sm font-semibold">Notifications</h3>
                <Link
                  to="/notifications"
                  className="text-xs text-primary hover:underline"
                  onClick={() => close()}
                >
                  View All
                </Link>
              </div>
              <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
                <DataState loading={status} data={notifications?.result}>
                  {notifications?.result?.length > 0 &&
                    notifications?.result?.map((notification) => (
                      <div
                        key={notification._id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer divide-y divide-gray-200`}
                      >
                        <div className="flex items-start">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center me-3">
                            <IoMdNotificationsOutline className="text-xl" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1" dir="ltr">
                              {moment(notification.created_at).fromNow()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </DataState>
              </div>
            </PopoverPanel>
          </>
        );
      }}
    </Popover>
  );
};

export default NotificationDropdown;
