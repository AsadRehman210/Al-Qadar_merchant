import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { IoClose } from "react-icons/io5";

const BookingPopup = forwardRef(function Popup(props, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    children,
    className,
    outer,
    title,
    description,
    disableClose = false, // new prop
  } = props;

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    if (!disableClose) {
      setIsOpen(false);
    }
  };

  const forceClose = () => {
    setIsOpen(false);
  };

  useImperativeHandle(ref, () => ({
    openModal,
    closeModal,
    forceClose,
  }));

  return (
    <Transition appear show={isOpen}>
      <Dialog
        as="div"
        className={`relative z-[63] focus:outline-none ${outer || ""}`}
        onClose={disableClose ? () => {} : closeModal}
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
                className={`${
                  className || ""
                } relative w-full max-w-3xl rounded-[30px] bg-white backdrop-blur-2xl`}
              >
                <div className="flex items-center justify-between px-10 py-[31px] bg-[#F1F4F9] rounded-t-[30px]">
                  <div>
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

                  {!disableClose && (
                    <div
                      onClick={closeModal}
                      className="size-14 rounded-full flex items-center text-black justify-center bg-white absolute right-[18px] top-[18px] cursor-pointer"
                    >
                      <IoClose className="text-2xl" />
                    </div>
                  )}
                </div>

                <div className="p-6">{children}</div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
});

export default BookingPopup;
