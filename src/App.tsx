import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { RouteTransition } from "@/components/RouteTransition";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { usePreloadRoute } from "@/hooks/usePreloadRoute";
import { lazy } from "react";
import NotFound from "./pages/NotFound";
import CalendarPage from "@/pages/Calendar";
import OAuth2Callback from "@/pages/OAuth2Callback";
import GoogleCalendarCallback from "@/pages/GoogleCalendarCallback";

// Lazy load all pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Map = lazy(() => import("./pages/Map"));
const Tips = lazy(() => import("./pages/Tips"));
const ReportIncident = lazy(() => import("./pages/ReportIncident"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));

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

  const isMapPage = location.pathname === '/map';

  return (
    <>
      <div className={isMapPage ? "" : "pb-20"}>
        <RouteTransition>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/oauth2callback" element={<OAuth2Callback />} />
            <Route path="/google-calendar-callback" element={<GoogleCalendarCallback />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/map"
              element={
                <ProtectedRoute>
                  <Map />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tips"
              element={
                <ProtectedRoute>
                  <Tips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <ReportIncident />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RouteTransition>
      </div>
      <BottomNavigation />
    </>
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
