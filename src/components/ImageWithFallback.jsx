import { useState, useEffect } from "react";
import FallBackAvatar from "assets/images/avatar.png";
import { formatImageUrl } from "global/helper";

const ImageWithFallback = ({
  src,
  alt = "Rafeeqi Admin",
  className = "",
  isSimple,
  fontSize = 0.43,
  bold = false,
  fallbackSrc = `https://ui-avatars.com/api/?name=${alt}&length=${
    alt?.split(" ")?.length
  }&color=#9ad9cd&background=f0ebfa&font-size=${fontSize}&bold=${bold}`,
  ...props
}) => {
  // const [imgSrc, setImgSrc] = useState(fallbackSrc);
  const [imgSrc, setImgSrc] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPdf, setIsPdf] = useState(false); // ✅ new state

  useEffect(() => {
    if (src && formatImageUrl(src)) {
      setIsLoading(true);
      const formattedSrc = formatImageUrl(src);
      const ext = formattedSrc.split(".").pop()?.toLowerCase();
      setIsPdf(ext === "pdf");
      setImgSrc(formattedSrc);
    } else {
      setImgSrc(isSimple ? FallBackAvatar : fallbackSrc);
      setIsPdf(false);
    }
  }, [src, isSimple, fallbackSrc]);

  const handleError = () => {
    setImgSrc(isSimple ? FallBackAvatar : fallbackSrc);
    setIsPdf(false);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={` relative ${isLoading ? `${className}` : ""}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {isPdf ? (
        <iframe
          src={`${imgSrc}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&view=FitH&docId=456`}
          title="PDF Preview"
          className={`${className} border rounded-md`}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      ) : (
        <img
          src={imgSrc}
          alt={alt}
          className={`${className}`}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
};

export default ImageWithFallback;
