import React from "react";
import Card from "components/Card";
export default function StatCard({
  title,
  value,
  icon,
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary",
  subtitle,
  className = "",
}) {
  return (
    <Card className={className}>
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="text-sm font-medium">{title}</div>
        {icon && (
          <div
            className={`h-8 w-8 rounded-full ${iconBgColor} flex items-center justify-center`}
          >
            {React.cloneElement(icon, { className: `h-4 w-4 ${iconColor}` })}
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs gap-2 mt-2">{subtitle}</p>}
      </div>
    </Card>
  );
}
