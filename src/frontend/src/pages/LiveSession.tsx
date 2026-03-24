import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Brain, Keyboard, Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useCognitiveTracking } from "../hooks/useCognitiveTracking";
import { useAddAlert, useRecordSnapshot } from "../hooks/useQueries";

const MAX_HISTORY = 30;

interface DataPoint {
  t: number;
  Focus: number;
  Fatigue: number;
  Stress: number;
}

export default function LiveSession() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [liveChart, setLiveChart] = useState<DataPoint[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const snapshotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { cogState, signals } = useCognitiveTracking(running);
  const { mutate: recordSnapshot } = useRecordSnapshot();
  const { mutate: addAlert } = useAddAlert();

  const alerted = useRef({ stress: false, fatigue: false });
  const prevState = useRef({ focus: 0, fatigue: 0, stress: 0 });

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setLiveChart((prev) => {
        const next = [
          ...prev,
          {
            t: Date.now(),
            Focus: cogState.focus,
            Fatigue: cogState.fatigue,
            Stress: cogState.stress,
          },
        ];
        return next.slice(-MAX_HISTORY);
      });
      // Announce significant changes for screen readers
      const prev = prevState.current;
      if (Math.abs(cogState.stress - prev.stress) >= 10) {
        setAnnouncement(`Stress level changed to ${cogState.stress}%`);
      } else if (Math.abs(cogState.focus - prev.focus) >= 10) {
        setAnnouncement(`Focus level changed to ${cogState.focus}%`);
      }
      prevState.current = {
        focus: cogState.focus,
        fatigue: cogState.fatigue,
        stress: cogState.stress,
      };
    }, 2000);
    return () => clearInterval(interval);
  }, [running, cogState]);

  // Record snapshot every 60s
  useEffect(() => {
    if (!running) return;
    snapshotTimerRef.current = setInterval(() => {
      recordSnapshot({
        focus: cogState.focus,
        fatigue: cogState.fatigue,
        stress: cogState.stress,
      });
    }, 60000);
    return () => {
      if (snapshotTimerRef.current) clearInterval(snapshotTimerRef.current);
    };
  }, [running, cogState, recordSnapshot]);

  // Alert thresholds
  useEffect(() => {
    if (!running) return;
    if (cogState.stress > 70 && !alerted.current.stress) {
      addAlert({
        alertType: "stress",
        message: "High stress level detected!",
        severity: 3,
      });
      toast.error("⚠️ High stress detected. Consider taking a break.");
      alerted.current.stress = true;
    }
    if (cogState.fatigue > 70 && !alerted.current.fatigue) {
      addAlert({
        alertType: "fatigue",
        message: "High fatigue level detected!",
        severity: 3,
      });
      toast.warning("😴 High fatigue detected. Rest recommended.");
      alerted.current.fatigue = true;
    }
    if (cogState.stress <= 50) alerted.current.stress = false;
    if (cogState.fatigue <= 50) alerted.current.fatigue = false;
  }, [running, cogState, addAlert]);

  // Keyboard shortcut: S to start/stop
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        if (running) handleStop();
        else handleStart();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [running]);

  const handleStart = () => {
    setElapsed(0);
    setLiveChart([]);
    alerted.current = { stress: false, fatigue: false };
    setRunning(true);
    setAnnouncement("Session started. Behavioral tracking is active.");
    toast.success("Session started — behavioral tracking is active");
  };

  const handleStop = () => {
    setRunning(false);
    recordSnapshot({
      focus: cogState.focus,
      fatigue: cogState.fatigue,
      stress: cogState.stress,
    });
    setAnnouncement("Session stopped and saved.");
    toast.success("Session saved.");
  };

  const formatElapsed = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const chartData = liveChart.map((d, i) => ({ ...d, label: `${i * 2}s` }));

  return (
    <div className="p-6 space-y-6" data-ocid="live_session.page">
      {/* Screen reader live region for cognitive state announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Keyboard accessibility hint banner (shown when idle) */}
      {!running && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-accent/50 border border-accent text-sm"
          data-ocid="live_session.keyboard_hint.panel"
        >
          <Keyboard
            className="w-4 h-4 text-primary shrink-0"
            aria-hidden="true"
          />
          <span className="text-muted-foreground">
            <strong className="text-foreground">Keyboard accessible:</strong>{" "}
            Use{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-mono">
              Tab
            </kbd>{" "}
            to navigate,{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-mono">
              Space
            </kbd>
            /
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-mono">
              Enter
            </kbd>{" "}
            to activate buttons,{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-mono">
              S
            </kbd>{" "}
            to start session
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Session</h1>
          <p className="text-sm text-muted-foreground">
            Real-time behavioral signal tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          {running && (
            <output
              aria-label={`Session time: ${formatElapsed(elapsed)}`}
              className="flex items-center gap-2 text-sm font-mono text-muted-foreground"
            >
              <span
                className="w-2 h-2 rounded-full bg-destructive animate-pulse"
                aria-hidden="true"
              />
              {formatElapsed(elapsed)}
            </output>
          )}
          {!running ? (
            <Button
              onClick={handleStart}
              className="bg-primary"
              aria-label="Start Session (press S)"
              data-ocid="live_session.start.button"
            >
              <Play className="w-4 h-4 mr-2" aria-hidden="true" /> Start Session
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleStop}
              aria-label="Stop Session (press S)"
              data-ocid="live_session.stop.button"
            >
              <Square className="w-4 h-4 mr-2" aria-hidden="true" /> Stop
              Session
            </Button>
          )}
        </div>
      </div>

      {!running && liveChart.length === 0 && (
        <Card
          className="shadow-card border-dashed"
          data-ocid="live_session.idle.card"
        >
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Brain
              className="w-12 h-12 text-muted-foreground/40"
              aria-hidden="true"
            />
            <p className="text-muted-foreground text-center max-w-sm">
              Start a session to begin tracking your cognitive state in
              real-time using behavioral signals.
            </p>
            <Button
              onClick={handleStart}
              className="bg-primary"
              aria-label="Begin Tracking — Start cognitive state session"
              data-ocid="live_session.start_idle.button"
            >
              <Play className="w-4 h-4 mr-2" aria-hidden="true" /> Begin
              Tracking
            </Button>
          </CardContent>
        </Card>
      )}

      {(running || liveChart.length > 0) && (
        <>
          {/* Score cards */}
          <div className="grid grid-cols-3 gap-4">
            {(
              [
                { label: "Focus", value: cogState.focus, color: "#2F80ED" },
                { label: "Fatigue", value: cogState.fatigue, color: "#27AE60" },
                { label: "Stress", value: cogState.stress, color: "#F2C94C" },
              ] as const
            ).map((item) => (
              <Card
                key={item.label}
                className="shadow-card"
                aria-label={`${item.label}: ${item.value}%`}
                data-ocid={`live_session.${item.label.toLowerCase()}.card`}
              >
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {item.label}
                    </span>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: item.color }}
                    >
                      {item.value}%
                    </span>
                  </div>
                  <Progress
                    value={item.value}
                    className="h-2"
                    aria-label={`${item.label}: ${item.value}%`}
                    style={
                      { "--progress-color": item.color } as React.CSSProperties
                    }
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Signals detail */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Typing Speed",
                value: `${signals.typingWpm} WPM`,
                icon: Activity,
              },
              {
                label: "Mouse Speed",
                value: `${signals.mouseSpeed} px/s`,
                icon: Activity,
              },
              {
                label: "Mouse Jitter",
                value: `${signals.mouseJitter}/s`,
                icon: Activity,
              },
              {
                label: "Click Rate",
                value: `${signals.clickRate}/s`,
                icon: Activity,
              },
            ].map((s) => (
              <Card
                key={s.label}
                className="shadow-card"
                aria-label={`${s.label}: ${s.value}`}
              >
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold mt-1">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Live chart */}
          <Card className="shadow-card" data-ocid="live_session.chart.card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full bg-primary animate-pulse"
                  aria-hidden="true"
                />
                Live Cognitive Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length < 2 ? (
                <output
                  className="h-48 flex items-center justify-center text-muted-foreground text-sm"
                  data-ocid="live_session.chart.loading_state"
                >
                  Collecting data...
                </output>
              ) : (
                <div
                  role="img"
                  aria-label="Live cognitive scores area chart showing Focus, Fatigue and Stress over time"
                >
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E6EDF3" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="Focus"
                        stroke="#2F80ED"
                        fill="#2F80ED"
                        fillOpacity={0.1}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="Fatigue"
                        stroke="#27AE60"
                        fill="#27AE60"
                        fillOpacity={0.1}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="Stress"
                        stroke="#F2C94C"
                        fill="#F2C94C"
                        fillOpacity={0.1}
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="bg-muted/50 rounded-lg px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
            🔒 All data is processed locally. Snapshots are saved to your
            personal canister every 60 seconds.
          </div>
        </>
      )}
    </div>
  );
}
