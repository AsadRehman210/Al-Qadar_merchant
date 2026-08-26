export const ProgressBar = ({ value }) => {
  return (
    <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
      <div className="bg-blue-600 h-2" style={{ width: `${value}%` }}></div>
    </div>
  );
};
