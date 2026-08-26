import { FaStar } from "react-icons/fa";
import { LuUserCog } from "react-icons/lu";
import { ProgressBar } from "./ProgressBar";

const TopDrivers = () => {
  const drivers = [
    { name: "Ahmed Hassan", trips: 32, rating: 4.9, percentage: 98 },
    { name: "Mohammed Ali", trips: 28, rating: 4.8, percentage: 96 },
    { name: "Sara Khan", trips: 25, rating: 4.7, percentage: 94 },
    { name: "Omar Farooq", trips: 22, rating: 4.6, percentage: 92 },
  ];

  return (
    <div className="space-y-4">
      {drivers.map((driver, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                <LuUserCog className="text-blue-600 w-4 h-4" />
              </div>
              <span className="text-sm font-medium">{driver.name}</span>
            </div>
            <div className="flex items-center">
              <FaStar className="text-yellow-500 w-3 h-3 mr-1" />
              <span className="text-sm">{driver.rating}</span>
            </div>
          </div>
          <ProgressBar value={driver.percentage} />
          <p className="flex justify-start text-xs text-gray-500">
            {driver.trips} trips completed
          </p>
        </div>
      ))}
    </div>
  );
};

export default TopDrivers;
