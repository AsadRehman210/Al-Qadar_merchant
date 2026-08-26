import { forwardRef, useImperativeHandle, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { IoClose } from "react-icons/io5";

const SidebarModal = forwardRef(
  ({ children, modalStyling, showBackdrop = true }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    // Expose modal functions to parent
    useImperativeHandle(ref, () => ({
      openModal: () => {
        setIsOpen(true);
      },
      closeModal: () => {
        setIsOpen(false);
      },
    }));

    return (
      <Transition appear show={isOpen}>
        <Dialog
          as="div"
          className="relative z-[1000]"
          onClose={() => setIsOpen(false)}
        >
          {/* Conditionally Render Background */}
          {showBackdrop && (
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          )}

          <div className="fixed inset-0 flex items-center justify-end">
            <TransitionChild
              enter="transform transition ease-out duration-300"
              enterFrom="translate-x-full opacity-0"
              enterTo="translate-x-0 opacity-100"
              leave="transform transition ease-in duration-200"
              leaveFrom="translate-x-0 opacity-100"
              leaveTo="translate-x-full opacity-0"
            >
              <DialogPanel
                className="w-full max-w-[900px] h-screen bg-white shadow-lg overflow-y-auto md:overflow-hidden rounded-l-[20px]"
                style={modalStyling}
              >
                <div className="h-auto min-h-screen w-full relative ">
                  {/* Close Button */}
                  <div className="flex justify-between bg-[#F1F4F9] px-10 py-4 ">
                    <p className="text-xl font-medium text-[#00000]">Trip Package Detail</p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className=" p-2 rounded-full bg-white hover:bg-gray-300 z-50 w-[41px] h-[41px] flex justify-center items-center"
                  >
                    <IoClose size={30} />
                  </button>
                  </div>
                  {children}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    );
  }
);

SidebarModal.displayName = "SidebarModal";
export default SidebarModal;
