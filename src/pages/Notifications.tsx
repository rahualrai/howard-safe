import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Info, Shield, Clock, Settings, X } from "lucide-react";

export default function Notifications() {
  const notifications = [
    {
      id: 1,
      type: "emergency",
      title: "Weather Alert",
      message: "Severe thunderstorm warning in effect until 8:00 PM. Seek indoor shelter and avoid outdoor activities.",
      time: "2 hours ago",
      read: false
    },
    {
      id: 2,
      type: "safety",
      title: "Safety Patrol Update",
      message: "Additional security patrols have been added to the Georgia Ave corridor between 6PM-2AM.",
      time: "4 hours ago",
      read: false
    },
    {
      id: 3,
      type: "info",
      title: "Safety Workshop",
      message: "Personal Safety Workshop scheduled for Friday 3PM in the Student Center. Free registration available.",
      time: "1 day ago",
      read: true
    },
    {
      id: 4,
      type: "incident",
      title: "Incident Report Update",
      message: "Your reported lighting issue near Cramton Auditorium has been resolved. Thank you for keeping campus safe.",
      time: "2 days ago",
      read: true
    },
    {
      id: 5,
      type: "info",
      title: "App Update Available",
      message: "New version of Better Safe app is available with improved emergency features and bug fixes.",
      time: "3 days ago",
      read: true
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "emergency": return AlertTriangle;
      case "safety": return Shield;
      case "incident": return Bell;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "emergency": return "bg-destructive/10 text-destructive border-destructive/20";
      case "safety": return "bg-success/10 text-success border-success/20";
      case "incident": return "bg-accent/10 text-accent border-accent/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-soft border-b border-border">
        <div className="px-mobile-padding py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm">
              <Settings size={18} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-mobile-padding pt-6 pb-24">
        {notifications.length === 0 ? (
          // Empty State
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Notifications</h3>
            <p className="text-muted-foreground text-sm">
              You're all caught up! Check back later for updates.
            </p>
          </div>
        ) : (
          // Notifications List
          <div className="space-y-3">
            {notifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type);
              
              return (
                <Card 
                  key={notification.id} 
                  className={`shadow-soft border-border transition-all ${
                    !notification.read 
                      ? "bg-card border-l-4 border-l-primary" 
                      : "bg-muted/20"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          notification.type === "emergency" ? "bg-destructive/10" :
                          notification.type === "safety" ? "bg-success/10" :
                          notification.type === "incident" ? "bg-accent/10" :
                          "bg-primary/10"
                        }`}>
                          <IconComponent 
                            size={16} 
                            className={
                              notification.type === "emergency" ? "text-destructive" :
                              notification.type === "safety" ? "text-success" :
                              notification.type === "incident" ? "text-accent" :
                              "text-primary"
                            }
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium text-sm ${
                              !notification.read ? "text-foreground" : "text-muted-foreground"
                            }`}>
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          
                          <Badge 
                            variant="secondary" 
                            className={`${getNotificationColor(notification.type)} mb-2 text-xs`}
                          >
                            {notification.type}
                          </Badge>
                          
                          <p className={`text-sm leading-relaxed mb-2 ${
                            !notification.read ? "text-foreground" : "text-muted-foreground"
                          }`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock size={12} className="mr-1" />
                            {notification.time}
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground p-1">
                        <X size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1">
              Mark All Read
            </Button>
            <Button variant="outline" className="flex-1">
              Clear All
            </Button>
          </div>
        )}

        {/* Notification Settings Info */}
        <Card className="mt-6 shadow-soft border-border">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="text-primary mt-0.5" size={20} />
              <div>
                <h3 className="font-medium text-foreground text-sm mb-1">
                  Notification Settings
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To customize your notification preferences, visit the Settings page. You can choose which types of alerts you want to receive and set quiet hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

    </div>
  );
}