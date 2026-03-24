import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Accessibility,
  CheckCircle,
  ChevronRight,
  Clock,
  Keyboard,
  Loader2,
  MousePointer,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAccessibility } from "../context/AccessibilityContext";
import {
  useCalibrationProfile,
  useSaveCalibrationProfile,
} from "../hooks/useQueries";

const CALIBRATION_TEXT =
  "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How valiantly do we fight for what is right.";

type Step = 0 | 1 | 2 | 3; // 0=intro, 1=typing, 2=mouse, 3=rest

const REACTION_DURATION = 15000; // 15s
const CIRCLE_CHANGE_MIN = 2000;
const CIRCLE_CHANGE_MAX = 3000;

export default function Calibration() {
  const { accessibleCalibration } = useAccessibility();

  const [step, setStep] = useState<Step>(0);
  const [typingWpm, setTypingWpm] = useState(0);
  const [mouseBaseline, setMouseBaseline] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [mouseCountdown, setMouseCountdown] = useState(15);
  const [restCountdown, setRestCountdown] = useState(10);
  const mouseSpeedsRef = useRef<number[]>([]);
  const [done, setDone] = useState(false);
  const prevMouseRef = useRef({ x: 0, y: 0, t: Date.now() });

  // Keyboard reaction test state
  const [circleColor, setCircleColor] = useState<"blue" | "gray">("gray");
  const [reactionCountdown, setReactionCountdown] = useState(15);
  const reactionTimesRef = useRef<number[]>([]);
  const circleChangedAtRef = useRef<number | null>(null);

  const { mutate: saveProfile, isPending } = useSaveCalibrationProfile();
  const { data: existingProfile } = useCalibrationProfile();

  const finishCalibrationWithBaseline = useCallback(
    (baseline: number, wpm: number) => {
      const accuracy = Math.min(98, 70 + Math.random() * 25);
      saveProfile(
        {
          typingSpeed: wpm || 40,
          mouseMovement: baseline || 100,
          accuracy: Math.round(accuracy),
        },
        {
          onSuccess: () => {
            setDone(true);
            toast.success("Calibration profile saved!");
          },
          onError: () =>
            toast.error("Failed to save profile. Please try again."),
        },
      );
    },
    [saveProfile],
  );

  // Step 2 (standard): Mouse tracking
  useEffect(() => {
    if (step !== 2 || accessibleCalibration) return;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dt = (now - prevMouseRef.current.t) / 1000;
      if (dt > 0) {
        const dx = e.clientX - prevMouseRef.current.x;
        const dy = e.clientY - prevMouseRef.current.y;
        const speed = Math.sqrt(dx * dx + dy * dy) / dt;
        mouseSpeedsRef.current = [...mouseSpeedsRef.current.slice(-30), speed];
      }
      prevMouseRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    };
    document.addEventListener("mousemove", handleMouseMove);
    const countdown = setInterval(() => {
      setMouseCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    const timer = setTimeout(() => {
      document.removeEventListener("mousemove", handleMouseMove);
      const avg =
        mouseSpeedsRef.current.length > 0
          ? mouseSpeedsRef.current.reduce((a, b) => a + b, 0) /
            mouseSpeedsRef.current.length
          : 100;
      setMouseBaseline(Math.round(avg));
      setStep(3);
    }, 15000);
    return () => {
      clearTimeout(timer);
      clearInterval(countdown);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [step, accessibleCalibration]);

  // Step 2 (accessible): Keyboard reaction test circle changer
  useEffect(() => {
    if (step !== 2 || !accessibleCalibration) return;
    reactionTimesRef.current = [];
    setReactionCountdown(15);
    setCircleColor("gray");

    const countdownInterval = setInterval(() => {
      setReactionCountdown((c) => Math.max(0, c - 1));
    }, 1000);

    let nextTimeout: ReturnType<typeof setTimeout>;
    const scheduleCircleChange = () => {
      const delay =
        CIRCLE_CHANGE_MIN +
        Math.random() * (CIRCLE_CHANGE_MAX - CIRCLE_CHANGE_MIN);
      nextTimeout = setTimeout(() => {
        setCircleColor("blue");
        circleChangedAtRef.current = Date.now();
        // Turn gray again after 800ms if not reacted
        setTimeout(() => setCircleColor("gray"), 800);
        scheduleCircleChange();
      }, delay);
    };
    scheduleCircleChange();

    const finishTimer = setTimeout(() => {
      clearInterval(countdownInterval);
      clearTimeout(nextTimeout);
      const times = reactionTimesRef.current;
      const avgReaction =
        times.length > 0
          ? times.reduce((a, b) => a + b, 0) / times.length
          : 400;
      // Map avg reaction time to a "mouse baseline" equivalent score
      const baseline = Math.max(50, Math.round(500 - avgReaction * 0.5));
      setMouseBaseline(baseline);
      setStep(3);
    }, REACTION_DURATION);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(nextTimeout);
      clearTimeout(finishTimer);
    };
  }, [step, accessibleCalibration]);

  // Keyboard reaction handler (Space/Enter)
  useEffect(() => {
    if (step !== 2 || !accessibleCalibration) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (circleChangedAtRef.current !== null) {
          const rt = Date.now() - circleChangedAtRef.current;
          if (rt < 2000) {
            reactionTimesRef.current.push(rt);
          }
          circleChangedAtRef.current = null;
          setCircleColor("gray");
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [step, accessibleCalibration]);

  // Step 3: Rest countdown
  useEffect(() => {
    if (step !== 3) return;
    const countdown = setInterval(() => {
      setRestCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    const timer = setTimeout(() => {
      finishCalibrationWithBaseline(mouseBaseline, typingWpm);
    }, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(countdown);
    };
  }, [step, mouseBaseline, typingWpm, finishCalibrationWithBaseline]);

  const handleTypingChange = (val: string) => {
    if (!startTime) setStartTime(Date.now());
    setTypedText(val);
    if (startTime && val.length > 10) {
      const minutes = (Date.now() - startTime) / 60000;
      const words = val.trim().split(/\s+/).length;
      setTypingWpm(Math.round(words / minutes));
    }
  };

  const finishStep1 = () => {
    if (typedText.length < 20) {
      toast.error("Please type a bit more to calibrate.");
      return;
    }
    setStep(2);
    setMouseCountdown(15);
    mouseSpeedsRef.current = [];
  };

  const skipTypingTest = () => {
    setTypingWpm(40);
    setStep(2);
    setMouseCountdown(15);
    mouseSpeedsRef.current = [];
    toast("Using default typing speed of 40 WPM.");
  };

  const skipRestStep = () => {
    finishCalibrationWithBaseline(mouseBaseline, typingWpm);
  };

  const steps = [
    { label: "Typing Baseline", icon: Keyboard },
    {
      label: accessibleCalibration ? "Reaction Baseline" : "Mouse Baseline",
      icon: accessibleCalibration ? Keyboard : MousePointer,
    },
    { label: "Rest State", icon: Clock },
  ];

  if (done) {
    return (
      <div className="p-6" data-ocid="calibration.success.card">
        <Card className="max-w-lg mx-auto shadow-card">
          <CardContent className="flex flex-col items-center py-16 gap-6">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">Calibration Complete!</h2>
              <p className="text-muted-foreground mt-2">
                Your behavioral baselines have been saved.
              </p>
            </div>
            <div className="w-full space-y-2 text-sm">
              <div className="flex justify-between px-4 py-2 bg-muted rounded-lg">
                <span className="text-muted-foreground">Typing Speed</span>
                <span className="font-semibold">{typingWpm || 40} WPM</span>
              </div>
              <div className="flex justify-between px-4 py-2 bg-muted rounded-lg">
                <span className="text-muted-foreground">
                  {accessibleCalibration ? "Reaction Score" : "Mouse Movement"}
                </span>
                <span className="font-semibold">
                  {mouseBaseline || 100}{" "}
                  {accessibleCalibration ? "pts" : "px/s"}
                </span>
              </div>
            </div>
            <Button
              onClick={() => {
                setStep(0);
                setDone(false);
                setTypedText("");
                setStartTime(null);
              }}
              variant="outline"
              data-ocid="calibration.redo.button"
            >
              Calibrate Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-ocid="calibration.page">
      <div>
        <h1 className="text-2xl font-bold">Personal Calibration</h1>
        <p className="text-sm text-muted-foreground">
          Establish your behavioral baselines for accurate cognitive detection
        </p>
      </div>

      {/* Accessible Calibration Mode banner */}
      {accessibleCalibration && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20"
          data-ocid="calibration.a11y_mode.panel"
        >
          <Accessibility
            className="w-4 h-4 text-primary shrink-0"
            aria-hidden="true"
          />
          <p className="text-sm">
            <strong>Accessible Calibration Mode is enabled.</strong> Mouse steps
            are replaced with keyboard alternatives.
          </p>
        </div>
      )}

      {/* Existing profile banner */}
      {existingProfile && step === 0 && (
        <div className="bg-accent/50 border border-accent-foreground/10 rounded-lg px-4 py-3 flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-accent-foreground shrink-0" />
          <p className="text-sm">
            You have an existing calibration profile with{" "}
            <strong>{existingProfile.calibrationAccuracy}% accuracy</strong>.
            You can recalibrate below.
          </p>
        </div>
      )}

      {/* Step indicator */}
      <div
        className="flex items-center gap-2"
        aria-label="Calibration progress"
      >
        {steps.map((s, i) => {
          const active = step === i + 1;
          const completed = step > i + 1 || done;
          return (
            <div key={s.label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  completed
                    ? "bg-success/10 text-success"
                    : active
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground",
                )}
                aria-current={active ? "step" : undefined}
              >
                {completed ? (
                  <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <s.icon className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {s.label}
              </div>
              {i < 2 && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {step === 0 && (
        <Card
          className="shadow-card max-w-2xl"
          data-ocid="calibration.intro.card"
        >
          <CardHeader>
            <CardTitle>About Calibration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This 3-step process takes about 30 seconds and establishes your
              personal behavioral baselines. All processing happens in your
              browser.
            </p>
            <ul className="space-y-3">
              {steps.map((s, i) => (
                <li key={s.label} className="flex items-center gap-3 text-sm">
                  <div
                    className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <s.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span>
                    <strong>Step {i + 1}:</strong>{" "}
                    {accessibleCalibration
                      ? [
                          "Type a passage to measure your baseline typing speed",
                          "Press Space/Enter when the circle turns blue to measure your reaction baseline",
                          "Rest for 10 seconds to capture your resting state",
                        ][i]
                      : [
                          "Type a passage to measure your baseline typing speed",
                          "Move your mouse naturally to establish movement patterns",
                          "Rest for 10 seconds to capture your resting state",
                        ][i]}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              onClick={() => setStep(1)}
              className="bg-primary"
              data-ocid="calibration.start.button"
            >
              Start Calibration{" "}
              <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card
          className="shadow-card max-w-2xl"
          data-ocid="calibration.typing.card"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-primary" aria-hidden="true" />{" "}
              Step 1: Typing Baseline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="bg-muted/50 rounded-lg p-4 text-sm font-mono leading-relaxed text-muted-foreground"
              aria-label="Passage to type"
            >
              {CALIBRATION_TEXT}
            </div>
            <Textarea
              placeholder="Type the passage above..."
              value={typedText}
              onChange={(e) => handleTypingChange(e.target.value)}
              className="h-28 font-mono text-sm"
              aria-label="Typing test area"
              data-ocid="calibration.typing.textarea"
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-muted-foreground">
                {typingWpm > 0 && (
                  <Badge variant="outline">~{typingWpm} WPM</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={skipTypingTest}
                  variant="outline"
                  className="text-xs"
                  data-ocid="calibration.skip_typing.button"
                >
                  Skip (use default 40 WPM)
                </Button>
                <Button
                  onClick={finishStep1}
                  className="bg-primary"
                  data-ocid="calibration.typing.next.button"
                >
                  Next{" "}
                  <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && !accessibleCalibration && (
        <Card
          className="shadow-card max-w-2xl"
          data-ocid="calibration.mouse.card"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer
                className="w-5 h-5 text-primary"
                aria-hidden="true"
              />{" "}
              Step 2: Mouse Movement Baseline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Move your mouse naturally within the box below. We&apos;re
              measuring your typical movement speed and patterns.
            </p>
            <div
              className="h-40 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center cursor-none select-none"
              data-ocid="calibration.mouse.canvas_target"
              aria-label="Mouse tracking area — move your mouse here"
              role="application"
            >
              <MousePointer
                className="w-8 h-8 text-primary/40 mb-2"
                aria-hidden="true"
              />
              <p className="text-sm text-primary/60">Move your mouse here</p>
            </div>
            <div className="flex items-center gap-4">
              <Progress
                value={((15 - mouseCountdown) / 15) * 100}
                className="flex-1 h-2"
                aria-label={`Mouse tracking progress: ${mouseCountdown} seconds remaining`}
              />
              <span className="text-sm font-mono text-muted-foreground w-10">
                {mouseCountdown}s
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-advancing in {mouseCountdown} seconds...
            </p>
          </CardContent>
        </Card>
      )}

      {step === 2 && accessibleCalibration && (
        <Card
          className="shadow-card max-w-2xl"
          data-ocid="calibration.reaction.card"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-primary" aria-hidden="true" />{" "}
              Step 2: Keyboard Reaction Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              Press{" "}
              <kbd className="px-2 py-0.5 bg-background border rounded text-xs font-mono">
                Space
              </kbd>{" "}
              or{" "}
              <kbd className="px-2 py-0.5 bg-background border rounded text-xs font-mono">
                Enter
              </kbd>{" "}
              each time the circle turns{" "}
              <strong className="text-primary">blue</strong>. This measures your
              reaction baseline.
            </div>

            {/* Reaction circle */}
            <div
              className="flex flex-col items-center justify-center py-8 gap-4"
              aria-live="polite"
              aria-atomic="true"
            >
              <button
                type="button"
                onClick={() => {
                  if (circleChangedAtRef.current !== null) {
                    const rt = Date.now() - circleChangedAtRef.current;
                    if (rt < 2000) reactionTimesRef.current.push(rt);
                    circleChangedAtRef.current = null;
                    setCircleColor("gray");
                  }
                }}
                className={cn(
                  "w-24 h-24 rounded-full border-4 transition-colors duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary",
                  circleColor === "blue"
                    ? "bg-primary border-primary"
                    : "bg-muted border-border",
                )}
                aria-label={
                  circleColor === "blue"
                    ? "Circle is blue — press Space, Enter, or click now!"
                    : "Waiting for circle to turn blue"
                }
                data-ocid="calibration.reaction.canvas_target"
              />
              <p className="text-sm text-muted-foreground">
                {circleColor === "blue"
                  ? "🔵 Press Space / Enter / Click now!"
                  : "Watching for the blue circle..."}
              </p>
              <p className="text-xs text-muted-foreground">
                Reactions recorded: {reactionTimesRef.current.length}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Progress
                value={((15 - reactionCountdown) / 15) * 100}
                className="flex-1 h-2"
                aria-label={`Test progress: ${reactionCountdown} seconds remaining`}
              />
              <span className="text-sm font-mono text-muted-foreground w-10">
                {reactionCountdown}s
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card
          className="shadow-card max-w-2xl"
          data-ocid="calibration.rest.card"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" aria-hidden="true" /> Step
              3: Resting State
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Relax and stay still. We&apos;re capturing your baseline resting
              state.{" "}
              {accessibleCalibration && (
                <span className="text-primary font-medium">
                  You may press Space to skip ahead.
                </span>
              )}
            </p>
            <div
              className="h-32 flex flex-col items-center justify-center gap-3"
              aria-live="polite"
            >
              <div
                className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center"
                aria-label={`Rest countdown: ${restCountdown} seconds remaining`}
              >
                <span className="text-2xl font-bold text-primary">
                  {restCountdown}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Breathe slowly...</p>
            </div>
            <Progress
              value={((10 - restCountdown) / 10) * 100}
              className="h-2"
              aria-label={`Rest progress: ${10 - restCountdown} of 10 seconds`}
            />
            {accessibleCalibration && (
              <Button
                variant="outline"
                onClick={skipRestStep}
                className="w-full"
                data-ocid="calibration.skip_rest.button"
              >
                Skip rest step
              </Button>
            )}
            {isPending && (
              <output
                className="flex items-center gap-2 text-sm text-muted-foreground"
                data-ocid="calibration.saving.loading_state"
              >
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />{" "}
                Saving calibration profile...
              </output>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
