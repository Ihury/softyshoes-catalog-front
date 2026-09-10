"use client";

import { IconMinus, IconPlus } from "@/components/icons";

export function Stepper({
  value,
  onChange,
  min = 1,
  size = "text-md",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  size?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Diminuir"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-[34px] h-[34px] flex items-center justify-center text-ink-50 transition-[color,transform] duration-150 hover:text-ink active:scale-90"
      >
        <IconMinus />
      </button>
      <span className={`min-w-[22px] text-center font-normal text-ink ${size}`}>{value}</span>
      <button
        type="button"
        aria-label="Aumentar"
        onClick={() => onChange(value + 1)}
        className="w-[34px] h-[34px] flex items-center justify-center text-ink-50 transition-[color,transform] duration-150 hover:text-ink active:scale-90"
      >
        <IconPlus />
      </button>
    </div>
  );
}
