import ReactDOM from "react-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ToastWrapper = () => {
  return ReactDOM.createPortal(
    <ToastContainer style={{ zIndex: 99999999999 }} />,
    document.body
  );
};

export default ToastWrapper;
