import { Suspense } from "react";

const SuspenseWrapper = ({ fallback, children }) => {
  return <Suspense fallback={fallback || <></>}>{children}</Suspense>;
};

export default SuspenseWrapper;
