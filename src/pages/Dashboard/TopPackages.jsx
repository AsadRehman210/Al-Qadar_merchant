import { ProgressBar } from "./ProgressBar"; // Reusing or creating a simple progress bar
import { FiPackage } from "react-icons/fi";

const TopPackages = () => {
  const packages = [
    {
      name: "City Tour Deluxe",
      bookings: 28,
      revenue: "$8,400",
      percentage: 85,
    },
    {
      name: "Weekend Getaway",
      bookings: 23,
      revenue: "$6,900",
      percentage: 70,
    },
    {
      name: "Business Travel",
      bookings: 19,
      revenue: "$5,700",
      percentage: 58,
    },
    { name: "Desert Safari", bookings: 16, revenue: "$4,800", percentage: 48 },
  ];

  return (
    <div className="space-y-4">
      {packages.map((pkg, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                <FiPackage className="text-blue-600 w-4 h-4" />
              </div>
              <span className="text-sm font-medium">{pkg.name}</span>
            </div>
            <span className="text-sm text-gray-500">
              {pkg.bookings} bookings
            </span>
          </div>
          <ProgressBar value={pkg.percentage} />
          <div className="flex justify-end text-xs">
            <p className="font-medium">{pkg.revenue}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopPackages;
