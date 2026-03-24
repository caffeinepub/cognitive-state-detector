import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useAccessibility } from "../context/AccessibilityContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

const OPTIONS = [
  {
    key: "highContrast" as const,
    label: "High Contrast Mode",
    description: "Increases color contrast for better text readability.",
  },
  {
    key: "reduceMotion" as const,
    label: "Reduce Motion",
    description: "Disables animations and transitions throughout the app.",
  },
  {
    key: "largeText" as const,
    label: "Large Text",
    description: "Increases base font size to 18px for easier reading.",
  },
  {
    key: "accessibleCalibration" as const,
    label: "Accessible Calibration Mode",
    description:
      "Replaces mouse-movement tests with keyboard reaction tests during calibration.",
  },
];

export default function AccessibilityPanel({ open, onClose }: Props) {
  const accessibility = useAccessibility();

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-80"
        data-ocid="accessibility.panel"
      >
        <SheetHeader className="mb-6">
          <SheetTitle>Accessibility Settings</SheetTitle>
          <SheetDescription>
            Customise the interface to suit your needs. Changes are saved
            automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {OPTIONS.map((opt) => (
            <div key={opt.key} className="flex items-start gap-4">
              <Switch
                id={`a11y-${opt.key}`}
                checked={accessibility[opt.key]}
                onCheckedChange={(v) => accessibility.update(opt.key, v)}
                data-ocid={`accessibility.${opt.key}.switch`}
              />
              <div>
                <Label
                  htmlFor={`a11y-${opt.key}`}
                  className="text-sm font-semibold cursor-pointer"
                >
                  {opt.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {opt.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
