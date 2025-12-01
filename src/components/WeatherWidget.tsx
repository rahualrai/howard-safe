import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Wind, CloudRain, Sun, Cloud, MapPin, School } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocationPermission } from "@/hooks/useLocationPermission";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

interface WeatherWidgetProps {
  trigger?: React.ReactNode;
}

export function WeatherWidget({ trigger }: WeatherWidgetProps) {
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [temperatureUnit, setTemperatureUnit] = useState<"fahrenheit" | "celsius">("fahrenheit");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { getCurrentLocation, permission } = useLocationPermission();

  // Determine which coordinates to use
  const activeCoords = useCurrentLocation && userCoords ? userCoords : HU_COORDS;
  const locationName = useCurrentLocation && userCoords ? "Your Location" : "Howard University";

  const { data, isLoading, error } = useQuery<WeatherResponse>({
    queryKey: ["weather", activeCoords, temperatureUnit],
    queryFn: async () => {
      const params = new URLSearchParams({
        latitude: String(activeCoords.lat),
        longitude: String(activeCoords.lon),
        current: ["temperature_2m", "wind_speed_10m", "weather_code"].join(","),
        hourly: ["temperature_2m", "weather_code"].join(","),
        forecast_days: "2",
        timezone: "auto",
        temperature_unit: temperatureUnit,
        wind_speed_unit: temperatureUnit === "fahrenheit" ? "mph" : "kmh",
      });
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load weather");
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
    enabled: !useCurrentLocation || !!userCoords, // Only fetch if we have coords when using current location
  });

  // Handle switching to current location
  const handleUseCurrentLocation = async () => {
    if (permission === 'denied') {
      return; // Button is already disabled, but double-check
    }

    setIsGettingLocation(true);
    const position = await getCurrentLocation();
    setIsGettingLocation(false);

    if (position) {
      setUserCoords({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });
      setUseCurrentLocation(true);
    } else {
      // If location fetch failed, don't switch to current location mode
      setUseCurrentLocation(false);
    }
  };

  // Handle switching to Howard location
  const handleUseHowardLocation = () => {
    setUseCurrentLocation(false);
  };

  const WidgetContent = (
    <div className="space-y-4">
      {/* Location Selection Buttons */}
      <div className="flex gap-2">
        <Button
          variant={!useCurrentLocation ? "default" : "outline"}
          size="sm"
          className="flex-1 gap-2"
          onClick={handleUseHowardLocation}
        >
          <School size={16} />
          Howard University
        </Button>
        <Button
          variant={useCurrentLocation ? "default" : "outline"}
          size="sm"
          className="flex-1 gap-2"
          onClick={handleUseCurrentLocation}
          disabled={permission === 'denied' || isGettingLocation}
        >
          <MapPin size={16} />
          {isGettingLocation ? "Getting Location..." : "My Location"}
        </Button>
      </div>

      {/* Weather Display */}
      <Card className="shadow-primary/10 border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {useCurrentLocation ? (
                <>
                  <MapPin size={16} className="text-primary" />
                  Weather @ {locationName}
                </>
              ) : (
                <>
                  <School size={16} className="text-primary" />
                  Weather @ HU
                </>
              )}
            </CardTitle>
            {/* Temperature Unit Toggle */}
            <div className="flex gap-1 border rounded-md">
              <Button
                variant={temperatureUnit === "fahrenheit" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setTemperatureUnit("fahrenheit")}
              >
                °F
              </Button>
              <Button
                variant={temperatureUnit === "celsius" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setTemperatureUnit("celsius")}
              >
                °C
              </Button>
            </div>
          </div>
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
                    <span className="text-sm text-muted-foreground">°{temperatureUnit === "fahrenheit" ? "F" : "C"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Wind size={14} /> {Math.round(data.current.wind_speed_10m)} {temperatureUnit === "fahrenheit" ? "mph" : "km/h"}
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-6 gap-2">
                  {(() => {
                    // Get current hour to find the starting index
                    const now = new Date();
                    const currentHour = now.getHours();

                    // Find the index of the current hour in the hourly data
                    const startIndex = data.hourly.time.findIndex(t => {
                      const timeHour = new Date(t).getHours();
                      return timeHour >= currentHour;
                    });

                    // If we can't find current hour, default to 0
                    const fromIndex = startIndex !== -1 ? startIndex : 0;

                    // Get 6 hours starting from current hour (current + next 5)
                    return data.hourly.time.slice(fromIndex, fromIndex + 6).map((t, i) => {
                      const actualIndex = fromIndex + i;
                      return (
                        <div key={t} className="text-center">
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(t).toLocaleTimeString([], { hour: "numeric" })}
                          </div>
                          <div className="flex items-center justify-center gap-1 text-xs">
                            {weatherIcon(data.hourly.weather_code[actualIndex])}
                            {Math.round(data.hourly.temperature_2m[actualIndex])}°
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Thermometer size={16} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (trigger) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Campus Weather</DialogTitle>
          </DialogHeader>
          {WidgetContent}
        </DialogContent>
      </Dialog>
    );
  }

  return WidgetContent;
}
