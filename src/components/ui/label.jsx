import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * @typedef {import('react').ComponentPropsWithoutRef<typeof LabelPrimitive.Root>} LabelProps
 */

// Matches FormInput's own label exactly (text-sm text-linkText font-medium
// leading-6) so a PaginatedSelectBox sits the same distance from its label
// as every other field — the wrapping `space-y-1` (== FormInput's `mb-1`,
// same 0.25rem) only produces the same visual gap once the label's own
// line-height matches too.
const labelVariants = cva(
  "text-sm text-linkText font-medium leading-6 block peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

/** @type {React.ForwardRefExoticComponent<LabelProps & React.RefAttributes<React.ElementRef<typeof LabelPrimitive.Root>>>} */
const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
