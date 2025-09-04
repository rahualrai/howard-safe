import { NavLink, useLocation } from "react-router-dom";
import { MapIcon, Shield, AlertTriangle, BookOpen, Bell, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/map", icon: MapIcon, label: "Map" },
  { path: "/safety-tips", icon: Shield, label: "Safety Tips" },
  { path: "/report", icon: AlertTriangle, label: "Report" },
  { path: "/resources", icon: BookOpen, label: "Resources" },
  { path: "/notifications", icon: Bell, label: "Notifications" },
];

export function BottomNavigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 border-t border-border/50 shadow-soft z-[100] backdrop-blur-lg">
      <div className="flex justify-around items-center px-2 py-3 max-w-md mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <NavLink
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-300 min-w-0 flex-1 relative",
                isActive
                  ? "text-primary bg-primary/15 shadow-sm scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30 hover:scale-102"
              )}
            >
              <Icon size={22} className="mb-1" />
              <span className="text-xs font-medium truncate">{label}</span>
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}