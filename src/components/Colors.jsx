import { colors } from "global/constant";
import { FaCheck } from "react-icons/fa6";
const Colors = ({ selColor, setSelColor }) => {
  return (
    <>
      {colors?.map((item, idx) => (
        <div
          key={idx}
          onClick={() => setSelColor(item.title)}
          className={` rounded-full shadow-[0px_0px_10px_#d9d9d9] text-xs text-white cursor-pointer flex items-center justify-center w-[35px] h-[35px] ${item.value}`}
        >
          {item.title === selColor ? (
            <FaCheck className="text-white text-lg drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
          ) : null}
        </div>
      ))}
    </>
  );
};

export default Colors;
