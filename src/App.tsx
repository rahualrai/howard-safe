import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { RouteTransition } from "@/components/RouteTransition";
import { usePreloadRoute } from "@/hooks/usePreloadRoute";
import { lazy } from "react";
import NotFound from "./pages/NotFound";

// Lazy load all pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Map = lazy(() => import("./pages/Map"));
const SafetyTips = lazy(() => import("./pages/SafetyTips"));
const ReportIncident = lazy(() => import("./pages/ReportIncident"));
const Resources = lazy(() => import("./pages/Resources"));
const Notifications = lazy(() => import("./pages/Notifications"));

// Optimized React Query client for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 1000 * 60 * 5,
      // Keep data in cache for 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry failed requests
      retry: 2,
      // Background refetch for fresh data
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// App Router with preloading
function AppRouter() {
  const location = useLocation();
  usePreloadRoute(location.pathname);

  return (
    <RouteTransition>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Map />} />
        <Route path="/safety-tips" element={<SafetyTips />} />
        <Route path="/report" element={<ReportIncident />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/notifications" element={<Notifications />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </RouteTransition>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
