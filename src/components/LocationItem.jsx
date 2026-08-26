import { SlLocationPin } from "react-icons/sl";

const LocationItem = ({ label, value }) => (
  <div className="flex flex-col gap-1 mt-2">
    <p className="text-sm font-medium text-gray-900">{label}</p>
    <div className="flex items-start mt-1 gap-2">
      <div className="flex items-center gap-2">
        <SlLocationPin />
      </div>
      <p className="text-sm text-black">{value}</p>
    </div>
  </div>
);

export default LocationItem;
