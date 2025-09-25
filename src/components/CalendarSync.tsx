import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";

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
          <Button asChild>
            <a href={link} target="_blank" rel="noreferrer">Add Sample Event</a>
          </Button>
          <Button variant="outline" disabled title="More options coming soon">
            Connect Google
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
