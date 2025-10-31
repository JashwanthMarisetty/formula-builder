import React, { useEffect, useMemo, useRef } from "react";

// Simple, beginner‑friendly OTP inputs (shadcn-like API)
// Usage:
// <InputOTP maxLength={6} value={value} onChange={setValue}>
//   <InputOTPGroup>
//     <InputOTPSlot index={0} /> ...
//   </InputOTPGroup>
// </InputOTP>

const OTPContext = React.createContext(null);

export function InputOTP({ maxLength = 6, value = "", onChange, children }) {
  const inputsRef = useRef([]);

  const ctx = useMemo(() => ({ maxLength, value, onChange, inputsRef }), [maxLength, value, onChange]);

  // Keep length within bounds
  useEffect(() => {
    if (typeof value === "string" && value.length > maxLength) onChange?.(value.slice(0, maxLength));
  }, [value, maxLength, onChange]);

  return (
    <OTPContext.Provider value={ctx}>
      <div className="flex flex-col items-center gap-2">{children}</div>
    </OTPContext.Provider>
  );
}

export function InputOTPGroup({ children }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

export function InputOTPSlot({ index }) {
  const { maxLength, value, onChange, inputsRef } = React.useContext(OTPContext);
  const char = value?.[index] ?? "";
  const ref = useRef(null);

  useEffect(() => {
    inputsRef.current[index] = ref.current;
    return () => (inputsRef.current[index] = null);
  }, [index, inputsRef]);

  const handleChange = (e) => {
    const onlyDigits = e.target.value.replace(/\D/g, "");
    const next = (value || "").split("");
    next[index] = onlyDigits.slice(-1) || "";
    const filled = next.join("");
    onChange?.(filled);
    if (onlyDigits) {
      const nextIndex = Math.min(index + 1, maxLength - 1);
      if (nextIndex !== index) inputsRef.current[nextIndex]?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace") {
      if (!char) {
        const prevIndex = Math.max(index - 1, 0);
        inputsRef.current[prevIndex]?.focus();
      }
      const next = (value || "").split("");
      next[index] = "";
      onChange?.(next.join("") || "");
      e.preventDefault();
    }
    if (e.key === "ArrowLeft") {
      inputsRef.current[Math.max(index - 1, 0)]?.focus();
      e.preventDefault();
    }
    if (e.key === "ArrowRight") {
      inputsRef.current[Math.min(index + 1, maxLength - 1)]?.focus();
      e.preventDefault();
    }
  };

  return (
    <input
      ref={ref}
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={1}
      value={char}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className="w-10 h-12 text-center text-lg rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
      aria-label={`OTP ${index + 1}`}
    />
  );
}
