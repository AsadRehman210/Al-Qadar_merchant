import RecentActivities from "./RecentActivities";
import { FiActivity } from "react-icons/fi";

const ActivityCard = () => {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-all space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Recent Activities</h2>
        <p className="text-sm text-gray-500 mb-4">
          Latest system events and notifications
        </p>
      </div>

      <RecentActivities />

      <div>
        <button className="flex items-center justify-center w-full text-sm border rounded-md px-4 py-2 hover:bg-gray-100 transition font-medium">
          <FiActivity className="mr-2 w-4 h-4" />
          View All Activities
        </button>
      </div>
    </div>
  );
};

export default ActivityCard;
