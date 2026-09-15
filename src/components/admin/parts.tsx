"use client";

import { useState, useTransition } from "react";
import { IconChevronDown, IconMinus } from "@/components/icons";

/** Every settings screen is the same page: a title, an optional line of help,
 *  a list of rows and a field that adds one more. */
export function AdminScreen({
  title,
  hint,
  children,
  error,
}: {
  title: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <div className="text-xs md:text-md md:font-normal text-ink-50 md:text-ink">{title}</div>
      {hint ? <div className="mt-1 text-xs text-ink-25 max-w-[520px]">{hint}</div> : null}
      <div className="mt-3 md:mt-6">{children}</div>
      {error ? (
        <div role="alert" className="mt-2 text-xs text-danger" style={{ animation: "sfPop .2s ease both" }}>
          {error}
        </div>
      ) : null}
      <div className="mt-5 md:mt-14 text-xs text-ink-25">Selecionado SOFTY.</div>
    </div>
  );
}

/** Runs a server action and surfaces whatever it rejected, in one place so no
 *  screen swallows an error by forgetting to read it. */
export function useAction() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ error: string | null }>, onDone?: () => void) {
    startTransition(async () => {
      const { error: err } = await fn();
      setError(err ?? "");
      if (!err) onDone?.();
    });
  }

  return { error, setError, pending, run };
}

/** A single-select run of pills — brand, rule, finish, hero mode. */
export function PillGroup({
  options,
  value,
  onChange,
  disabled,
  size = "sm",
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  size?: "sm" | "xs";
}) {
  const height = size === "xs" ? "h-8 min-w-0 px-3 text-xs" : "h-10 min-w-[116px] px-3 text-sm";
  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`${height} rounded-ui flex items-center justify-center transition-[opacity,border-color,transform] active:scale-[.97] disabled:opacity-40 ${
              on
                ? "bg-ink text-paper hover:opacity-80"
                : "bg-paper border border-ink-10 text-ink-50 hover:border-ink-25"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** The add-one-more row every settings screen ends with. */
export function AddRow({
  value,
  onChange,
  onAdd,
  placeholder,
  label,
  pending,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  placeholder: string;
  label: string;
  pending: boolean;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div className="mt-5 md:mt-6 flex gap-3">
      <input
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="flex-1 min-w-0 h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
      />
      <button
        type="button"
        disabled={pending}
        onClick={onAdd}
        className="flex-none h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm font-normal transition-opacity hover:opacity-80 active:scale-[.97] disabled:opacity-40"
      >
        {label}
      </button>
    </div>
  );
}

/** Stacked chevrons, rotated rather than two more glyphs. */
export function MoveColumn({
  name,
  first,
  last,
  disabled,
  onUp,
  onDown,
}: {
  name: string;
  first: boolean;
  last: boolean;
  disabled: boolean;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <div className="flex-none flex flex-col">
      <button
        type="button"
        aria-label={`Subir ${name}`}
        disabled={first || disabled}
        onClick={onUp}
        className="w-6 h-5 flex items-center justify-center text-ink-25 transition-opacity hover:opacity-60 disabled:opacity-30"
      >
        <span className="rotate-180 flex">
          <IconChevronDown />
        </span>
      </button>
      <button
        type="button"
        aria-label={`Descer ${name}`}
        disabled={last || disabled}
        onClick={onDown}
        className="w-6 h-5 flex items-center justify-center text-ink-25 transition-opacity hover:opacity-60 disabled:opacity-30"
      >
        <IconChevronDown />
      </button>
    </div>
  );
}

export function RemoveButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex-none w-[34px] h-[34px] flex items-center justify-center text-ink-25 transition-opacity hover:opacity-60 disabled:opacity-30"
    >
      <IconMinus />
    </button>
  );
}

/** A name that turns into a field when clicked, and saves on Enter. */
export function InlineName({
  value,
  editing,
  onEdit,
  onChange,
  onSave,
  onCancel,
}: {
  value: string;
  editing: boolean;
  onEdit: () => void;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (!editing) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="text-left text-sm font-normal text-ink whitespace-nowrap overflow-hidden text-ellipsis transition-opacity hover:opacity-60"
      >
        {value}
      </button>
    );
  }
  return (
    <input
      value={value}
      autoFocus
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSave();
        if (e.key === "Escape") onCancel();
      }}
      onBlur={onSave}
      aria-label="Renomear"
      className="h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
    />
  );
}
