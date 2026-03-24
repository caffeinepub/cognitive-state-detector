import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccessibility } from "../context/AccessibilityContext";

interface GazeDwellButtonProps {
  children: React.ReactNode;
  onDwell: () => void;
  dwellDuration?: number;
  className?: string;
  "data-ocid"?: string;
}

export default function GazeDwellButton({
  children,
  onDwell,
  dwellDuration = 2000,
  className,
  "data-ocid": dataOcid,
}: GazeDwellButtonProps) {
  const { eyeGazeMode } = useAccessibility();
  const [progress, setProgress] = useState(0);
  const dwellStartRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const firedRef = useRef(false);

  const startDwell = useCallback(() => {
    if (dwellStartRef.current !== null) return;
    dwellStartRef.current = Date.now();
    firedRef.current = false;
    const tick = () => {
      if (dwellStartRef.current === null) return;
      const elapsed = Date.now() - dwellStartRef.current;
      const p = Math.min(100, (elapsed / dwellDuration) * 100);
      setProgress(p);
      if (p < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else if (!firedRef.current) {
        firedRef.current = true;
        onDwell();
        dwellStartRef.current = null;
        setProgress(0);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [dwellDuration, onDwell]);

  const stopDwell = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    dwellStartRef.current = null;
    setProgress(0);
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const circumference = 2 * Math.PI * 20;
  const dashOffset = circumference * (1 - progress / 100);

  if (!eyeGazeMode) {
    return (
      <button
        type="button"
        className={className}
        onClick={onDwell}
        data-ocid={dataOcid}
        data-gaze-target="true"
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      onMouseEnter={startDwell}
      onMouseLeave={stopDwell}
      onFocus={startDwell}
      onBlur={stopDwell}
      onClick={onDwell}
      data-ocid={dataOcid}
      data-gaze-target="true"
      aria-label={`Gaze for ${Math.round(dwellDuration / 1000)} seconds to activate`}
    >
      {progress > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="rgba(59,130,246,0.2)"
            strokeWidth="4"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="rgba(59,130,246,0.85)"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 24 24)"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
