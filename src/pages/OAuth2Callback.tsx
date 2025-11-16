import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function OAuth2Callback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase automatically processes the OAuth callback from the URL
    // We need to listen for the auth state change event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Successfully authenticated
          toast({
            title: "Successfully signed in",
            description: "Welcome back!",
          });
          navigate('/');
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          // Check URL for error parameters
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const errorParam = urlParams.get('error') || hashParams.get('error');
          const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

          if (errorParam) {
            setError(errorDescription || errorParam);
            toast({
              title: "Sign in failed",
              description: errorDescription || errorParam,
              variant: "destructive",
            });
            setTimeout(() => {
              navigate('/auth');
            }, 2000);
          } else {
            setError('Authentication failed. Please try again.');
            setTimeout(() => {
              navigate('/auth');
            }, 2000);
          }
          setLoading(false);
        }
      }
    );

    // Also try to get the session immediately in case it's already processed
    const checkSession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (data.session) {
          toast({
            title: "Successfully signed in",
            description: "Welcome back!",
          });
          navigate('/');
          setLoading(false);
        } else {
          // Wait a bit for the auth state change to fire
          // If no session after 2 seconds, check for errors
          setTimeout(() => {
            setLoading((currentLoading) => {
              if (currentLoading) {
                // Check URL for error
                const urlParams = new URLSearchParams(window.location.search);
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const errorParam = urlParams.get('error') || hashParams.get('error');
                const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

                if (errorParam) {
                  setError(errorDescription || errorParam);
                  toast({
                    title: "Sign in failed",
                    description: errorDescription || errorParam,
                    variant: "destructive",
                  });
                } else {
                  setError('Authentication failed. Please try again.');
                }
                setTimeout(() => {
                  navigate('/auth');
                }, 2000);
                return false;
              }
              return currentLoading;
            });
          }, 2000);
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError(err.message || 'Authentication failed');
        toast({
          title: "Sign in failed",
          description: err.message || 'Please try again.',
          variant: "destructive",
        });
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="text-sm text-muted-foreground">Completing sign in...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-destructive font-medium">{error}</div>
          <div className="text-sm text-muted-foreground">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return null;
}
