import { FaStar, FaStarHalfStroke } from "react-icons/fa6";
import { TiStarOutline } from "react-icons/ti";

const StarRating = ({ rating }) => {
  const totalStars = 5;

  const getStarIcon = (index) => {
    if (index + 1 <= rating)
      return <FaStar className="text-yellow-400 fill-yellow-500 text-base" />;
    if (index < rating && index + 1 > rating)
      return (
        <FaStarHalfStroke
          rHalf
          className="text-yellow-400 fill-yellow-500 text-base"
        />
      );
    return <TiStarOutline className="text-gray-400 text-lg" />;
  };

  return (
    <div className="flex items-center space-x-1">
      {[...Array(totalStars)].map((_, index) => (
        <div key={index}>{getStarIcon(index)}</div>
      ))}
    </div>
  );
};

export default StarRating;
