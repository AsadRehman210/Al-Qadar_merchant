import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Available", value: 187, color: "#22c55e" }, // green
  { name: "On Trip", value: 124, color: "#3b82f6" }, // blue
  { name: "Out of Service", value: 15, color: "#ef4444" }, // red
];

const VehicleStatusChart = () => {
  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VehicleStatusChart;
