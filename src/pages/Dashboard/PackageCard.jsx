import { Link } from "react-router-dom";
import TopPackages from "./TopPackages";
import { FiPackage } from "react-icons/fi";

const PackageCard = () => {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-all space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Popular Packages</h2>
        <p className="text-sm text-gray-500 mb-4">
          Most booked packages this month
        </p>
      </div>

      <TopPackages />

      <div>
        <Link
          to="/packages"
          className="flex items-center justify-center w-full text-sm border rounded-md px-4 py-2 hover:bg-gray-100 transition font-medium"
        >
          <FiPackage className="mr-2 w-4 h-4" />
          View All Packages
        </Link>
      </div>
    </div>
  );
};

export default PackageCard;
