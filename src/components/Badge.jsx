const Badge = ({ variant = "default", className = "", children, ...props }) => {
  const baseClasses =
    "inline-flex items-center rounded-full size-2 text-xs font-semibold transition-colors";

  const variantClasses = {
    default: "bg-blue-100 text-blue-700 text-xs font-semibold",
    secondary: "bg-gray-100 text-gray-700 text-xs font-semibold",
    destructive: "bg-red-100 text-red-700 text-xs font-semibold",
    success: "bg-active text-[#ffffff] text-xs font-semibold",
    outline: "border border-gray-100 text-gray-700 text-xs font-semibold",
    pending: "bg-yellow-300 text-yellow-900 text-xs font-semibold",
    duplicate: "bg-teal-500 text-white text-xs font-semibold",
    duplicateRevenue: "bg-teal-500 text-white text-xs font-semibold",
    duplicateBookings: "bg-amber-500 text-white text-xs font-semibold",
    ongoing: "bg-purple-200 text-purple-800",
    pendingApproval: "bg-orange-300 text-orange-800",
    partiallyCompleted: "bg-amber-200 text-amber-900 text-xs font-semibold",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Badge;
