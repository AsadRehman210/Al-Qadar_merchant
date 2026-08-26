import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const data = [
  { date: "03/01", bookings: 12, completed: 10, cancel: 3, pending: 2 },
  { date: "03/02", bookings: 15, completed: 13, cancel: 7, pending: 1 },
  { date: "03/03", bookings: 18, completed: 15, cancel: 3, pending: 2 },
  { date: "03/04", bookings: 20, completed: 18, cancel: 0, pending: 2 },
  { date: "03/05", bookings: 22, completed: 20, cancel: 1, pending: 1 },
  { date: "03/06", bookings: 25, completed: 22, cancel: 8, pending: 3 },
  { date: "03/07", bookings: 28, completed: 25, cancel: 9, pending: 2 },
  { date: "03/08", bookings: 30, completed: 28, cancel: 3, pending: 1 },
  { date: "03/09", bookings: 32, completed: 29, cancel: 1, pending: 2 },
  { date: "03/10", bookings: 35, completed: 32, cancel: 1, pending: 2 },
  { date: "03/11", bookings: 38, completed: 35, cancel: 2, pending: 3 },
  { date: "03/12", bookings: 40, completed: 37, cancel: 3, pending: 2 },
  { date: "03/13", bookings: 42, completed: 39, cancel: 3, pending: 3 },
  { date: "03/14", bookings: 45, completed: 42, cancel: 3, pending: 2 },
];

const BookingTrendsGraph = () => {
  return (
    <div className="w-full h-full min-w-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#333" }}
            axisLine={{ stroke: "#ddd" }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#333" }}
            axisLine={{ stroke: "#ddd" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tick={{ fill: "#333" }}
            axisLine={{ stroke: "#ddd" }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === "cancel") return [`${value}%`, "Cancel"];
              if (name === "bookings") return [value, "Total Bookings"];
              if (name === "completed") return [value, "Completed"];
              if (name === "pending") return [value, "Pending"];
              return [value, name];
            }}
            contentStyle={{
              backgroundColor: "#fff",
              borderColor: "#e5e7eb",
              color: "#111827",
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="bookings"
            name="Total Bookings"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="#82ca9d"
            strokeWidth={2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cancel"
            name="Cancel"
            stroke="#ffc658"
            strokeWidth={2}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="pending"
            name="Pending"
            stroke="#f87171"
            strokeWidth={2}
            strokeDasharray="4 2"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BookingTrendsGraph;
