import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function GoogleCalendarCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const processCallback = () => {
      try {
        console.log('📅 Processing Google Calendar callback...');
        
        // Parse hash for access_token (implicit flow) or code (auth code flow)
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const code = params.get('code');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        console.log('Hash params:', { accessToken: accessToken ? 'present' : 'missing', code, error });

        if (error) {
          console.error('❌ Google Calendar OAuth error:', error, errorDescription);
          toast({
            title: 'Google Calendar connection failed',
            description: errorDescription || error,
            variant: 'destructive',
          });
          
          // Send failure message to opener window
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'google_calendar_callback',
              success: false,
              error: errorDescription || error,
            }, window.location.origin);
          }
          
          // Close popup or redirect
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              navigate('/calendar');
            }
          }, 2000);
          return;
        }

        if (accessToken) {
          console.log('✅ Access token received');
          
          // Save token (demo). In production, exchange code on the server and store securely.
          const expiresIn = params.get('expires_in');
          const expiry = Date.now() + (Number(expiresIn) || 3600) * 1000;
          
          try {
            localStorage.setItem('google_access_token', accessToken);
            localStorage.setItem('google_token_expires', String(expiry));
            console.log('💾 Token saved to localStorage');
          } catch (e) {
            console.error('Failed to save token:', e);
          }

          toast({
            title: 'Google Calendar connected',
            description: 'Your Google Calendar is now connected.',
          });

          // Send success message to opener window
          if (window.opener && !window.opener.closed) {
            console.log('📤 Sending success message to parent window');
            window.opener.postMessage({
              type: 'google_calendar_callback',
              success: true,
              accessToken,
              expiresIn,
            }, window.location.origin);
          }

          // Close popup or redirect
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              navigate('/calendar');
            }
          }, 1000);
        } else if (code) {
          console.log('✅ Authorization code received');
          
          // If using auth code flow, you'd POST the code to your backend here.
          toast({
            title: 'Google Calendar connected',
            description: 'Authorization code received (exchange on backend).',
          });

          // Send success message to opener window
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'google_calendar_callback',
              success: true,
              code,
            }, window.location.origin);
          }

          // Close popup or redirect
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              navigate('/calendar');
            }
          }, 1000);
        } else {
          console.error('❌ No token or code in callback');
          toast({
            title: 'Google Calendar connection failed',
            description: 'No token returned from Google.',
            variant: 'destructive',
          });

          // Send failure message to opener window
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'google_calendar_callback',
              success: false,
              error: 'No token returned',
            }, window.location.origin);
          }

          // Close popup or redirect
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              navigate('/calendar');
            }
          }, 2000);
        }
      } catch (err) {
        console.error('Error processing Google Calendar callback:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        toast({
          title: 'Error processing callback',
          description: errorMessage,
          variant: 'destructive',
        });

        // Send failure message to opener window
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({
            type: 'google_calendar_callback',
            success: false,
            error: errorMessage,
          }, window.location.origin);
        }

        // Close popup or redirect
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            navigate('/calendar');
          }
        }, 2000);
      }
    };

    processCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <div className="text-sm text-muted-foreground">
          Connecting Google Calendar...
        </div>
      </div>
    </div>
  );
}
