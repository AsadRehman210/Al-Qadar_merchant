import { LuUserCog } from "react-icons/lu";
import TopDrivers from "./TopDrivers";
import { Link } from "react-router-dom";

const DriverCard = () => {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-all space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-semibold">Top Drivers</h2>
          <span className="text-xs font-semibold px-2.5 py-1 border border-gray-300 rounded-full">
            This Month
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Drivers with highest ratings and trips
        </p>
      </div>

      <TopDrivers />

      <div>
        <Link
          to="/drivers"
          className="flex items-center justify-center w-full text-sm border rounded-md px-4 py-2 hover:bg-gray-100 transition font-medium"
        >
          <LuUserCog className="mr-2 w-4 h-4" />
          View All Drivers
        </Link>
      </div>
    </div>
  );
};

export default DriverCard;
