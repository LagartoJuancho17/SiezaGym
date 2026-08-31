"use client";

import { useEffect, useRef, useState } from "react";

export default function Toast({ message, type = "success", onDismiss }) {
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      requestAnimationFrame(() => setVisible(true));
    }

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bgColor =
    type === "error"
      ? "bg-red-500/20 border-red-500/40"
      : "bg-teal/20 border-teal/40";
  const textColor = type === "error" ? "text-red-300" : "text-teal2";

  return (
    <div
      className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div
        className={`flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-medium shadow-lg backdrop-blur-md ${bgColor} ${textColor}`}
      >
        {type === "error" ? (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6" />
            <path d="M9 9l6 6" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
        {message}
      </div>
    </div>
  );
}
