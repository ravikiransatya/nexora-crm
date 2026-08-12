import { useEffect, useRef, useState } from "react";

interface LivingNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function LivingNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: LivingNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const startValueRef = useRef(value);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = null;
    const duration = 250; // 250ms smooth transition

    let animationFrameId: number;

    const animate = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic formula
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const nextVal = startValueRef.current + (value - startValueRef.current) * easeOut;

      setDisplayValue(nextVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  const formatted =
    prefix +
    (decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toLocaleString("en-IN")) +
    suffix;

  return (
    <span className={`inline-block transition-all duration-150 tabular-nums ${className}`}>
      {formatted}
    </span>
  );
}
