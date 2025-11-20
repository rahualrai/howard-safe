import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminPanel } from "@/components/AdminPanel";
import { useAdmin } from "@/hooks/useAdmin";
import { useSecurityValidation } from "@/hooks/useSecurityValidation";
import { useEffect } from "react";

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useSecurityValidation({ requireAuth: true, redirectTo: '/auth' });
  const { isAdmin, loading } = useAdmin(user?.id);

  // Redirect if not admin (with a small delay to show loading state)
  useEffect(() => {
    if (!loading && !isAdmin) {
      // Small delay to prevent flash
      const timer = setTimeout(() => {
        navigate('/profile');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header with back button - Mobile optimized */}
      <header className="bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 sticky top-0 z-50 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="h-10 w-10 p-0 -ml-2 touch-target"
            aria-label="Back to profile"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Settings className="h-5 w-5 text-primary flex-shrink-0" />
            <h1 className="text-lg font-bold truncate">Admin Panel</h1>
            <Badge variant="secondary" className="ml-auto flex-shrink-0">Admin</Badge>
          </div>
        </div>
      </header>

      {/* Admin Panel Content - Mobile optimized with proper padding */}
      <main className="p-4 max-w-md mx-auto pb-6">
        <AdminPanel />
      </main>
    </div>
  );
}

