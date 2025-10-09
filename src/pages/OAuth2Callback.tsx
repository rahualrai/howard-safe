import { useEffect } from 'react';

export default function OAuth2Callback() {
  useEffect(() => {
    const hash = window.location.hash || '';

    try {
      // Send the hash back to the opener window (same-origin expected)
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'oauth2callback', hash }, window.location.origin);
      }
    } catch (e) {
      // ignore
    }

    // Redirect the popup to the user's Google Calendar so they see it after consent.
    // We delay briefly to ensure the opener receives the postMessage.
    const t = setTimeout(() => {
      try {
        // Redirect to Google Calendar (user must be signed-in in the popup for it to show their calendar)
        window.location.href = 'https://calendar.google.com/calendar/r';
      } catch (e) {
        try {
          window.close();
        } catch (e) {}
      }
    }, 600);

    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-sm text-muted-foreground">Completing connection to Google...</div>
    </div>
  );
}
