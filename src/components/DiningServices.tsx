import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Service = {
  name: string;
  isOpen: boolean;
  hours: string;
  url?: string;
  openTime?: string;
  closeTime?: string;
  daysOpen?: string[];
  isClosed?: boolean;
};

export function DiningServices() {
  const { data: servicesData, isLoading, error } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("services" as any)
        .select("name,category,hours,url,open_time,close_time,days_open,is_closed")) as unknown as {
          data: { 
            name: string; 
            category: "dining" | "service"; 
            hours: string | null;
            url: string | null;
            open_time: string | null;
            close_time: string | null;
            days_open: string[] | null;
            is_closed: boolean;
          }[] | null;
          error: any;
        };
      if (error) throw error;
      
      // Compute is_open status on the client side
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/New_York'
      });
      const currentDay = now.toLocaleDateString('en-US', { 
        weekday: 'long',
        timeZone: 'America/New_York'
      }).toLowerCase();
      
      return (data ?? []).map(service => {
        let isOpen = false;
        
        if (!service.is_closed && service.open_time && service.close_time) {
          // Check if today is in days_open
          const isOpenToday = !service.days_open || service.days_open.includes(currentDay);
          
          // Check if current time is within operating hours
          const isWithinHours = currentTime >= service.open_time && currentTime < service.close_time;
          
          isOpen = isOpenToday && isWithinHours;
        }
        
        return { ...service, is_open: isOpen };
      });
    },
    staleTime: 1000 * 60, // Refresh every minute for accurate open/closed status
  });

  // Helper function to format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const dining = servicesData
    ?.filter(s => s.category === "dining")
    .map<Service>(s => ({
      name: s.name,
      isOpen: s.is_open,
      hours: s.hours ?? "",
      url: s.url ?? undefined,
      openTime: s.open_time ?? undefined,
      closeTime: s.close_time ?? undefined,
      daysOpen: s.days_open ?? undefined,
      isClosed: s.is_closed,
    })) ?? [];

  const otherServices = servicesData
    ?.filter(s => s.category === "service")
    .map<Service>(s => ({
      name: s.name,
      isOpen: s.is_open,
      hours: s.hours ?? "",
      openTime: s.open_time ?? undefined,
      closeTime: s.close_time ?? undefined,
      daysOpen: s.days_open ?? undefined,
      isClosed: s.is_closed,
    })) ?? [];

  return (
    <Card className="shadow-primary/10 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 size={18} /> Dining & Campus Services
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {isLoading && <div className="text-sm text-muted-foreground">Loading services…</div>}
        {error && <div className="text-sm text-destructive">Unable to load services. Please try again later.</div>}

        {!isLoading && !error && dining.length === 0 && otherServices.length === 0 && (
          <div className="text-sm text-muted-foreground">No services available at this time.</div>
        )}

        {dining.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Dining Halls</div>
            <div className="grid grid-cols-1 gap-2">
              {dining.map((d) => {
                // Determine status text
                let statusText = d.isOpen ? "Open" : "Closed";
                let statusDetail = d.hours;
                
                if (!d.isOpen && d.openTime && !d.isClosed) {
                  // Check if it opens today
                  const now = new Date();
                  const currentDay = now.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    timeZone: 'America/New_York'
                  }).toLowerCase();
                  
                  const opensToday = !d.daysOpen || d.daysOpen.includes(currentDay);
                  
                  // Helper to parse "HH:mm" into a Date object for today in America/New_York
                  function getTodayOpenDate(openTimeStr: string) {
                    // Get today's date in America/New_York
                    const nowNY = new Date(
                      now.toLocaleString('en-US', { timeZone: 'America/New_York' })
                    );
                    const [hours, minutes] = openTimeStr.split(':').map(Number);
                    const openDate = new Date(nowNY);
                    openDate.setHours(hours, minutes, 0, 0);
                    return openDate;
                  }

                  if (opensToday) {
                    // Only show "Opens at ... today" if current time is before opening time
                    const openDate = getTodayOpenDate(d.openTime);
                    // Compare now in NY timezone
                    const nowNY = new Date(
                      now.toLocaleString('en-US', { timeZone: 'America/New_York' })
                    );
                    if (nowNY < openDate) {
                      statusDetail = `Opens at ${formatTime(d.openTime)} today`;
                    } else if (d.daysOpen && d.daysOpen.length > 0) {
                      // Find next day it opens
                      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                      const currentDayIndex = daysOfWeek.indexOf(currentDay);
                      
                      let nextOpenDay = '';
                      for (let i = 1; i <= 7; i++) {
                        const nextDayIndex = (currentDayIndex + i) % 7;
                        const nextDay = daysOfWeek[nextDayIndex];
                        if (d.daysOpen.includes(nextDay)) {
                          // Capitalize first letter
                          nextOpenDay = nextDay.charAt(0).toUpperCase() + nextDay.slice(1);
                          break;
                        }
                      }
                      
                      if (nextOpenDay) {
                        statusDetail = `Opens at ${formatTime(d.openTime)} (${nextOpenDay})`;
                      }
                    }
                  } else if (d.daysOpen && d.daysOpen.length > 0) {
                    // Find next day it opens
                    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const currentDayIndex = daysOfWeek.indexOf(currentDay);
                    
                    let nextOpenDay = '';
                    for (let i = 1; i <= 7; i++) {
                      const nextDayIndex = (currentDayIndex + i) % 7;
                      const nextDay = daysOfWeek[nextDayIndex];
                      if (d.daysOpen.includes(nextDay)) {
                        // Capitalize first letter
                        nextOpenDay = nextDay.charAt(0).toUpperCase() + nextDay.slice(1);
                        break;
                      }
                    }
                    
                    if (nextOpenDay) {
                      statusDetail = `Opens at ${formatTime(d.openTime)} (${nextOpenDay})`;
                    }
                  }
                }
                
                return (
                  <div key={d.name} className="flex items-center justify-between rounded-lg border p-3 bg-card/60">
                    <div>
                      {d.url ? (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sm text-primary hover:underline"
                        >
                          {d.name}
                        </a>
                      ) : (
                        <div className="font-medium text-sm">{d.name}</div>
                      )}
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} /> {statusDetail}
                      </div>
                    </div>
                    <Badge
                      variant={d.isOpen ? "default" : "secondary"}
                      className={d.isOpen ? "bg-green-600" : "bg-gray-500"}
                    >
                      {statusText}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {otherServices.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Campus Services</div>
            <div className="grid grid-cols-1 gap-2">
              {otherServices.map((s) => {
                // Determine status text
                let statusText = s.isOpen ? "Open" : "Closed";
                let statusDetail = s.hours;
                
                if (!s.isOpen && s.openTime && !s.isClosed) {
                  // Check if it opens today
                  const now = new Date();
                  const currentDay = now.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    timeZone: 'America/New_York'
                  }).toLowerCase();
                  
                  const opensToday = !s.daysOpen || s.daysOpen.includes(currentDay);
                  
                  if (opensToday) {
                    // Opens later today
                    statusDetail = `Opens at ${formatTime(s.openTime)} today`;
                  } else if (s.daysOpen && s.daysOpen.length > 0) {
                    // Find next day it opens
                    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const currentDayIndex = daysOfWeek.indexOf(currentDay);
                    
                    let nextOpenDay = '';
                    for (let i = 1; i <= 7; i++) {
                      const nextDayIndex = (currentDayIndex + i) % 7;
                      const nextDay = daysOfWeek[nextDayIndex];
                      if (s.daysOpen.includes(nextDay)) {
                        // Capitalize first letter
                        nextOpenDay = nextDay.charAt(0).toUpperCase() + nextDay.slice(1);
                        break;
                      }
                    }
                    
                    if (nextOpenDay) {
                      statusDetail = `Opens at ${formatTime(s.openTime)} (${nextOpenDay})`;
                    }
                  }
                }
                
                return (
                  <div key={s.name} className="flex items-center justify-between rounded-lg border p-3 bg-card/60">
                    <div>
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} /> {statusDetail}
                      </div>
                    </div>
                    <Badge
                      variant={s.isOpen ? "default" : "secondary"}
                      className={s.isOpen ? "bg-green-600" : "bg-gray-500"}
                    >
                      {statusText}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
