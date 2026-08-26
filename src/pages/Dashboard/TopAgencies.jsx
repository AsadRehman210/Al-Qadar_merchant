import { FiUsers } from "react-icons/fi";

export function TopAgencies() {
  const agencies = [
    {
      name: "Global Travels",
      bookings: 48,
      revenue: "$12,450",
      percentage: 92,
    },
    { name: "Luxury Tours", bookings: 36, revenue: "$9,850", percentage: 78 },
    { name: "City Explorers", bookings: 29, revenue: "$7,200", percentage: 65 },
    {
      name: "Business Transit",
      bookings: 24,
      revenue: "$6,750",
      percentage: 52,
    },
  ];

  return (
    <div className="space-y-4">
      {agencies.map((agency, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                <FiUsers className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium">{agency.name}</span>
            </div>
            <span className="text-sm text-gray-500">
              {agency.bookings} bookings
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded">
            <div
              className="h-full bg-blue-500 rounded"
              style={{ width: `${agency.percentage}%` }}
            ></div>
          </div>
          <p className="flex justify-end text-xs font-medium">
            {agency.revenue}{" "}
          </p>
        </div>
      ))}
    </div>
  );
}
