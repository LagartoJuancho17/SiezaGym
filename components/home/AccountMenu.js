"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { logout } from "@/app/dashboard/actions";

export default function AccountMenu({ initial, photoURL, email, size = "default" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const isSmall = size === "sm";

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        aria-label="Cuenta"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-center overflow-hidden rounded-full border border-hair bg-glass font-semibold text-muted transition hover:border-teal2 hover:text-text ${
          isSmall ? "h-9 w-9 text-xs" : "h-[46px] w-[46px] text-[13.5px]"
        }`}
      >
        {photoURL ? (
          <Image
            src={photoURL}
            alt=""
            width={isSmall ? 36 : 46}
            height={isSmall ? 36 : 46}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          initial
        )}
      </button>

      {open ? (
        <div
          className={`absolute right-0 z-50 w-56 overflow-hidden rounded-[18px] border border-hair bg-deep shadow-[0_16px_40px_rgba(0,0,0,0.45)] ${
            isSmall ? "top-[44px]" : "top-[54px]"
          }`}
        >
          {email ? (
            <p className="truncate border-b border-hair px-4 py-3 text-xs text-muted">
              {email}
            </p>
          ) : null}
          <form action={logout}>
            <button
              type="submit"
              className="flex h-11 w-full items-center gap-2.5 px-4 text-left text-sm font-medium text-text transition hover:bg-glass2"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-faint"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              Cerrar sesión
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
