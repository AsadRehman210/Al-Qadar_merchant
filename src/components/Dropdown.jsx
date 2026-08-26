import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { createElement } from "react";
import { Link } from "react-router";

const Dropdown = ({ button, options, iconClass, item }) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="p-2 rounded-full hover:bg-gray-100 focus:outline-none">
        {button}
      </MenuButton>

      <Transition
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 w-56 mt-2 bottom-full origin-bottom-right bg-white border rounded-lg shadow-lg focus:outline-none">
          <div className="p-2">
            {options?.map((option, idx) =>
              option.separator ? (
                <div key={idx} className="border-t my-2"></div>
              ) : (
                <MenuItem key={idx}>
                  {option.href ? (
                    <Link
                      to={`${option.href}/${item?._id}`}
                      className="flex items-center px-4 py-2 rounded-lg text-sm hover:bg-gray-100"
                    >
                      {option.icon &&
                        createElement(option.icon, {
                          className: `mr-2 h-4 w-4 ${iconClass}`,
                        })}
                      {option.title}
                    </Link>
                  ) : (
                    <button
                      onClick={() => option.onClick(item?._id)}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm w-full text-left hover:bg-gray-100 ${
                        option?.title?.match(/Delete|Deactivate/i)
                          ? "text-red-600"
                          : ""
                      }`}
                    >
                      {option.icon &&
                        createElement(option.icon, {
                          className: `mr-2 h-4 w-4 ${iconClass}`,
                        })}
                      {option.title}
                    </button>
                  )}
                </MenuItem>
              )
            )}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
};

export default Dropdown;
