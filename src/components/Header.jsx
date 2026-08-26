import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { breadcrumbs } from "global/constant";
import { IoMenu } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { showSidebar, toggleSidebar } from "store/slices/headerSlice";
import ThemeSwitcher from "./ThemeSwitcher";
import LanguageDropdown from "./LanguageDropdown";
import UserNav from "components/UserNav";
import NotificationDropdown from "./NotificationDropdown";

const Header = () => {
  const [data, setData] = useState({});
  const location = useLocation();
  const dispatch = useDispatch();
  const sidebar = useSelector(showSidebar);
  const { t } = useTranslation();

  // get breadcrumb for diplay in header
  useEffect(() => {
    const path = location.pathname;
    const matched = breadcrumbs.filter((item) => path.startsWith(item.url));

    // Sort by url length descending to get the most specific match
    const current = matched.sort((a, b) => b.url.length - a.url.length)[0];
    setData(current || {});
  }, [location]);

  const changeSidebar = () => {
    dispatch(toggleSidebar(!sidebar));
  };
  return (
    <>
      <header className="sticky top-0 z-[60] min-h-[60px] bg-white dark:bg-gray-900 border-b border-[#e2e8f0] dark:border-gray-700">
        <div className="px-6 py-4 flex gap-4 flex-wrap items-center">
          <div className="md:block hidden">
            <h1 className="text-lg font-semibold text-[#374151] dark:text-white capitalize">
              {t(data?.title)}
            </h1>
          </div>
          <div className="ms-auto gap-3 flex items-center">
            <ThemeSwitcher />

            {/* <LanguageDropdown className="!h-9 !min-h-9 !py-1.5 !px-2.5" />
            <NotificationDropdown /> */}

            <UserNav />
            <div className="lg:hidden flex">
              <IoMenu
                className="text-2xl cursor-pointer"
                onClick={changeSidebar}
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
export default Header;
