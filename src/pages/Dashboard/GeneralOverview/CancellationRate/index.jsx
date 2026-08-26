import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { showDashboard } from "store/slices/dashboardSlice";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import Card from "components/Card";

const PieChartWithNeedle = ({ value, maxValue = 100 }) => {
  const { t } = useTranslation();
  // Create data for the gauge background - single segment for continuous gradient
  const data = [
    { name: "Full", value: maxValue }, // Full semicircle with gradient
  ];

  // Calculate needle position
  const cx = 50; // Center X percentage
  const cy = 50; // Center Y percentage
  const radius = 25; // Needle length percentage (reduced to stay within chart)

  // Calculate the angle where the percentage ends
  // The pie chart goes from startAngle=180 to endAngle=0
  // This means it starts from the left (180°) and goes clockwise to the right (0°)
  const percentageRatio = value / maxValue;

  // For the needle to point where the red segment ends:
  // At 0%: needle should be at 180° (far left)
  // At 100%: needle should be at 0° (far right)
  // The red segment starts at 180° and ends at (180° - percentage * 180°)
  const needleAngle = 180 - percentageRatio * 180;

  // Convert to radians for calculation
  const angleRad = (needleAngle * Math.PI) / 180;
  const needleX = cx + radius * Math.cos(angleRad);
  // Fix: In SVG, Y increases downward, so we need to subtract sin to move upward
  const needleY = cy - radius * Math.sin(angleRad);

  // Calculate needle base points for triangular shape
  const baseWidth = 3; // Width of needle base in percentage
  const baseAngle1 = needleAngle + 90;
  const baseAngle2 = needleAngle - 90;
  const baseRad1 = (baseAngle1 * Math.PI) / 180;
  const baseRad2 = (baseAngle2 * Math.PI) / 180;

  const baseX1 = cx + baseWidth * Math.cos(baseRad1);
  const baseY1 = cy - baseWidth * Math.sin(baseRad1);
  const baseX2 = cx + baseWidth * Math.cos(baseRad2);
  const baseY2 = cy - baseWidth * Math.sin(baseRad2);

  return (
    <div className="relative w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient
              id="redBlueGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              {/* <stop offset="5%" stopColor="yellow" /> */}
              <stop offset="50%" stopColor="blue" />
              <stop offset="100%" stopColor="red" />
            </linearGradient>
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius="60%"
            outerRadius="80%"
            dataKey="value"
            fill="url(#redBlueGradient)"
            stroke="none"
          >
            <Cell key="full-gauge" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Needle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          className="absolute"
          style={{ pointerEvents: "none" }}
        >
          {/* Simple line needle for visibility */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            // stroke="#ef4444"
            // strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Triangular needle */}
          <polygon
            points={`${baseX1},${baseY1} ${baseX2},${baseY2} ${needleX},${needleY}`}
            fill="#fbbf24"
            stroke="#f59e0b"
            strokeWidth="0.5"
          />

          {/* Center circle */}
          <circle cx={cx} cy={cy} r="3" fill="#374151" />
          <circle cx={cx} cy={cy} r="1.5" fill="#ffffff" />
        </svg>
      </div>

      {/* Value display */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {value}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t("dashboard:cancellation_rate")}
          </div>
        </div>
      </div>
    </div>
  );
};

const CancellationRate = () => {
  const { t } = useTranslation();
  const dashboard_analytics = useSelector(showDashboard);

  const cancellationRate = (() => {
    const rate = dashboard_analytics?.cancellationRate;

    // Handle null, undefined, empty string, or "NaN" string
    if (!rate || rate === "NaN" || isNaN(parseFloat(rate))) {
      return 0;
    }

    // Convert to number and ensure it's valid
    const numericRate = parseFloat(rate);
    return isNaN(numericRate) ? 0 : numericRate;
  })();

  return (
    <Card>
      <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <h2 className="text-2xl font-semibold text-gray-900">
          {t("dashboard:cancellation_rate")}
        </h2>
      </div>

      <PieChartWithNeedle value={cancellationRate} maxValue={100} t={t} />
    </Card>
  );
};

export default CancellationRate;
