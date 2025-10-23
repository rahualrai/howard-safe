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
};

const MOCK_DINING: Service[] = [
  { name: "1867 Café", isOpen: false, hours: "Closed", url: "https://howard.campusdish.com/LocationsAndMenus/1867Cafe" },
  { name: "Bethune Annex Café", isOpen: true, hours: "4:00 PM – 10:00 PM", url: "https://howard.campusdish.com/LocationsAndMenus/BethuneAnnexCafe" },
  { name: "Bison Brew", isOpen: true, hours: "8:00 AM – 8:00 PM", url: "https://howard.campusdish.com/LocationsAndMenus/BisonBrew" },
  { name: "Blackburn Café", isOpen: true, hours: "4:00 PM – 9:00 PM", url: "https://howard.campusdish.com/LocationsAndMenus/BlackburnCafe" },
  { name: "Chick-fil-A", isOpen: true, hours: "8:30 AM – 8:00 PM", url: "https://howard.campusdish.com/LocationsAndMenus/ChickfilA" },
  { name: "Everbowl", isOpen: true, hours: "11:00 AM – 10:00 PM", url: "https://howard.campusdish.com/LocationsAndMenus/Everbowl" },
  { name: "202 Market", isOpen: true, hours: "9:00 AM – 8:00 PM", url: "https://howard.campusdish.com/LocationsAndMenus/202Market" },
  { name: "The Halal Shack", isOpen: true, hours: "11:00 AM – 10:00 PM", url: "https://howard.campusdish.com/LocationsAndMenus/TheHalalShack" },
  { name: "The Market at Bethune Annex", isOpen: true, hours: "8:00 AM – 10:00 PM", url: "https://howard.campusdish.com/LocationsAndMenus/MarketatBethuneAnnex" },
  { name: "The Market at West Tower", isOpen: true, hours: "8:00 AM – 10:00 PM", url: "https://howard.campusdish.com/LocationsAndMenus/MarketatWestTower" },
  { name: "Jack's Burrito", isOpen: true, hours: "11:00 AM – 10:00 PM", url: "https://howard.campusdish.com/LocationsAndMenus/JacksBurrito" },
];

const MOCK_SERVICES: Service[] = [
  { name: "Founders Library", isOpen: true, hours: "8:00 AM – 10:00 PM" },
  { name: "Campus Gym", isOpen: false, hours: "Closed • Opens 9:00 AM" },
  { name: "Student Health Center", isOpen: true, hours: "9:00 AM – 5:00 PM" },
  { name: "Advising Office", isOpen: true, hours: "10:00 AM – 4:00 PM" },
];

export function DiningServices() {
  const { data: servicesData, isLoading, error } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("services" as any)
        .select("name,category,is_open,hours")) as unknown as {
          data: { name: string; category: "dining" | "service"; is_open: boolean; hours: string | null }[] | null;
          error: any;
        };
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const dining = (servicesData && servicesData.length > 0)
    ? servicesData.filter(s => s.category === "dining").map<Service>(s => ({
        name: s.name,
        isOpen: s.is_open,
        hours: s.hours ?? "",
        url: MOCK_DINING.find(d => d.name === s.name)?.url, // match URL if available
      }))
    : MOCK_DINING;

  const otherServices = (servicesData && servicesData.length > 0)
    ? servicesData.filter(s => s.category === "service").map<Service>(s => ({
        name: s.name,
        isOpen: s.is_open,
        hours: s.hours ?? "",
      }))
    : MOCK_SERVICES;

  return (
    <Card className="shadow-primary/10 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 size={18} /> Dining & Campus Services
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {isLoading && <div className="text-sm text-muted-foreground">Loading services…</div>}
        {error && <div className="text-sm text-destructive">Unable to load services. Showing current defaults.</div>}

        <div>
          <div className="text-sm font-medium mb-2">Dining Halls</div>
          <div className="grid grid-cols-1 gap-2">
            {dining.map((d) => (
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
                    <Clock size={12} /> {d.hours}
                  </div>
                </div>
                <Badge
                  variant={d.isOpen ? "default" : "secondary"}
                  className={d.isOpen ? "bg-green-600" : "bg-gray-500"}
                >
                  {d.isOpen ? "Open" : "Closed"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Campus Services</div>
          <div className="grid grid-cols-1 gap-2">
            {otherServices.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-lg border p-3 bg-card/60">
                <div>
                  <div className="font-medium text-sm">{s.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} /> {s.hours}
                  </div>
                </div>
                <Badge
                  variant={s.isOpen ? "default" : "secondary"}
                  className={s.isOpen ? "bg-green-600" : "bg-gray-500"}
                >
                  {s.isOpen ? "Open" : "Closed"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
