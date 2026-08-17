"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "mono text-[12px]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
