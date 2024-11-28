import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Button = forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
        "disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-slate-900 text-white hover:bg-slate-800": variant === "default",
          "bg-red-500 text-white hover:bg-red-600": variant === "destructive",
          "bg-transparent hover:bg-slate-100": variant === "ghost",
          "h-10 px-4 py-2": size === "default",
          "h-9 rounded-md px-3": size === "sm",
          "h-11 rounded-md px-8": size === "lg",
        },
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button };