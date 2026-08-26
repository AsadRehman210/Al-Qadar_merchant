import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { IoClose } from "react-icons/io5";
import { useTranslation } from "react-i18next";

const Popup = forwardRef(function Popup(props, ref) {
  useImperativeHandle(ref, () => ({
    openModal: openModal,
    closeModal: closeModal,
  }));
  let [isOpen, setIsOpen] = useState(false);
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { children, className, outer, title, description, onClose } = props;

  const openModal = () => {
    setIsOpen(true);
    // document.querySelector("header").style.zIndex = "30";
  };

  const closeModal = () => {
    if (!isOpen) return; // agar already closed hai to kuch mat karo
    setIsOpen(false);
    // Call onClose callback if provided
    if (onClose && typeof onClose === "function") {
      setTimeout(() => onClose(), 0); // call next tick mai
    }
    // if (!inner) {
    //   setTimeout(() => {
    //     document.querySelector("header").style.zIndex = "";
    //   }, [300]);
    // }
  };

  return (
    <>
      <Transition appear show={isOpen}>
        <Dialog
          as="div"
          className={`relative z-[999999999] focus:outline-none ${outer || ""}`}
          onClose={closeModal}
        >
          <div
            className={`fixed inset-0 ${
              outer || ""
            } z-[63] w-screen bg-black/30 overflow-y-auto`}
          >
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                enter="ease-out duration-300"
                enterFrom="opacity-0 transform-[scale(95%)]"
                enterTo="opacity-100 transform-[scale(100%)]"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 transform-[scale(100%)]"
                leaveTo="opacity-0 transform-[scale(95%)]"
              >
                <DialogPanel
                  dir={isRTL ? "rtl" : "ltr"}
                  className={`${
                    className || ""
                  } relative w-full max-w-3xl rounded-[30px] bg-white backdrop-blur-2xl`}
                >
                  <div className="flex items-center justify-between px-10 py-[31px] bg-[#F1F4F9] rounded-t-[30px]">
                    <div className="text-start min-w-0 flex-1 pe-14 rtl:pe-0 rtl:ps-0">
                      <h2
                        className={`${
                          !description
                            ? "text-xl text-black"
                            : "text-sm text-lighterBlue"
                        } font-semibold`}
                      >
                        {title}
                      </h2>
                      {description && (
                        <h2 className="text-xl font-semibold text-blue">
                          {description}
                        </h2>
                      )}
                    </div>
                    <div
                      onClick={closeModal}
                      className="size-14 rounded-full flex items-center text-black justify-center bg-white absolute top-[18px] ltr:right-[18px] ltr:left-auto rtl:left-[18px] rtl:right-auto cursor-pointer"
                    >
                      <IoClose className="text-2xl" />
                    </div>
                  </div>
                  {/* get component from parent */}
                  <div className="p-6 text-start">{children}</div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
});

export default Popup;
