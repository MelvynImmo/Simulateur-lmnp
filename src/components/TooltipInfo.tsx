"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TooltipInfoProps = {
  label: string;
  align?: "left" | "right" | "center";
};

type Coordinates = {
  top: number;
  left: number;
};

export default function TooltipInfo({ label, align = "center" }: TooltipInfoProps) {
  const tooltipId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [coords, setCoords] = useState<Coordinates | null>(null);

  const open = hovered || focused || pinned;
  const isBrowser = typeof window !== "undefined";

  const close = useCallback(() => {
    setPinned(false);
    setHovered(false);
    setFocused(false);
  }, []);

  const computePosition = useCallback(() => {
    if (!buttonRef.current || !tooltipRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let left = buttonRect.left + buttonRect.width / 2;
    if (align === "left") {
      left = buttonRect.left;
    } else if (align === "right") {
      left = buttonRect.right - tooltipRect.width;
    } else {
      left = left - tooltipRect.width / 2;
    }

    const margin = 8;
    const minLeft = margin;
    const maxLeft = window.innerWidth - tooltipRect.width - margin;
    left = Math.max(minLeft, Math.min(maxLeft, left));

    let top = buttonRect.top - tooltipRect.height - margin;
    if (top < margin) {
      top = buttonRect.bottom + margin;
    }

    setCoords({ top, left });
  }, [align]);

  useEffect(() => {
    if (!open) return;

    const raf = window.requestAnimationFrame(computePosition);
    window.addEventListener("resize", computePosition);
    window.addEventListener("scroll", computePosition, true);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", computePosition);
      window.removeEventListener("scroll", computePosition, true);
    };
  }, [open, computePosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (buttonRef.current?.contains(target)) return;
      if (tooltipRef.current?.contains(target)) return;
      close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Aide: ${label}`}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setPinned((value) => !value);
        }}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
      >
        i
      </button>
      {isBrowser && open
        ? createPortal(
            <div
              id={tooltipId}
              ref={tooltipRef}
              role="tooltip"
              className="pointer-events-none fixed z-50 max-w-[260px] rounded-lg bg-slate-900 p-2 text-xs text-white shadow"
              style={{
                top: coords ? `${coords.top}px` : "-9999px",
                left: coords ? `${coords.left}px` : "-9999px",
                visibility: coords ? "visible" : "hidden",
              }}
            >
              {label}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
