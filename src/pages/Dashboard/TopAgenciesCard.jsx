import { FiUsers } from "react-icons/fi";
import { TopAgencies } from "./TopAgencies";
import { Link } from "react-router-dom";

export default function TopAgenciesCard() {
  return (
    <div className="rounded-2xl border shadow-sm p-4 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-2xl font-semibold">Top Agencies</h3>
        <span className="text-xs font-semibold px-2.5 py-1 border border-gray-300 rounded-full">
          This Month
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Agencies with highest booking volume
      </p>

      <TopAgencies />

      <div className="mt-4">
        <Link
          to="/agencies"
          className="inline-flex items-center justify-center w-full border text-sm rounded-md px-4 py-2 hover:bg-gray-100 transition font-medium"
        >
          <FiUsers className="h-4 w-4 mr-2" />
          View All Agencies
        </Link>
      </div>
    </div>
  );
}
