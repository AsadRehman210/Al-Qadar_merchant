import { FaSpinner } from "react-icons/fa";

const LoaderContainer = ({ className }) => {
  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center ${
        className || ""
      }`}
    >
      <FaSpinner className="animate-spin text-white text-6xl" />
    </div>
  );
};

export default LoaderContainer;
