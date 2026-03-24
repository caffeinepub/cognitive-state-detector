import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  AlertTriangle,
  Brain,
  Eye,
  Keyboard,
  MousePointer,
  Shield,
} from "lucide-react";

const STATES = [
  {
    name: "Focused",
    color: "#2F80ED",
    bg: "#EFF6FF",
    description:
      "High concentration and cognitive engagement. You&apos;re in the zone — ideas flow smoothly and tasks complete efficiently.",
    signals: [
      "Consistent typing rhythm with high WPM",
      "Smooth, purposeful mouse movements",
      "Moderate click rate — deliberate interactions",
    ],
    thresholds: "Focus score > 65%",
  },
  {
    name: "Fatigued",
    color: "#27AE60",
    bg: "#ECFDF5",
    description:
      "Mental tiredness from sustained cognitive effort. Reaction times slow, mistakes increase, and motivation dips.",
    signals: [
      "Declining WPM with erratic rhythm variance",
      "Sluggish or absent mouse movement",
      "Increased time between actions",
    ],
    thresholds: "Fatigue score > 65%",
  },
  {
    name: "Stressed",
    color: "#F2994A",
    bg: "#FFF7ED",
    description:
      "Heightened arousal and tension. Mouse movements become erratic, typing is rushed and irregular.",
    signals: [
      "High mouse jitter — rapid direction changes",
      "Fast but irregular typing patterns",
      "Elevated click rate",
    ],
    thresholds: "Stress score > 65%",
  },
];

const SIGNALS = [
  {
    icon: Keyboard,
    name: "Typing Patterns",
    color: "#2F80ED",
    description:
      "We measure your Words Per Minute (WPM) and the variance between keystrokes. Consistent rhythm with good speed = focused; erratic intervals = stress or fatigue.",
    metrics: [
      "Words Per Minute (WPM)",
      "Inter-key interval standard deviation",
      "Rhythm consistency score",
    ],
  },
  {
    icon: MousePointer,
    name: "Mouse Movement",
    color: "#27AE60",
    description:
      "Mouse speed and direction changes reveal cognitive state. Smooth, purposeful movement = calm focus; jittery back-and-forth = stress; minimal movement = fatigue.",
    metrics: [
      "Movement speed (px/second)",
      "Direction change frequency (jitter)",
      "Idle detection periods",
    ],
  },
  {
    icon: Activity,
    name: "Click Timing",
    color: "#F2994A",
    description:
      "Click frequency and timing patterns reflect task engagement. Deliberate, spaced clicks = focused work; rapid clicking = stress or frustration.",
    metrics: [
      "Clicks per second",
      "Click inter-arrival time",
      "Double-click frequency",
    ],
  },
];

const ALGO_STEPS = [
  {
    step: "1",
    title: "Signal Collection",
    desc: "Browser event listeners capture keyboard and mouse events in real-time at the OS level — no screenshots or content access.",
  },
  {
    step: "2",
    title: "Feature Extraction",
    desc: "Raw events are converted into numeric features: WPM from keystroke counts, speed from Euclidean distances, jitter from dot-product direction comparisons.",
  },
  {
    step: "3",
    title: "Score Computation",
    desc: "A linear combination formula weighs each feature. Focus = 0.5×WPM + 0.3×rhythm + 0.2×speed. All coefficients are calibrated to your personal baseline.",
  },
  {
    step: "4",
    title: "State Classification",
    desc: "The highest-scoring dimension above threshold (40%) becomes the dominant state. If all scores are below, the state is Neutral.",
  },
  {
    step: "5",
    title: "Threshold Alerting",
    desc: "If stress or fatigue exceed 70%, an alert is fired and optionally saved to your personal canister for review.",
  },
];

export default function Explanations() {
  return (
    <div className="p-6 space-y-8" data-ocid="explanations.page">
      <div>
        <h1 className="text-2xl font-bold">How It Works</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Full transparency on cognitive state detection, algorithms, and
          privacy
        </p>
      </div>

      {/* Cognitive states */}
      <section>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" /> Detected Cognitive States
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATES.map((state) => (
            <Card
              key={state.name}
              className="shadow-card"
              style={{ borderTop: `3px solid ${state.color}` }}
              data-ocid={`explanations.${state.name.toLowerCase()}.card`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: state.color }}
                  />
                  {state.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {state.description}
                </p>
                <div>
                  <p className="text-xs font-semibold mb-2">Detected by:</p>
                  <ul className="space-y-1">
                    {state.signals.map((s) => (
                      <li
                        key={s}
                        className="text-xs text-muted-foreground flex items-start gap-1.5"
                      >
                        <span
                          className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                          style={{ background: state.color }}
                        />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <Badge
                  variant="outline"
                  style={{ borderColor: state.color, color: state.color }}
                  className="text-xs"
                >
                  {state.thresholds}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Behavioral signals */}
      <section>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Behavioral Signals
          Explained
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SIGNALS.map((sig) => (
            <Card
              key={sig.name}
              className="shadow-card"
              data-ocid={`explanations.${sig.name.toLowerCase().replace(" ", "_")}.card`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <sig.icon className="w-4 h-4" style={{ color: sig.color }} />
                  {sig.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {sig.description}
                </p>
                <div className="space-y-1">
                  {sig.metrics.map((m) => (
                    <div
                      key={m}
                      className="text-xs bg-muted/50 px-2.5 py-1.5 rounded-md text-muted-foreground"
                    >
                      {m}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Algorithm walkthrough */}
      <section>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" /> Algorithm Walkthrough
        </h2>
        <Card className="shadow-card" data-ocid="explanations.algorithm.card">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {ALGO_STEPS.map((s) => (
                <div key={s.step} className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">
                      {s.step}
                    </span>
                  </div>
                  <div className="pt-0.5">
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Privacy */}
      <section>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> Privacy First Design
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: "Local Processing",
              desc: "All event collection and score computation happens entirely in your browser. No raw behavioral data ever leaves your device.",
              icon: Shield,
            },
            {
              title: "Opt-in Only",
              desc: "Tracking only starts when you click 'Start Session'. You have full control to stop at any time.",
              icon: Eye,
            },
            {
              title: "No Content Access",
              desc: "We track timing and movement patterns only. We never read what you type or access screen content.",
              icon: AlertTriangle,
            },
            {
              title: "Your Canister, Your Data",
              desc: "Session snapshots are stored in your personal Internet Computer canister — not on any centralized server.",
              icon: Brain,
            },
          ].map((item, idx) => (
            <Card
              key={item.title}
              className="shadow-card"
              data-ocid={`explanations.privacy_${idx + 1}.card`}
            >
              <CardContent className="pt-5 pb-4 flex gap-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
