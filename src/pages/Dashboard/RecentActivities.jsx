import { FiBookOpen, FiCreditCard, FiFileText, FiUsers } from "react-icons/fi";
import { Car } from "lucide-react";

const RecentActivities = () => {
  const activities = [
    {
      id: 1,
      title: "New booking created",
      description: "Booking #1005 was created by Agency XYZ",
      time: "5 minutes ago",
      icon: <FiBookOpen className="h-4 w-4 text-blue-500" />,
      type: "info",
    },
    {
      id: 2,
      title: "Payment received",
      description: "Payment of $1,250 received for Booking #1002",
      time: "32 minutes ago",
      icon: <FiCreditCard className="h-4 w-4 text-green-500" />,
      type: "success",
    },
    {
      id: 3,
      title: "Vehicle maintenance alert",
      description: "Vehicle KIA-2023 is due for maintenance",
      time: "1 hour ago",
      icon: <Car className="h-4 w-4 text-amber-500" />,
      type: "warning",
    },
    {
      id: 4,
      title: "New agency registered",
      description: "Travel Masters has registered as a new agency",
      time: "3 hours ago",
      icon: <FiUsers className="h-4 w-4 text-blue-500" />,
      type: "info",
    },
    {
      id: 5,
      title: "Quotation approved",
      description: "Quotation #Q-2023-089 was approved by the client",
      time: "5 hours ago",
      icon: <FiFileText className="h-4 w-4 text-green-500" />,
      type: "success",
    },
  ];

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        let bgColor =
          activity.type === "success"
            ? "bg-green-100"
            : activity.type === "warning"
            ? "bg-amber-100"
            : activity.type === "error"
            ? "bg-red-100"
            : "bg-blue-100";

        return (
          <div
            key={activity.id}
            className="flex items-start rounded-lg p-3 transition-colors hover:bg-gray-100"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${bgColor}`}
            >
              {activity.icon}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                {activity.title}
              </p>
              <p className="text-xs text-gray-500">{activity.description}</p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentActivities;
