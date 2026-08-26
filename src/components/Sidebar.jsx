import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { logOut } from "global/helper";
import ActionPopup from "components/ActionPopup";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { showSidebar, toggleSidebar } from "store/slices/headerSlice";
import { useDispatch, useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import { menuSections } from "global/constant";
import { checkRoleAuth } from "global/helper";
import { logoutErp, showStatus } from "store/slices/authSlice";
import { showUserData } from "store/slices/uniqueSlice";
import { toast } from "react-toastify";
import ImageWithFallback from "./ImageWithFallback";
import Logo from "assets/images/rafeeqi_logo_pdf.png";
import { useSocket } from "../context/SocketContext";

const visibleItemsOf = (section) =>
  (section.items || []).filter((item) => (item.role ? checkRoleAuth(item.role) : true));

const collectHrefs = (blocks) =>
  blocks.flatMap((block) =>
    block.itemNodes.flatMap((node) => (node.type === "group" ? node.children.map((c) => c.href) : [node.item.href])),
  );

// Purely presentational per-group accent, cycled by position (across the
// whole sidebar, not reset per section) so every nested group gets visual
// variety without needing a color assigned in the menu data itself. Kept
// distinct from the teal brand color, which stays reserved for the
// active/selected state.
const GROUP_ACCENTS = [
  "text-violet-500 dark:text-violet-400 bg-violet-500/10 dark:bg-violet-500/15",
  "text-blue-500 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/15",
  "text-amber-500 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15",
  "text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/15",
  "text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15",
  "text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/15",
];

// Related sections collapsed under one rail icon — presentation-only, does
// not touch `menuSections` itself. A group's rail icon/label default to its
// first member section's own icon/title; only groups combining more than one
// section (currently just "operations") need an explicit label override.
const RAIL_GROUPS = [
  { key: "main", sectionTitles: ["MAIN"] },
  { key: "hr", sectionTitles: ["HR Management"] },
  { key: "operations", label: "Operations", sectionTitles: ["Products & Inventory", "Warehouse", "Clients & Vendors", "Asset Management"] },
  { key: "admin", sectionTitles: ["Merchants"] },
  { key: "finance", sectionTitles: ["Finance Management"] },
  { key: "reports", sectionTitles: ["Reports"] },
  { key: "settings", sectionTitles: ["Settings"] },
];

function SidebarNavLink({ href, icon: Icon, label, active, onNavigate, iconSize = "h-5 w-5" }) {
  return (
    <Link
      to={href}
      onClick={onNavigate}
      className={`group/item flex items-center gap-3 rounded-lg border-l-4 px-3 py-2 text-sm font-medium transition-all duration-150 ${
        active
          ? "border-l-[var(--color-teal-500)] bg-[var(--color-teal-500)]/10 dark:bg-[var(--color-teal-500)]/15 text-[var(--color-teal-500)] font-semibold"
          : "border-l-transparent text-linkText dark:text-white/80 hover:bg-white/70 dark:hover:bg-white/10 hover:text-teal-700 dark:hover:text-teal-300"
      }`}
    >
      <Icon
        className={`${iconSize} shrink-0 transition-colors ${
          active
            ? "text-[var(--color-teal-500)]"
            : "text-gray-500 dark:text-gray-400 group-hover/item:text-teal-600 dark:group-hover/item:text-teal-400"
        }`}
      />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const popup = useRef();
  const { t } = useTranslation();
  const sidebar = useSelector(showSidebar);
  const dispatch = useDispatch();
  const userData = useSelector(showUserData);
  const status = useSelector(showStatus);
  const [instantClose, setInstantClose] = useState(false);
  const [openGroupKey, setOpenGroupKey] = useState(null);
  const railRef = useRef(null);
  const flyoutRef = useRef(null);
  const { disconnect } = useSocket();

  useEffect(() => {
    let timeoutId;
    let previousWidth = window.innerWidth;

    const handleResize = () => {
      // Clear any pending resize timeout
      clearTimeout(timeoutId);

      // Use timeout to debounce the resize events
      timeoutId = setTimeout(() => {
        const currentWidth = window.innerWidth;

        // Only close sidebar if resizing from desktop (>=1024) to mobile (<1024)
        if (previousWidth >= 1024 && currentWidth < 1024 && sidebar) {
          dispatch(toggleSidebar(false));
        }

        previousWidth = currentWidth;
      }, 100);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [sidebar, dispatch]);

  // Close the open flyout on an outside click or Escape — only listens while
  // a flyout is actually open.
  useEffect(() => {
    if (!openGroupKey) return undefined;

    const handleClick = (e) => {
      if (railRef.current?.contains(e.target)) return;
      if (flyoutRef.current?.contains(e.target)) return;
      setOpenGroupKey(null);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setOpenGroupKey(null);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [openGroupKey]);

  const logOutUser = async () => {
    try {
      await dispatch(logoutErp()).unwrap();
    } catch {
      // Non-fatal — the session is always cleared locally below regardless
      // of whether the API call itself succeeded.
    }
    disconnect();
    logOut(navigate, false);
    toast.success("Logged out successfully.");
  };

  const openPopup = () => {
    if (popup.current) {
      popup.current.openModal();
    }
  };

  const changeSidebar = (instant = false) => {
    if (sidebar) {
      setInstantClose(instant);
      dispatch(toggleSidebar(!sidebar));
      setTimeout(() => setInstantClose(false), instant ? 200 : 500);
    }
  };

  const closeAll = (instant = false) => {
    changeSidebar(instant);
    setOpenGroupKey(null);
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const visibleSections = menuSections.filter((section) =>
    (section.role ? checkRoleAuth(section.role) : true) && visibleItemsOf(section).length,
  );

  // Every section + its items are resolved once, up front, into plain data —
  // so the JSX below only ever renders, never decides. A section that ends
  // up with nothing visible (role-filtered away entirely) is dropped rather
  // than shown empty.
  let groupAccentIdx = -1;
  const sectionBlocks = visibleSections
    .map((section) => {
      const itemNodes = visibleItemsOf(section)
        .map((item) => {
          if (item.children?.length) {
            const visibleChildren = item.children.filter((child) =>
              child.role ? checkRoleAuth(child.role) : true,
            );
            if (!visibleChildren.length) return null;
            groupAccentIdx += 1;
            return {
              type: "group",
              key: item.name,
              icon: item.icon,
              label: t(item.nameKey),
              accent: GROUP_ACCENTS[groupAccentIdx % GROUP_ACCENTS.length],
              children: visibleChildren,
            };
          }
          return { type: "link", key: item.name, item };
        })
        .filter(Boolean);

      if (!itemNodes.length) return null;
      return { key: section.title, icon: section.icon, label: t(section.titleKey), itemNodes };
    })
    .filter(Boolean);

  const sectionBlockByTitle = new Map(sectionBlocks.map((block) => [block.key, block]));

  const railGroups = RAIL_GROUPS
    .map((group) => {
      const blocks = group.sectionTitles.map((title) => sectionBlockByTitle.get(title)).filter(Boolean);
      if (!blocks.length) return null;
      return { key: group.key, icon: blocks[0].icon, label: group.label || blocks[0].label, blocks };
    })
    .filter(Boolean);

  const isGroupActive = (blocks) =>
    blocks.some((block) =>
      block.itemNodes.some((node) =>
        node.type === "group"
          ? node.children.some((child) => isActive(child.href))
          : isActive(node.item.href),
      ),
    );

  const toggleGroup = (key) => setOpenGroupKey((prev) => (prev === key ? null : key));

  const openGroup = railGroups.find((g) => g.key === openGroupKey) || null;

  return (
    <>
      <div
        onClick={() => closeAll()}
        className={`fixed ${
          sidebar ? "block" : "hidden"
        } inset-0 bg-black/70 z-[61] lg:hidden`}
      ></div>

      <div
        ref={railRef}
        className={`${
          sidebar ? "start-0" : "start-[-100%]"
        } h-screen fixed flex w-[72px] transition-all ${
          instantClose ? "duration-200" : "duration-500"
        } lg:start-0 top-0 bottom-0 lg:z-[1] z-[61] shrink-0`}
      >
        <div className="absolute -end-8 top-1 lg:hidden">
          <IoClose
            className="text-3xl text-white cursor-pointer"
            onClick={() => closeAll()}
          />
        </div>

        <div className="h-full w-full shrink-0 bg-white dark:bg-gray-900 border-e border-gray-200 dark:border-gray-700 flex flex-col items-center overflow-hidden shadow-xl shadow-black/[0.03] dark:shadow-black/20 py-4 gap-1">
          <Link
            to="/dashboard"
            onClick={() => closeAll(true)}
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-teal-500/40 transition-all mb-3"
            title={userData?.organizationData?.name}
          >
            <ImageWithFallback
              src={userData?.organizationData?.primary_logo}
              className="h-full w-full object-contain p-1 !bg-primary/10"
              fallbackSrc={Logo}
              alt={userData?.organizationData?.name}
            />
          </Link>

          <div className="flex-1 w-full flex flex-col items-center gap-1.5 overflow-y-auto px-2">
            {railGroups.map(({ key, icon: GroupIcon, label, blocks }) => {
              const active = isGroupActive(blocks);
              const isOpen = openGroupKey === key;
              const hrefs = collectHrefs(blocks);
              const soleHref = hrefs.length === 1 ? hrefs[0] : null;
              const btnCls = `flex h-11 w-11 items-center justify-center rounded-xl shrink-0 transition-all duration-150 ${
                active || isOpen
                  ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/30"
                  : "text-gray-500 dark:text-gray-400 hover:bg-teal-500/10 dark:hover:bg-teal-500/15 hover:text-teal-600 dark:hover:text-teal-400"
              }`;

              if (soleHref) {
                return (
                  <Link key={key} to={soleHref} onClick={() => closeAll(true)} title={label} aria-label={label} className={btnCls}>
                    {GroupIcon ? <GroupIcon className="h-5 w-5" /> : null}
                  </Link>
                );
              }

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleGroup(key)}
                  title={label}
                  aria-label={label}
                  aria-expanded={isOpen}
                  className={btnCls}
                >
                  {GroupIcon ? <GroupIcon className="h-5 w-5" /> : null}
                </button>
              );
            })}

            {!railGroups.length && (
              <p className="px-1 py-4 text-center text-[10px] text-gray-400 dark:text-gray-500">
                {t("no_record_found")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={openPopup}
            title={t("sidebar_logout")}
            aria-label={t("sidebar_logout")}
            className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors mt-2"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {openGroup && (
        <div
          ref={flyoutRef}
          className="fixed start-[72px] top-0 h-screen w-[260px] z-[62] flex flex-col bg-white dark:bg-gray-900 border-e border-gray-200 dark:border-gray-700 shadow-2xl shadow-black/10 dark:shadow-black/40"
        >
          <div className="flex items-center justify-between gap-2 px-4 pt-5 pb-3 shrink-0 border-b border-gray-100 dark:border-white/10">
            <h2 className="text-sm font-bold text-[#020817] dark:text-white truncate">{openGroup.label}</h2>
            <button
              type="button"
              onClick={() => setOpenGroupKey(null)}
              aria-label={t("cancel")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <IoClose className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {openGroup.blocks.map((block) => {
              return (
                <div key={block.key}>
                  <h3 className="px-1 mb-2 text-sm font-bold text-gray-500 dark:text-gray-400 truncate">
                    {block.label}
                  </h3>
                  <div className="space-y-1">
                    {block.itemNodes.map((node) => {
                      if (node.type === "group") {
                        const GroupIcon = node.icon;
                        return (
                          <div key={node.key}>
                            <div className="flex items-center gap-2 mb-2 px-1">
                              {GroupIcon ? (
                                <span
                                  className={`flex h-5 w-5 items-center justify-center rounded-md shrink-0 ${node.accent}`}
                                >
                                  <GroupIcon className="h-3 w-3" />
                                </span>
                              ) : null}
                              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-mutedForeground dark:text-gray-500">
                                {node.label}
                              </h4>
                            </div>
                            <div className="space-y-0.5">
                              {node.children.map((child) => (
                                <SidebarNavLink
                                  key={child.name}
                                  href={child.href}
                                  icon={child.icon}
                                  label={t(child.nameKey)}
                                  active={isActive(child.href)}
                                  onNavigate={() => closeAll(true)}
                                  iconSize="h-[18px] w-[18px]"
                                />
                              ))}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <SidebarNavLink
                          key={node.key}
                          href={node.item.href}
                          icon={node.item.icon}
                          label={t(node.item.nameKey)}
                          active={isActive(node.item.href)}
                          onNavigate={() => closeAll(true)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ActionPopup
        ref={popup}
        title={t("logout")}
        description={t("logout_confirmation")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={logOutUser}
        loading={status}
      />
    </>
  );
}
