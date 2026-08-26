import { Link } from "react-router-dom";
import { Car } from "lucide-react";
import VehicleStatusChart from "./VehicleStatusChart";
const data = [
  { label: "Available", count: 187, color: "bg-green-500" },
  { label: "On Trip", count: 124, color: "bg-blue-500" },
  { label: "Out of Service", count: 15, color: "bg-red-500" },
];
const VehicleStatusCard = () => {
  return (
    <div className="card-hover border rounded-lg shadow-md">
      <div className="p-4">
        <h3 className="text-2xl font-semibold">Vehicle Status</h3>
        <p className="text-sm text-gray-500">Current status of all vehicles</p>
      </div>
      <div className="p-4">
        <VehicleStatusChart />
        <div className="mt-6 space-y-4">
          {data.map((status) => (
            <div
              className="flex items-center justify-between"
              key={status.label}
            >
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${status.color}`}
                ></div>
                <span className="text-sm">{status.label}</span>
              </div>
              <span className="text-sm font-medium">{status.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4">
        <Link
          to="/vehicles"
          className="w-full flex items-center justify-center text-sm border rounded-md px-4 py-2 hover:bg-gray-100 font-medium"
        >
          <Car className="h-4 w-4 mr-2" />
          Manage Vehicles
        </Link>
      </div>
    </div>
  );
};

export default VehicleStatusCard;
