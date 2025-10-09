import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// NOTE: Replace this with your real Google OAuth client ID and authorized redirect URI
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
const REDIRECT_URI = `${window.location.origin}/oauth2callback`;

// Utility to build a Google Calendar event creation link
function buildGoogleCalendarLink(opts: {
  title: string;
  details?: string;
  location?: string;
  start: Date;
  end: Date;
}) {
  const format = (d: Date) =>
    d.toISOString().replace(/[-:]|\.\d{3}/g, "").slice(0, 15) + "Z"; // YYYYMMDDTHHmmssZ
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    details: opts.details ?? "",
    location: opts.location ?? "Howard University",
    dates: `${format(opts.start)}/${format(opts.end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function CalendarSync() {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'oauth2callback') {
        const hash = e.data.hash || '';
        // Parse hash for access_token (implicit flow) or code (auth code flow)
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const accessToken = params.get('access_token');
        const code = params.get('code');

        if (accessToken) {
          // Save token (demo). In production, exchange code on the server and store securely.
          const expiresIn = params.get('expires_in');
          const expiry = Date.now() + (Number(expiresIn) || 3600) * 1000;
          try {
            localStorage.setItem('google_access_token', accessToken);
            localStorage.setItem('google_token_expires', String(expiry));
          } catch (e) {
            // ignore storage errors
          }
          setConnected(true);
          toast({ title: 'Google connected', description: 'Your Google Calendar is now connected.' });
        } else if (code) {
          // If using auth code flow, you'd POST the code to your backend here.
          setConnected(true);
          toast({ title: 'Google connected', description: 'Authorization code received (exchange on backend).' });
        } else {
          toast({ title: 'Google connect failed', description: 'No token returned from Google.', variant: 'destructive' });
        }
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [toast]);

  // Restore connected state from localStorage on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem('google_access_token');
      const expiry = Number(localStorage.getItem('google_token_expires') || '0');
      if (token && expiry && Date.now() < expiry) {
        setConnected(true);
      } else {
        // cleanup expired tokens
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_token_expires');
      }
    } catch (e) {
      // ignore
    }
  }, []);
  // Example campus event to sync (replace with selected event from EventsCalendar)
  const start = new Date(Date.now() + 1000 * 60 * 60 * 6);
  const end = new Date(start.getTime() + 1000 * 60 * 60);
  const link = buildGoogleCalendarLink({
    title: "Howard Career Fair",
    details: "Meet employers and network. Brought to you by Career Services.",
    location: "Blackburn Ballroom",
    start,
    end,
  });

  return (
    <Card className="shadow-primary/10 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarPlus size={18} /> Calendar Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3 text-sm">
        {/* TODO: Wire to EventsCalendar selection & optionally OAuth for direct API */}
        <p className="text-muted-foreground">
          Add campus events to your Google Calendar to stay on track.
        </p>
        <div className="flex flex-wrap gap-2">
          {!connected ? (
            <Button
              variant="outline"
              onClick={() => {
                // Open Google OAuth consent screen in a popup (using PKCE/Auth Code flow is recommended for production)
                const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events');
                const responseType = 'token'; // implicit flow for demo; consider authorization_code for production
                const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=${responseType}&scope=${scope}&prompt=consent`;

                const w = 600;
                const h = 700;
                const left = window.screenX + (window.outerWidth - w) / 2;
                const top = window.screenY + (window.outerHeight - h) / 2;

                window.open(url, 'google_oauth', `width=${w},height=${h},left=${left},top=${top}`);
              }}
            >
              Connect Google
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  // Open Google Calendar in a new tab
                  window.open('https://calendar.google.com/calendar/r', '_blank');
                }}
              >
                Open Google Calendar
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  try {
                    localStorage.removeItem('google_access_token');
                    localStorage.removeItem('google_token_expires');
                  } catch (e) {}
                  setConnected(false);
                  toast({ title: 'Disconnected', description: 'Google Calendar connection removed.' });
                }}
              >
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
