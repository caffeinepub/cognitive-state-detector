import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Coffee,
  RefreshCw,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCognitiveTracking } from "../hooks/useCognitiveTracking";
import {
  useAlerts,
  useCalibrationProfile,
  useSessionHistory,
} from "../hooks/useQueries";

const STATE_COLORS = {
  Focused: "#2F80ED",
  Fatigued: "#27AE60",
  Stressed: "#F2C94C",
  Neutral: "#9CA3AF",
};

function SemiGauge({ value, state }: { value: number; state: string }) {
  const color = STATE_COLORS[state as keyof typeof STATE_COLORS] ?? "#9CA3AF";
  const data = [
    { value, fill: color },
    { value: 100 - value, fill: "#E6EDF3" },
  ];
  return (
    <div className="relative flex flex-col items-center">
      <PieChart width={200} height={120}>
        <Pie
          data={data}
          cx={100}
          cy={110}
          startAngle={180}
          endAngle={0}
          innerRadius={60}
          outerRadius={85}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry) => (
            <Cell key={entry.fill} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
      <div className="absolute bottom-0 text-center">
        <div className="text-3xl font-bold" style={{ color }}>
          {value}%
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart
        data={chartData}
        margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
      >
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          fill={color}
          fillOpacity={0.15}
          strokeWidth={1.5}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function WeeklyTrends({
  history,
}: {
  history: Array<{
    focusScore: bigint;
    fatigueScore: bigint;
    stressScore: bigint;
    timestamp: bigint;
  }>;
}) {
  // Generate sample data or use real history
  const data =
    history.length > 0
      ? history.slice(-14).map((s, i) => ({
          day: `Day ${i + 1}`,
          Focus: Number(s.focusScore),
          Fatigue: Number(s.fatigueScore),
          Stress: Number(s.stressScore),
        }))
      : Array.from({ length: 7 }, (_, i) => ({
          day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
          Focus: 60 + Math.round(Math.random() * 25),
          Fatigue: 15 + Math.round(Math.random() * 30),
          Stress: 10 + Math.round(Math.random() * 25),
        }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6EDF3" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="Focus"
          stroke="#2F80ED"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="Fatigue"
          stroke="#27AE60"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="Stress"
          stroke="#F2C94C"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const { cogState, history } = useCognitiveTracking(true);
  const { data: calibration } = useCalibrationProfile();
  const { data: sessionHistory = [] } = useSessionHistory();
  const { data: alerts = [] } = useAlerts();
  const router = useRouter();

  const now = new Date();
  const timeStr = format(now, "EEE, MMM d yyyy · h:mm a");

  const stateColor = STATE_COLORS[cogState.dominantState];

  const recentAlerts = alerts.slice(0, 5);
  const sampleAlerts = [
    {
      alertType: "stress",
      message: "Elevated stress detected during afternoon session",
      timestamp: BigInt(Date.now() - 3600000),
      severity: BigInt(2),
    },
    {
      alertType: "fatigue",
      message: "Fatigue levels rising — consider a 5-minute break",
      timestamp: BigInt(Date.now() - 7200000),
      severity: BigInt(2),
    },
    {
      alertType: "focus",
      message: "Peak focus window detected",
      timestamp: BigInt(Date.now() - 14400000),
      severity: BigInt(1),
    },
  ];
  const displayAlerts = recentAlerts.length > 0 ? recentAlerts : sampleAlerts;

  return (
    <div className="p-6 space-y-6" data-ocid="dashboard.page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time cognitive state monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {timeStr}
          </span>
          <button
            type="button"
            className="relative"
            data-ocid="dashboard.notifications.button"
          >
            <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive" />
            )}
          </button>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
              JD
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Row 1: Live State + Behavioral Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Cognitive State */}
        <Card
          className="shadow-card border-border"
          data-ocid="dashboard.live_state.card"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live Cognitive State
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-2">
              <p className="text-sm text-muted-foreground mb-1">
                Current Cognitive State:
              </p>
              <p className="text-2xl font-bold" style={{ color: stateColor }}>
                {cogState.dominantState}
              </p>
            </div>
            <SemiGauge
              value={cogState.dominantValue}
              state={cogState.dominantState}
            />
            {/* State chips */}
            <div className="flex justify-center gap-3 mt-3">
              <Badge
                variant="outline"
                className="text-xs gap-1.5"
                style={{ borderColor: "#2F80ED", color: "#2F80ED" }}
              >
                Focus {cogState.focus}%
              </Badge>
              <Badge
                variant="outline"
                className="text-xs gap-1.5"
                style={{ borderColor: "#27AE60", color: "#27AE60" }}
              >
                Fatigue {cogState.fatigue}%
              </Badge>
              <Badge
                variant="outline"
                className="text-xs gap-1.5"
                style={{ borderColor: "#F2C94C", color: "#a0870f" }}
              >
                Stress {cogState.stress}%
              </Badge>
            </div>
            <div className="flex gap-3 mt-5">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => router.navigate({ to: "/calibration" })}
                data-ocid="dashboard.calibrate.button"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Calibrate Again
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-primary hover:bg-primary/90"
                data-ocid="dashboard.break.button"
              >
                <Coffee className="w-3.5 h-3.5 mr-1.5" /> Take a Break
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Behavioral Signals */}
        <Card
          className="shadow-card border-border"
          data-ocid="dashboard.signals.card"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Real-time Behavioral Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Typing Patterns
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {history.typing[history.typing.length - 1]?.toFixed(0)} WPM
                </span>
              </div>
              <Sparkline data={history.typing} color="#2F80ED" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Mouse Movement
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {history.mouse[history.mouse.length - 1]?.toFixed(0)} px/s
                </span>
              </div>
              <Sparkline data={history.mouse} color="#27AE60" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Click Timing
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {history.clicks[history.clicks.length - 1]?.toFixed(1)} /s
                </span>
              </div>
              <Sparkline data={history.clicks} color="#F2994A" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Weekly Trends */}
      <Card
        className="shadow-card border-border"
        data-ocid="dashboard.trends.card"
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Weekly Cognitive Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyTrends history={sessionHistory} />
        </CardContent>
      </Card>

      {/* Row 3: Calibration + Explanation + Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calibration */}
        <Card
          className="shadow-card border-border"
          data-ocid="dashboard.calibration.card"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Current Calibration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-3">
              <PieChart width={100} height={100}>
                <Pie
                  data={[
                    {
                      value: calibration?.calibrationAccuracy ?? 82,
                      fill: "#2F80ED",
                    },
                    {
                      value: 100 - (calibration?.calibrationAccuracy ?? 82),
                      fill: "#E6EDF3",
                    },
                  ]}
                  cx={50}
                  cy={50}
                  innerRadius={32}
                  outerRadius={45}
                  dataKey="value"
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill="#2F80ED" />
                  <Cell fill="#E6EDF3" />
                </Pie>
              </PieChart>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {calibration?.calibrationAccuracy ?? 82}%
                </p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <Badge
                variant="outline"
                className="text-xs border-success text-success"
              >
                <CheckCircle className="w-3 h-3 mr-1" /> Calibrated
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* State Explanation */}
        <Card
          className="shadow-card border-border"
          data-ocid="dashboard.explanation.card"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              State Explanation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your current{" "}
              <strong className="text-foreground">
                {cogState.dominantState}
              </strong>{" "}
              state is determined by analyzing:
            </p>
            <ul className="mt-3 space-y-2">
              <li className="text-xs flex items-start gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: "#2F80ED" }}
                />
                <span>
                  <strong>Typing rhythm</strong> — consistent keystrokes
                  indicate concentration
                </span>
              </li>
              <li className="text-xs flex items-start gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: "#27AE60" }}
                />
                <span>
                  <strong>Mouse fluidity</strong> — smooth movements correlate
                  with calm focus
                </span>
              </li>
              <li className="text-xs flex items-start gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: "#F2C94C" }}
                />
                <span>
                  <strong>Interaction pace</strong> — click frequency reveals
                  task engagement
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card
          className="shadow-card border-border"
          data-ocid="dashboard.alerts.card"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {displayAlerts.slice(0, 3).map((alert, i) => (
                <div
                  key={alert.message}
                  className="flex items-start gap-2"
                  data-ocid={`alerts.item.${i + 1}`}
                >
                  <AlertTriangle
                    className="w-3.5 h-3.5 mt-0.5 shrink-0"
                    style={{
                      color:
                        Number(alert.severity) >= 3
                          ? "#EF4444"
                          : Number(alert.severity) === 2
                            ? "#F2C94C"
                            : "#27AE60",
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-foreground leading-snug truncate">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(
                        new Date(
                          Number(alert.timestamp) / 1_000_000 ||
                            Number(alert.timestamp),
                        ),
                        "h:mm a",
                      )}
                    </p>
                  </div>
                </div>
              ))}
              {displayAlerts.length === 0 && (
                <p
                  className="text-xs text-muted-foreground text-center py-4"
                  data-ocid="alerts.empty_state"
                >
                  No alerts yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-border pt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          🔒 <strong>Privacy-first:</strong> All behavioral data is processed
          locally in your browser. Nothing is transmitted without your consent.
        </p>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
