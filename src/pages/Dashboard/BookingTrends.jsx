import Card from "components/Card";
import BookingTrendsGraph from "./BookingTrendsGraph";

const BookingTrends = () => {
  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 hover:shadow-lg">
      <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <h2 className="text-2xl font-semibold text-gray-900">Booking Trends</h2>
        <span className="text-xs font-semibold px-2.5 py-1 border border-gray-300 rounded-full">
          Last 30 days
        </span>
      </div>
      <p className="text-sm text-gray-500">
        Daily booking volume and completion rate
      </p>
      <div className="h-[250px] sm:h-[300px] mt-4 w-full overflow-x-auto">
        <BookingTrendsGraph />
      </div>
    </Card>
  );
};

export default BookingTrends;
