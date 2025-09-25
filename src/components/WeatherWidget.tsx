import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Wind, CloudRain, Sun, Cloud } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const HU_COORDS = { lat: 38.9226, lon: -77.0190 };

type WeatherResponse = {
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
  };
};

function weatherIcon(code: number) {
  // Open-Meteo WMO codes simplified mapping
  if ([0].includes(code)) return <Sun className="text-yellow-500" size={18} />;
  if ([1, 2].includes(code)) return <Cloud className="text-blue-500" size={18} />;
  if ([3, 45, 48].includes(code)) return <Cloud className="text-slate-500" size={18} />;
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return <CloudRain className="text-blue-600" size={18} />;
  return <Cloud className="text-slate-500" size={18} />;
}

export function WeatherWidget() {
  const { data, isLoading, error } = useQuery<WeatherResponse>({
    queryKey: ["weather", HU_COORDS],
    queryFn: async () => {
      const params = new URLSearchParams({
        latitude: String(HU_COORDS.lat),
        longitude: String(HU_COORDS.lon),
        current: ["temperature_2m", "wind_speed_10m", "weather_code"].join(","),
        hourly: ["temperature_2m", "weather_code"].join(","),
        forecast_days: "1",
        timezone: "auto",
        temperature_unit: "fahrenheit",
        wind_speed_unit: "mph",
      });
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load weather");
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
  });

  return (
    <Card className="shadow-primary/10 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          Weather @ HU
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading weather...</div>
        )}
        {error && (
          <div className="text-sm text-destructive">Unable to load weather. Please try again later.</div>
        )}
        {data && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {weatherIcon(data.current.weather_code)}
              <div>
                <div className="text-2xl font-semibold flex items-baseline gap-1">
                  {Math.round(data.current.temperature_2m)}
                  <span className="text-sm text-muted-foreground">°F</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Wind size={14} /> {Math.round(data.current.wind_speed_10m)} mph
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-4 gap-2">
                {data.hourly.time.slice(0, 4).map((t, i) => (
                  <div key={t} className="text-center">
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(t).toLocaleTimeString([], { hour: "numeric" })}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs">
                      {weatherIcon(data.hourly.weather_code[i])}
                      {Math.round(data.hourly.temperature_2m[i])}°
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Thermometer size={16} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
