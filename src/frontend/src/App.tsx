import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createRootRoute, createRoute } from "@tanstack/react-router";
import Layout from "./components/Layout";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import Analytics from "./pages/Analytics";
import Calibration from "./pages/Calibration";
import Dashboard from "./pages/Dashboard";
import Explanations from "./pages/Explanations";
import LiveSession from "./pages/LiveSession";

const queryClient = new QueryClient();

const rootRoute = createRootRoute({
  component: Layout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const liveSessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/live",
  component: LiveSession,
});

const calibrationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calibration",
  component: Calibration,
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analytics",
  component: Analytics,
});

const explanationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explanations",
  component: Explanations,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  liveSessionRoute,
  calibrationRoute,
  analyticsRoute,
  explanationsRoute,
]);

const router = createRouter({ routeTree });

export default function App() {
  return (
    <AccessibilityProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </AccessibilityProvider>
  );
}
