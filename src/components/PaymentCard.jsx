import Checkbox from "components/Checkboxes";

const PaymentCard = ({ url, title, isCheck, selected, onSelect }) => {
  return (
    <div
      className={`h-[64px] pl-5 pr-7 border border-[#EEF0EB] rounded-lg flex items-center justify-between cursor-pointer ${
        selected ? "border-blue-500" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-7">
        <img src={url} />
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      {!isCheck && <Checkbox enabled={selected} bgChecked="bg-blue" />}
    </div>
  );
};

export default PaymentCard;
