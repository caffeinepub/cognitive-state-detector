import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

const SHORTCUTS = [
  { key: "?", description: "Open keyboard shortcuts help" },
  { key: "Tab / Shift+Tab", description: "Navigate between elements" },
  { key: "Space / Enter", description: "Activate focused button or control" },
  { key: "S", description: "Start / Stop session (on Live Session page)" },
  { key: "1", description: "Go to Dashboard" },
  { key: "2", description: "Go to Live Session" },
  { key: "3", description: "Go to Calibration" },
  { key: "4", description: "Go to Analytics" },
  { key: "5", description: "Go to Explanations" },
  { key: "Esc", description: "Close dialogs and panels" },
];

export default function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "?") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md" data-ocid="keyboard_shortcuts.dialog">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-2">
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between gap-4 py-1.5 border-b border-border last:border-0"
            >
              <kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono font-semibold whitespace-nowrap">
                {s.key}
              </kbd>
              <span className="text-sm text-muted-foreground text-right">
                {s.description}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useKeyboardShortcutsOpen() {
  return useState(false);
}
