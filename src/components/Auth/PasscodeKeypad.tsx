"use client";

import { Delete } from "lucide-react";
import React from "react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function PasscodeKeypad({
  length = 4,
  disabled = false,
  error = "",
  resetSignal = 0,
  onComplete,
  onCancel,
}: {
  length?: number;
  disabled?: boolean;
  error?: string;
  /** Энэ тоо өөрчлөгдөхөд оруулсан кодыг цэвэрлэнэ */
  resetSignal?: number;
  onComplete: (code: string) => void;
  /** Escape дархад (жишээ нь имэйл/нууц үгээр буцах) */
  onCancel?: () => void;
}) {
  const [code, setCode] = React.useState("");
  const codeRef = React.useRef(code);
  const onCompleteRef = React.useRef(onComplete);
  const onCancelRef = React.useRef(onCancel);

  React.useEffect(() => {
    codeRef.current = code;
  }, [code]);

  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  React.useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  React.useEffect(() => {
    setCode("");
  }, [resetSignal]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onCancelRef.current?.();
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        setCode((current) => current.slice(0, -1));
        return;
      }

      if (event.key === "Enter") {
        const current = codeRef.current;
        if (current.length === length) {
          event.preventDefault();
          onCompleteRef.current(current);
        }
        return;
      }

      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        setCode((current) => {
          if (current.length >= length) return current;
          const next = current + event.key;
          if (next.length === length) {
            onCompleteRef.current(next);
          }
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, length]);

  const press = (digit: string) => {
    if (disabled || code.length >= length) return;
    const next = code + digit;
    setCode(next);
    if (next.length === length) {
      onComplete(next);
    }
  };

  const backspace = () => {
    if (disabled) return;
    setCode((c) => c.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-3">
        {Array.from({ length }).map((_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border transition ${
              i < code.length
                ? error
                  ? "border-red-500 bg-red-500"
                  : "border-orange-500 bg-orange-500"
                : "border-zinc-300 bg-transparent"
            }`}
          />
        ))}
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => press(k)}
            className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-200 bg-white text-2xl font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 active:scale-95 disabled:opacity-50"
          >
            {k}
          </button>
        ))}
        <span />
        <button
          type="button"
          disabled={disabled}
          onClick={() => press("0")}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-200 bg-white text-2xl font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 active:scale-95 disabled:opacity-50"
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled || code.length === 0}
          onClick={backspace}
          className="flex h-16 w-16 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 active:scale-95 disabled:opacity-30"
          aria-label="Устгах"
        >
          <Delete className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
