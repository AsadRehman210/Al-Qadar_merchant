import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "components/Sidebar";
import Header from "components/Header";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { showToken } from "store/slices/uniqueSlice";
import { useTranslation } from "react-i18next";

const LayoutDashboard = () => {
  const navigate = useNavigate();
  const token = useSelector(showToken);
  const { i18n } = useTranslation();

  // handle user login
  useEffect(() => {
    if (!token) {
      navigate("/");
    }
  }, []);

  // Prevent layout render if there's no token
  if (!token) return null;

  const isRTL = i18n.language === "ar";

  return (
    <div className="bg-slate-50 dark:bg-gray-900 w-full">
      <Sidebar />
      <div
        className={`min-h-screen w-full transition-all duration-300 ${
          isRTL ? "lg:pr-[72px]" : "lg:pl-[72px]"
        }`}
      >
        <Header />
        <div className="p-6 w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default LayoutDashboard;
