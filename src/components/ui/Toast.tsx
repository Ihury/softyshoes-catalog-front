"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastContextValue = {
  flash: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flash = useCallback((msg: string) => {
    clearTimeout(timer.current);
    setMessage(msg);
    timer.current = setTimeout(() => setMessage(""), 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ flash }}>
      {children}
      {message ? (
        <div
          key={message}
          className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-8 z-40 h-10 flex items-center justify-center text-xs text-ink-50 text-center px-4 pointer-events-none"
          style={{ animation: "sfFade .24s ease both" }}
        >
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
