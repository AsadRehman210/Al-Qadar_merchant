import React from "react";

const PdfCard = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border bg-white text-black shadow-sm ${className}`}
    {...props}
  />
));
PdfCard.displayName = "PdfCard";

const PdfCardHeader = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 p-6 ${className}`}
    {...props}
  />
));
PdfCardHeader.displayName = "PdfCardHeader";

const PdfCardTitle = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
));
PdfCardTitle.displayName = "PdfCardTitle";

const PdfCardDescription = React.forwardRef(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`text-sm text-gray-500 ${className}`}
      {...props}
    />
  )
);
PdfCardDescription.displayName = "PdfCardDescription";

const PdfCardContent = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
));
PdfCardContent.displayName = "PdfCardContent";

const PdfCardFooter = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center p-6 pt-0 ${className}`}
    {...props}
  />
));
PdfCardFooter.displayName = "PdfCardFooter";

export {
  PdfCard,
  PdfCardHeader,
  PdfCardFooter,
  PdfCardTitle,
  PdfCardDescription,
  PdfCardContent,
};
