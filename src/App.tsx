import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { RouteTransition } from "@/components/RouteTransition";
import { BottomNavigation } from "@/components/BottomNavigation";
import { usePreloadRoute } from "@/hooks/usePreloadRoute";
import { lazy } from "react";
import NotFound from "./pages/NotFound";
import CalendarPage from "@/pages/Calendar";
import OAuth2Callback from "@/pages/OAuth2Callback";

// Lazy load all pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Map = lazy(() => import("./pages/Map"));
const Tips = lazy(() => import("./pages/Tips"));
const ReportIncident = lazy(() => import("./pages/ReportIncident"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));

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
  <Route path="/calendar" element={<CalendarPage />} />
  <Route path="/oauth2callback" element={<OAuth2Callback />} />
        <Route path="/tips" element={<Tips />} />
        <Route path="/report" element={<ReportIncident />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<Profile />} />
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
          <div className="pb-20">
            <AppRouter />
          </div>
          <BottomNavigation />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
