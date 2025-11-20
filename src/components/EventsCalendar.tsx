import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EventItem = {
  id: string;
  title: string;
  startsAt: string; // ISO
  category: "academic" | "social" | "career" | "cultural";
  location: string;
};

const MOCK_EVENTS: EventItem[] = [
  {
    id: "1",
    title: "Career Fair: Tech & Startups",
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    category: "career",
    location: "Blackburn Ballroom",
  },
  {
    id: "2",
    title: "Homecoming Prep Meeting",
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    category: "social",
    location: "Student Center 201",
  },
  {
    id: "3",
    title: "Study Skills Workshop",
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 30).toISOString(),
    category: "academic",
    location: "Founders Library",
  },
  {
    id: "4",
    title: "Cultural Night: Caribbean Showcase",
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    category: "cultural",
    location: "Cramton Auditorium",
  },
];

const categoryBadge: Record<EventItem["category"], string> = {
  academic: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  social: "bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300",
  career: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  cultural: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
};

export function EventsCalendar() {
  const [filter, setFilter] = useState<"all" | EventItem["category"]>("all");
  const { data, isLoading, error } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      // Using any-cast because Supabase generated types don't yet include the new table
      const { data, error } = await (supabase
        .from("events" as any)
        .select("id,title,starts_at,category,location")
        .order("starts_at", { ascending: true })
        .limit(20)) as unknown as { data: { id: string; title: string; starts_at: string; category: EventItem["category"]; location: string }[] | null, error: any };
      if (error) throw error;
      return (data ?? []) as { id: string; title: string; starts_at: string; category: EventItem["category"]; location: string }[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Merge database events with hardcoded mock events
  const dbEvents: EventItem[] = (data && data.length > 0)
    ? data.map((e) => ({ id: e.id, title: e.title, startsAt: e.starts_at, category: e.category, location: e.location }))
    : [];
  
  // Combine database events with mock events (database events first, then mock events)
  const allEvents: EventItem[] = [...dbEvents, ...MOCK_EVENTS];

  const events = useMemo(() => {
    return filter === "all" ? allEvents : allEvents.filter(e => e.category === filter);
  }, [filter, allEvents]);

  return (
    <Card className="shadow-primary/10 border-border/50">
      <CardHeader className="pb-2 flex items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays size={18} /> Campus Events
        </CardTitle>
        <div className="w-36">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="career">Career</SelectItem>
              <SelectItem value="cultural">Cultural</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* TODO: Replace with official campus events source if different */}
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading events…</div>
        )}
        {error && (
          <div className="text-sm text-destructive">Unable to load events. Showing recent highlights.</div>
        )}
        {events.map(e => (
          <div key={e.id} className="flex items-start justify-between rounded-lg border p-3 bg-card/60">
            <div>
              <div className="font-medium text-sm">{e.title}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(e.startsAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                {" • "}{e.location}
              </div>
            </div>
            <Badge className={categoryBadge[e.category]}>{e.category}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
