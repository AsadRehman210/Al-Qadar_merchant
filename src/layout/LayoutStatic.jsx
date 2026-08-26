import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { showToken } from "store/slices/uniqueSlice";
import { useSelector } from "react-redux";

const LayoutStatic = () => {
  const navigate = useNavigate();
  const token = useSelector(showToken);

  // handle user login
  useEffect(() => {
    if (token) {
      navigate("/dashboard");
    }
  }, []);

  // Prevent layout render if there's a token
  if (token) return null;

  return <Outlet />;
};

export default LayoutStatic;
