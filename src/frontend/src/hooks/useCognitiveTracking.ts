import { useCallback, useEffect, useRef, useState } from "react";

export interface CognitiveState {
  focus: number;
  fatigue: number;
  stress: number;
  dominantState: "Focused" | "Fatigued" | "Stressed" | "Neutral";
  dominantValue: number;
}

export interface BehavioralSignals {
  typingWpm: number;
  rhythmVariance: number;
  mouseSpeed: number;
  mouseJitter: number;
  clickRate: number;
}

export interface SignalHistory {
  typing: number[];
  mouse: number[];
  clicks: number[];
}

export function useCognitiveTracking(active: boolean) {
  const [signals, setSignals] = useState<BehavioralSignals>({
    typingWpm: 0,
    rhythmVariance: 0,
    mouseSpeed: 0,
    mouseJitter: 0,
    clickRate: 0,
  });
  const [cogState, setCogState] = useState<CognitiveState>({
    focus: 72,
    fatigue: 18,
    stress: 10,
    dominantState: "Focused",
    dominantValue: 72,
  });
  const [history, setHistory] = useState<SignalHistory>({
    typing: Array.from({ length: 20 }, () => Math.random() * 60 + 30),
    mouse: Array.from({ length: 20 }, () => Math.random() * 100 + 50),
    clicks: Array.from({ length: 20 }, () => Math.random() * 3 + 0.5),
  });

  const keyTimesRef = useRef<number[]>([]);
  const wordCountRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const mousePosRef = useRef({ x: 0, y: 0, t: Date.now() });
  const mouseSpeedSamplesRef = useRef<number[]>([]);
  const dirChangesRef = useRef(0);
  const prevDirRef = useRef({ dx: 0, dy: 0 });
  const clickTimesRef = useRef<number[]>([]);

  const computeStdDev = (arr: number[]) => {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
  };

  const computeCogState = useCallback(
    (sig: BehavioralSignals): CognitiveState => {
      const { typingWpm, rhythmVariance, mouseSpeed, mouseJitter } = sig;

      // Normalize signals 0-100
      const wpmNorm = Math.min(typingWpm / 80, 1) * 100;
      const rhythmNorm = Math.min(rhythmVariance / 200, 1) * 100;
      const speedNorm = Math.min(mouseSpeed / 300, 1) * 100;
      const jitterNorm = Math.min(mouseJitter / 5, 1) * 100;

      // Focus: high WPM + low rhythm variance + moderate mouse speed
      const focus = Math.max(
        0,
        Math.min(
          100,
          wpmNorm * 0.5 -
            rhythmNorm * 0.3 +
            (speedNorm > 20 && speedNorm < 80 ? 30 : 0) +
            20,
        ),
      );

      // Fatigue: low WPM + high rhythm variance + slow mouse
      const fatigue = Math.max(
        0,
        Math.min(
          100,
          (100 - wpmNorm) * 0.4 +
            rhythmNorm * 0.3 +
            (speedNorm < 20 ? 20 : 0) +
            10,
        ),
      );

      // Stress: high jitter + fast irregular typing
      const stress = Math.max(
        0,
        Math.min(
          100,
          jitterNorm * 0.5 + rhythmNorm * 0.3 + (wpmNorm > 70 ? 20 : 0),
        ),
      );

      const max = Math.max(focus, fatigue, stress);
      let dominantState: CognitiveState["dominantState"] = "Neutral";
      let dominantValue = max;
      if (max === focus && focus > 40) dominantState = "Focused";
      else if (max === fatigue && fatigue > 40) dominantState = "Fatigued";
      else if (max === stress && stress > 40) dominantState = "Stressed";
      else {
        dominantState = "Neutral";
        dominantValue = 50;
      }

      return {
        focus: Math.round(focus),
        fatigue: Math.round(fatigue),
        stress: Math.round(stress),
        dominantState,
        dominantValue: Math.round(dominantValue),
      };
    },
    [],
  );

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      keyTimesRef.current.push(now);
      if (e.key === " ") wordCountRef.current++;
      // Keep last 50
      if (keyTimesRef.current.length > 50) keyTimesRef.current.shift();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dt = (now - mousePosRef.current.t) / 1000;
      if (dt > 0) {
        const dx = e.clientX - mousePosRef.current.x;
        const dy = e.clientY - mousePosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = dist / dt;
        mouseSpeedSamplesRef.current.push(speed);
        if (mouseSpeedSamplesRef.current.length > 30)
          mouseSpeedSamplesRef.current.shift();

        // Direction change detection
        const prev = prevDirRef.current;
        if (prev.dx !== 0 || prev.dy !== 0) {
          const dot = dx * prev.dx + dy * prev.dy;
          if (dot < 0) dirChangesRef.current++;
        }
        prevDirRef.current = { dx, dy };
      }
      mousePosRef.current = { x: e.clientX, y: e.clientY, t: now };
    };

    const handleClick = () => {
      const now = Date.now();
      clickTimesRef.current.push(now);
      if (clickTimesRef.current.length > 20) clickTimesRef.current.shift();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick);
    };
  }, [active]);

  // Compute signals every 2 seconds
  // biome-ignore lint/correctness/useExhaustiveDependencies: refs are stable
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - sessionStartRef.current) / 60000;
      const wpm = elapsed > 0 ? wordCountRef.current / elapsed : 0;

      const intervals: number[] = [];
      for (let i = 1; i < keyTimesRef.current.length; i++) {
        intervals.push(keyTimesRef.current[i] - keyTimesRef.current[i - 1]);
      }
      const rhythmVariance = computeStdDev(intervals);

      const avgMouseSpeed =
        mouseSpeedSamplesRef.current.length > 0
          ? mouseSpeedSamplesRef.current.reduce((a, b) => a + b, 0) /
            mouseSpeedSamplesRef.current.length
          : 0;

      const elapsed2s = 2;
      const mouseJitter = dirChangesRef.current / elapsed2s;
      dirChangesRef.current = 0;

      const recentClicks = clickTimesRef.current.filter(
        (t) => Date.now() - t < 2000,
      );
      const clickRate = recentClicks.length / 2;

      const newSignals: BehavioralSignals = {
        typingWpm: Math.round(wpm),
        rhythmVariance: Math.round(rhythmVariance),
        mouseSpeed: Math.round(avgMouseSpeed),
        mouseJitter: Number.parseFloat(mouseJitter.toFixed(1)),
        clickRate: Number.parseFloat(clickRate.toFixed(1)),
      };

      setSignals(newSignals);
      setCogState(computeCogState(newSignals));

      setHistory((prev) => ({
        typing: [...prev.typing.slice(1), newSignals.typingWpm],
        mouse: [...prev.mouse.slice(1), newSignals.mouseSpeed],
        clicks: [...prev.clicks.slice(1), newSignals.clickRate],
      }));
    }, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, computeCogState]);

  return { signals, cogState, history };
}
