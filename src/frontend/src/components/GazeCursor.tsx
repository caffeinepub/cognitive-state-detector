import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAccessibility } from "../context/AccessibilityContext";
import { useEyeGaze } from "../hooks/useEyeGaze";

const DWELL_DURATION = 2000;

export default function GazeCursor() {
  const { eyeGazeMode } = useAccessibility();
  const { gazePoint, setGazePoint, isCameraReady, faceDetectorSupported } =
    useEyeGaze(eyeGazeMode);

  const [dwellProgress, setDwellProgress] = useState(0); // 0-100
  const [dwellTarget, setDwellTarget] = useState<Element | null>(null);
  const dwellStartRef = useRef<number | null>(null);
  const dwellRafRef = useRef<number>(0);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: -999, y: -999 });

  // Fallback: track pointer as gaze when FaceDetector not supported
  useEffect(() => {
    if (!eyeGazeMode || faceDetectorSupported) return;
    const handler = (e: PointerEvent) => {
      setGazePoint({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("pointermove", handler);
    return () => window.removeEventListener("pointermove", handler);
  }, [eyeGazeMode, faceDetectorSupported, setGazePoint]);

  // Dwell logic
  useEffect(() => {
    if (!gazePoint) {
      setDwellProgress(0);
      setDwellTarget(null);
      dwellStartRef.current = null;
      return;
    }

    const { x, y } = gazePoint;
    const dx = x - lastPointerRef.current.x;
    const dy = y - lastPointerRef.current.y;
    const moved = Math.sqrt(dx * dx + dy * dy) > 30;

    if (moved) {
      lastPointerRef.current = { x, y };
      dwellStartRef.current = null;
      setDwellProgress(0);
      setDwellTarget(null);
    }

    // Find interactive element under gaze
    const el = document.elementFromPoint(x, y);
    const interactive = el?.closest(
      'button, a, [role="button"], input, select, textarea, [data-gaze-target]',
    );

    if (interactive) {
      if (dwellStartRef.current === null) {
        dwellStartRef.current = Date.now();
        setDwellTarget(interactive);
      }
      cancelAnimationFrame(dwellRafRef.current);
      const tick = () => {
        if (dwellStartRef.current === null) return;
        const elapsed = Date.now() - dwellStartRef.current;
        const progress = Math.min(100, (elapsed / DWELL_DURATION) * 100);
        setDwellProgress(progress);
        if (progress < 100) {
          dwellRafRef.current = requestAnimationFrame(tick);
        } else {
          // Fire click
          if (interactive instanceof HTMLElement) interactive.click();
          dwellStartRef.current = null;
          setDwellProgress(0);
          setDwellTarget(null);
        }
      };
      dwellRafRef.current = requestAnimationFrame(tick);
    } else {
      dwellStartRef.current = null;
      setDwellProgress(0);
      setDwellTarget(null);
      cancelAnimationFrame(dwellRafRef.current);
    }

    return () => cancelAnimationFrame(dwellRafRef.current);
  }, [gazePoint]);

  if (!eyeGazeMode) return null;

  const circumference = 2 * Math.PI * 12;
  const dashOffset = circumference * (1 - dwellProgress / 100);

  return createPortal(
    <>
      {/* Camera status badge */}
      <div
        className="fixed top-4 right-4 z-[9998] flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border shadow-md text-xs font-medium"
        aria-live="polite"
      >
        <span
          className={`w-2 h-2 rounded-full ${isCameraReady ? "bg-green-500" : "bg-yellow-400 animate-pulse"}`}
        />
        {isCameraReady ? "Gaze active" : "Starting camera..."}
        {faceDetectorSupported === false && (
          <span className="ml-1 text-muted-foreground">(pointer fallback)</span>
        )}
      </div>

      {/* Gaze cursor */}
      {gazePoint && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: gazePoint.x - 16,
            top: gazePoint.y - 16,
            transition: "left 80ms linear, top 80ms linear",
          }}
          aria-hidden="true"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            role="img"
            aria-label="Gaze cursor"
          >
            {/* Outer ring */}
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="rgba(59,130,246,0.4)"
              strokeWidth="2"
            />
            {/* Dwell progress ring */}
            {dwellTarget && (
              <circle
                cx="16"
                cy="16"
                r="12"
                fill="none"
                stroke="rgba(59,130,246,0.9)"
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 16 16)"
                style={{ transition: "stroke-dashoffset 50ms linear" }}
              />
            )}
            {/* Center dot */}
            <circle cx="16" cy="16" r="3" fill="rgba(59,130,246,0.8)" />
          </svg>
        </div>
      )}
    </>,
    document.body,
  );
}
