"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "solid" | "glass" | "outline" | "ghost";

const base =
  "h-10 min-w-[116px] px-3 rounded-ui inline-flex items-center justify-center gap-2 text-sm whitespace-nowrap transition-[opacity,transform,background-color,border-color,color] duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  solid: "bg-ink text-paper font-normal hover:opacity-80",
  glass:
    "bg-[rgba(9,9,9,0.5)] backdrop-blur-[20px] text-paper font-normal hover:opacity-80",
  outline:
    "border border-ink-10 bg-paper-50 backdrop-blur-[20px] text-ink-50 hover:border-ink-25",
  ghost: "text-ink-50 hover:opacity-60",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "solid", fullWidth, className = "", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      // `basis-auto` matters: plain `flex-1` sets flex-basis:0, which in the
      // cart's `flex-col` action column overrides h-10 and collapses the button
      // to its text height. With an auto basis the height holds at 40px in a
      // column while the button still absorbs the free width in a row.
      className={`${base} ${variants[variant]} ${fullWidth ? "flex-1 basis-auto w-full" : "flex-none"} ${className}`}
      {...props}
    />
  );
});
