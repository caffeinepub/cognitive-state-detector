import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { BarChart2, Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSessionHistory } from "../hooks/useQueries";

const SAMPLE_DATA = Array.from({ length: 14 }, (_, i) => ({
  day: format(new Date(Date.now() - (13 - i) * 24 * 3600000), "EEE d"),
  Focus: 55 + Math.round(Math.sin(i * 0.5) * 20 + Math.random() * 10),
  Fatigue: 20 + Math.round(Math.cos(i * 0.4) * 15 + Math.random() * 8),
  Stress: 15 + Math.round(Math.sin(i * 0.7) * 12 + Math.random() * 10),
}));

export default function Analytics() {
  const { data: history = [], isLoading } = useSessionHistory();

  const chartData =
    history.length > 0
      ? history.slice(-14).map((s, i) => ({
          day: format(
            new Date(
              Number(s.timestamp) / 1_000_000 ||
                Date.now() - (14 - i) * 24 * 3600000,
            ),
            "EEE d",
          ),
          Focus: Number(s.focusScore),
          Fatigue: Number(s.fatigueScore),
          Stress: Number(s.stressScore),
        }))
      : SAMPLE_DATA;

  const avgFocus = Math.round(
    chartData.reduce((a, d) => a + d.Focus, 0) / chartData.length,
  );
  const avgFatigue = Math.round(
    chartData.reduce((a, d) => a + d.Fatigue, 0) / chartData.length,
  );
  const avgStress = Math.round(
    chartData.reduce((a, d) => a + d.Stress, 0) / chartData.length,
  );

  const statsCards = [
    {
      label: "Avg Focus",
      value: avgFocus,
      color: "#2F80ED",
      trend: avgFocus > 65 ? "up" : avgFocus < 50 ? "down" : "neutral",
    },
    {
      label: "Avg Fatigue",
      value: avgFatigue,
      color: "#27AE60",
      trend: avgFatigue < 30 ? "up" : avgFatigue > 50 ? "down" : "neutral",
    },
    {
      label: "Avg Stress",
      value: avgStress,
      color: "#F2C94C",
      trend: avgStress < 25 ? "up" : avgStress > 50 ? "down" : "neutral",
    },
    {
      label: "Sessions",
      value: history.length || 14,
      color: "#F2994A",
      trend: "neutral",
    },
  ];

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend === "down")
      return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="p-6 space-y-6" data-ocid="analytics.page">
      <div>
        <h1 className="text-2xl font-bold">Session Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Historical cognitive state trends and session insights
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => i).map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          : statsCards.map((s) => (
              <Card
                key={s.label}
                className="shadow-card"
                data-ocid={`analytics.${s.label.toLowerCase().replace(" ", "_")}.card`}
              >
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground font-medium">
                      {s.label}
                    </span>
                    <TrendIcon trend={s.trend} />
                  </div>
                  <p className="text-3xl font-bold" style={{ color: s.color }}>
                    {s.value}
                    {s.label !== "Sessions" ? "%" : ""}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Weekly trend line chart */}
      <Card className="shadow-card" data-ocid="analytics.trends.card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            2-Week Cognitive Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6EDF3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Focus"
                stroke="#2F80ED"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="Fatigue"
                stroke="#27AE60"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="Stress"
                stroke="#F2C94C"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily avg bar chart */}
      <Card className="shadow-card" data-ocid="analytics.distribution.card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" /> Daily Score
            Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData.slice(-7)} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6EDF3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Focus" fill="#2F80ED" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Fatigue" fill="#27AE60" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Stress" fill="#F2C94C" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
