import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { IoClose } from "react-icons/io5";
import Button from "components/Button";

const ActionPopup = forwardRef(function ActionPopup(props, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const [id, setId] = useState("");

  // Open Modal Function
  const openModal = (pId) => {
    setId(pId);
    setIsOpen(true);
  };

  // Close Modal Function
  const closeModal = () => {
    setIsOpen(false);
  };

  // Expose Functions to Parent
  useImperativeHandle(ref, () => ({
    openModal,
    closeModal,
  }));

  const { title, description, cancel, confirm, onClick, loading } = props;

  return (
    <Transition appear show={isOpen}>
      <Dialog
        as="div"
        className="relative z-[9999] focus:outline-none"
        open={isOpen}
        onClose={closeModal}
      >
        <div className="fixed inset-0 z-[63] w-screen bg-black/30 overflow-y-auto">
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
                className={`relative w-full max-w-xl rounded-xl bg-white p-6 ${
                  props.className || ""
                }`}
              >
                <IoClose
                  className="text-2xl cursor-pointer absolute right-[18px] top-[18px]"
                  onClick={closeModal}
                />
                {title && (
                  <h3 className="text-lg font-semibold text-heading text-center mb-5">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-base text-heading/60 font-normal text-center mb-6">
                    {description}
                  </p>
                )}
                <div className="flex justify-center gap-4">
                  <Button
                    title={cancel || "Cancel"}
                    className="!w-auto !px-6"
                    onClick={closeModal}
                    btn="outline"
                  />
                  {confirm && (
                    <Button
                      title={confirm}
                      loading={loading}
                      disabled={loading}
                      btn="primary"
                      className={`!bg-red-500 !border-red-500 !w-auto !px-8 ${
                        props.confirmClass || ""
                      }`}
                      onClick={() => {
                        onClick(id);
                      }}
                    />
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
});

// Assign display name for debugging
ActionPopup.displayName = "ActionPopup";

export default ActionPopup;
