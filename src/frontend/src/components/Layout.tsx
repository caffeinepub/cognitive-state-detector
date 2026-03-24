import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Outlet, useRouter } from "@tanstack/react-router";
import {
  Accessibility,
  Activity,
  BarChart2,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  LayoutDashboard,
  LogOut,
  Settings,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import AccessibilityPanel from "./AccessibilityPanel";
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Activity, label: "Live Session", path: "/live" },
  { icon: Target, label: "Calibration", path: "/calibration" },
  { icon: BarChart2, label: "Analytics", path: "/analytics" },
  { icon: BookOpen, label: "Explanations", path: "/explanations" },
];

export default function Layout() {
  const router = useRouter();
  const currentPath = router.state.location.pathname;
  const [collapsed, setCollapsed] = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);

  const navigate = (path: string) => router.navigate({ to: path });

  // Keyboard shortcuts: 1-5 for page navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      const idx = Number.parseInt(e.key, 10);
      if (idx >= 1 && idx <= 5) {
        e.preventDefault();
        router.navigate({ to: NAV_ITEMS[idx - 1].path });
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Accessibility Panel */}
      <AccessibilityPanel open={a11yOpen} onClose={() => setA11yOpen(false)} />

      {/* Keyboard Shortcuts Help (listens for ? globally) */}
      <KeyboardShortcutsHelp />

      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-60",
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border",
            collapsed && "justify-center px-2",
          )}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shrink-0">
            <Brain className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold tracking-wide text-foreground">
              COGSTATE
            </span>
          )}
        </div>

        {/* User mini-profile */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                JD
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                John Doe
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Researcher
              </p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav
          className="flex-1 px-2 py-4 space-y-1"
          aria-label="Main navigation"
          data-ocid="sidebar.panel"
        >
          {NAV_ITEMS.map((item, idx) => {
            const active = currentPath === item.path;
            return (
              <button
                type="button"
                key={item.path}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                data-ocid={`nav.${item.label.toLowerCase().replace(" ", "_")}.link`}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  collapsed && "justify-center px-2",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {!collapsed && (
                  <span>
                    <span className="text-muted-foreground/50 text-xs mr-1.5">
                      {idx + 1}
                    </span>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom utilities */}
        <div className="px-2 py-4 border-t border-sidebar-border space-y-1">
          <button
            type="button"
            onClick={() => setA11yOpen(true)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
              collapsed && "justify-center px-2",
            )}
            aria-label="Open accessibility settings"
            data-ocid="nav.accessibility.open_modal_button"
            title={collapsed ? "Accessibility" : undefined}
          >
            <Accessibility className="w-4 h-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span>Accessibility</span>}
          </button>
          <button
            type="button"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
              collapsed && "justify-center px-2",
            )}
            aria-label="Show keyboard shortcuts (press ?)"
            onClick={() => {
              // Dispatch a ? keydown to trigger the shortcut dialog
              document.dispatchEvent(
                new KeyboardEvent("keydown", { key: "?" }),
              );
            }}
            data-ocid="nav.keyboard_shortcuts.open_modal_button"
            title={collapsed ? "Keyboard Shortcuts" : undefined}
          >
            <Keyboard className="w-4 h-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span>Shortcuts (?)</span>}
          </button>
          <button
            type="button"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
              collapsed && "justify-center px-2",
            )}
            data-ocid="nav.settings.link"
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="w-4 h-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span>Settings</span>}
          </button>
          <button
            type="button"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
              collapsed && "justify-center px-2",
            )}
            data-ocid="nav.logout.button"
            title={collapsed ? "Log Out" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span>Log Out</span>}
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
              collapsed && "justify-center px-2",
            )}
            data-ocid="sidebar.toggle"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* App label strip */}
        <div className="text-center py-2 bg-primary/5 border-b border-border shrink-0">
          <span className="text-xs font-semibold tracking-widest uppercase text-primary/70">
            Cognitive State Detection System
          </span>
        </div>

        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
