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
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-soft z-50">
      <div className="flex justify-around items-center px-2 py-2 max-w-md mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <NavLink
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-all duration-200 min-w-0 flex-1",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium truncate">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}