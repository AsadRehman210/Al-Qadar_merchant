import Button from "components/Button";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
export default function PageHeader({
  title,
  description,
  className = "",
  btnTitle,
  onClick,
  navigateLink,
}) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  
  return (
    <div className={`${className} flex flex-wrap gap-5 mb-3 items-center`}>
      {navigateLink && (
        <Button
          type="button"
          onClick={() => {
            navigate(navigateLink);
          }}
          icon={isRTL ? FiArrowRight : FiArrowLeft}
          className="!h-10 !w-10 hover:bg-gray-100 text-black !px-2 !font-normal rounded-md"
          iconClass="text-base !text-black"
        />
      )}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-linkText">
          {title}
        </h1>
        <p className="text-mutedForeground">{description}</p>
      </div>
      {btnTitle && (
        <Button
          type="button"
          onClick={onClick}
          title={btnTitle}
          btn="primary"
          className="ml-auto"
        />
      )}
    </div>
  );
}
