import { FaMapMarkerAlt } from "react-icons/fa";
import Card from "components/Card";
import Button from "components/Button";

// AgencyMap Component
export function AgencyMap() {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-muted/30 rounded-lg bg-gray-100">
      <div className="text-center flex flex-col gap-1">
        <p className=" text-gray-500">Interactive map will be displayed here</p>
        <p className="text-xs text-gray-500">
          Showing 142 agencies across 28 countries
        </p>
      </div>
      {/* Map implementation would go here */}
    </div>
  );
}

// Main Component
function AgencyDistribution() {
  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 hover:shadow-lg mt-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
          <h2 className="text-2xl font-semibold text-gray-900">
            Agency Distribution
          </h2>
          <Button
            title="View Full Map"
            type="button"
            icon={FaMapMarkerAlt}
            className="!w-auto !rounded-md"
          />
        </div>
        <p className="text-sm text-gray-500">
          Geographic distribution of agencies and active bookings
        </p>
      </div>
      <div className="p-4 h-[350px]">
        <AgencyMap />
      </div>
    </Card>
  );
}

export default AgencyDistribution;
