declare module "@/components/ui/button" {
  import * as React from "react";

  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
  }

  export const Button: React.ForwardRefExoticComponent<
    ButtonProps & React.RefAttributes<HTMLButtonElement>
  >;

  export const buttonVariants: (...args: unknown[]) => string;
}

declare module "@/components/ui/label" {
  import * as React from "react";

  export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

  export const Label: React.ForwardRefExoticComponent<
    LabelProps & React.RefAttributes<HTMLLabelElement>
  >;
}

declare module "@/components/ui/calendar" {
  import * as React from "react";

  export const Calendar: React.ComponentType<Record<string, unknown>>;
}

declare module "@/components/ui/popover" {
  import * as React from "react";

  export const Popover: React.ComponentType<Record<string, unknown>>;
  export const PopoverTrigger: React.ComponentType<Record<string, unknown>>;
  export const PopoverContent: React.ComponentType<Record<string, unknown>>;
}

declare module "@/lib/utils" {
  export function cn(...inputs: unknown[]): string;
}

declare module "@/utils/locales/LanguageContext" {
  export function useTranslations(
    namespace: string,
  ): (key: string) => string | undefined;

  const useTranslationsDefault: typeof useTranslations;
  export default useTranslationsDefault;
}
