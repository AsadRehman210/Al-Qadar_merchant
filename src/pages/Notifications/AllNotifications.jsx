import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoMdNotificationsOutline } from "react-icons/io";
import {
  fetchAllNotifications,
  showAllNotifications,
  showAllStatus,
} from "store/slices/headerSlice";
import { showUserData } from "store/slices/uniqueSlice";
import Card from "components/Card";
import moment from "moment";
import ReactPaginate from "react-paginate";
import { FaAngleRight, FaAngleLeft } from "react-icons/fa";
import Button from "components/Button";
import DataState from "components/DataState";
import { markAllReadNotification } from "../../store/slices/headerSlice";

const AllNotifications = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(showAllNotifications);
  const userData = useSelector(showUserData);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(1);
  const status = useSelector(showAllStatus);

  useEffect(() => {
    dispatch(
      fetchAllNotifications({
        user_id: userData?.user_id?._id,
        limit: 10,
        page: currentPage,
      })
    );
  }, [dispatch, isRefreshing, currentPage]);

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected + 1);
    const notificationIds = notifications.result.map((n) => n._id);
    dispatch(markAllReadNotification({ list_id: notificationIds }));
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-end items-center mb-4">
        <Button
          title="Refresh"
          className="!w-auto !px-6"
          loading={status}
          onClick={() => {
            setIsRefreshing(isRefreshing + 1);
          }}
          btn="outline"
        />
      </div>
      <Card className="overflow-hidden min-h-[72vh] divide-y divide-gray-200 flex flex-col gap-2">
        <DataState loading={status} data={notifications?.result} className="">
          {notifications?.result?.length > 0 &&
            notifications?.result?.map((notification) => (
              <div
                key={notification._id}
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                  !notification.is_read ? "bg-gray-200" : "bg-white"
                }`}
              >
                <div className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center me-3">
                    <IoMdNotificationsOutline className="text-xl" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
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
      </Card>

      <div className="flex items-center">
        <div className="pagination mt-7 mr-6 ltr:ml-auto rtl:mr-auto">
          <ReactPaginate
            breakLabel="..."
            nextLabel={<FaAngleRight />}
            previousLabel={<FaAngleLeft />}
            onPageChange={handlePageChange}
            pageRangeDisplayed={3}
            marginPagesDisplayed={1}
            pageCount={notifications?.total_pages}
            forcePage={currentPage - 1}
            currentPage={currentPage}
            renderOnZeroPageCount={null}
            containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default AllNotifications;
