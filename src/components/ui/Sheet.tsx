"use client";

import { useEffect } from "react";

export function Sheet({
  open,
  onClose,
  children,
  panelClassName = "",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end md:items-center md:justify-center">
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(9,9,9,0.5)]"
        style={{ animation: "sfFade .2s ease both" }}
      />
      <div
        className={`sheet-panel relative bg-paper w-full md:w-[360px] rounded-t-ui md:rounded-ui px-6 py-5 md:p-6 ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
