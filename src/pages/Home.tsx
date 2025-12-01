import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, AlertCircle, Shield, MapIcon, Sun, IdCard, AlertTriangle, CalendarDays, Building2, Link as LinkIcon, MessageSquare, Bell, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { PullToRefresh } from "@/components/PullToRefresh";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { HapticFeedback } from "@/utils/haptics";
import { ImpactStyle, NotificationType } from "@capacitor/haptics";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { WeatherWidget } from "@/components/WeatherWidget";
import { DigitalID } from "@/components/DigitalID";
import { TitleIXHub } from "@/components/TitleIXHub";
import { EventsCalendar } from "@/components/EventsCalendar";
import { DiningServices } from "@/components/DiningServices";
import { QuickLinksDashboard } from "@/components/QuickLinksDashboard";
import { BisonChat } from "@/components/BisonChat";
import { AppTile } from "@/components/AppTile";
import { sendEmergencyAlert } from "@/utils/emergencyAlert";
import { CalendarStrip } from "@/components/CalendarStrip";
import { cn } from "@/lib/utils";

export default function Home() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const refreshAlerts = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({
      title: "Refreshed",
      description: "Dashboard updated."
    });
  };

  const { isRefreshing, pullDistance, pullToRefreshProps, isTriggered } = usePullToRefresh({
    onRefresh: refreshAlerts,
    threshold: 80
  });

  const handleQuickHelp = async () => {
    await HapticFeedback.impact(ImpactStyle.Heavy);
    await HapticFeedback.notification(NotificationType.Warning);

    toast({
      title: "Sending emergency alert...",
      description: "Getting your location and notifying contacts.",
    });

    const result = await sendEmergencyAlert({
      alertType: 'quick_help',
      message: 'Quick Help button pressed - user may need assistance'
    });

    if (result.success) {
      toast({
        title: "Emergency Alert Sent",
        description: `${result.contactsNotified} emergency contact${result.contactsNotified !== 1 ? 's' : ''} notified with your location.`,
        variant: "default"
      });
    } else {
      toast({
        title: "Alert Failed",
        description: result.error || "Failed to send emergency alert. Please call 911 if needed.",
        variant: "destructive"
      });
    }
  };

  // Pastel card data mapping
  const pastelCards = [
    {
      id: "quick-help",
      title: "Quick Help",
      subtitle: "Emergency Assistance",
      icon: AlertTriangle, // Changed icon to be more generic, emoji will be added in render
      color: "bg-red-100",
      textColor: "text-red-900",
      action: handleQuickHelp,
      buttonText: "SOS",
      fullWidth: true,
      isEmergency: true,
      emoji: "🚨" // Added emoji
    },
    {
      id: "report",
      title: "Report Incident",
      subtitle: "Submit a tip or report",
      icon: AlertTriangle,
      color: "bg-pastel-yellow",
      textColor: "text-yellow-900",
      link: "/report",
      buttonText: "Open"
    },
    {
      id: "map",
      title: "Campus Map",
      subtitle: "Navigate safely",
      icon: MapIcon,
      color: "bg-pastel-sky",
      textColor: "text-blue-900",
      link: "/map",
      buttonText: "View"
    },
    {
      id: "digital-id",
      title: "Digital ID",
      subtitle: "Access campus services",
      icon: IdCard,
      color: "bg-mint-200",
      textColor: "text-teal-900",
      component: DigitalID, // Pass component class/function
      buttonText: "Show"
    },
    {
      id: "weather",
      title: "Weather",
      subtitle: "Current conditions",
      icon: Sun,
      color: "bg-pastel-purple",
      textColor: "text-purple-900",
      component: WeatherWidget, // Placeholder, might need modal
      buttonText: "Check"
    }
  ];

  return (
    <div className="min-h-screen bg-mint-50 pb-32" {...pullToRefreshProps}>
      <PullToRefresh
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        isTriggered={isTriggered}
        onRefresh={refreshAlerts}
      >
        <div className="w-full max-w-md md:max-w-5xl lg:max-w-7xl mx-auto bg-white min-h-screen shadow-2xl overflow-hidden relative transition-all duration-300">
          {/* Curved Header Section */}
          <div className="relative bg-mint-500 pt-12 pb-16 rounded-b-[40px] shadow-lg mb-10 overflow-hidden">
            {/* Decorative Circles */}
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full bg-mint-400/30 blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 rounded-full bg-mint-300/20 blur-2xl" />

            <div className="px-6 relative z-10 flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-friendly font-bold text-white tracking-tight mb-1">
                  Hello, {user?.email?.split('@')[0] || 'Guest'}!
                </h1>
                <p className="text-mint-100 font-medium text-lg">How you feeling today?</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="px-6 -mt-8 relative z-10 space-y-6">

            {/* Calendar Strip */}
            <div className="bg-white dark:bg-card rounded-[32px] p-4 shadow-soft">
              <CalendarStrip />
            </div>

            {/* Stacked Pastel Cards - Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastelCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(card.fullWidth ? "md:col-span-2 lg:col-span-3" : "")}
                >
                  {card.component ? (
                    // If it has a component (like DigitalID), render it with the card as trigger
                    <card.component trigger={
                      <div className="cursor-pointer w-full h-full">
                        <PastelCard card={card} />
                      </div>
                    } />
                  ) : card.link ? (
                    <Link to={card.link} className="block h-full">
                      <PastelCard card={card} />
                    </Link>
                  ) : (
                    <div onClick={card.action} className={cn("h-full", card.action ? "cursor-pointer" : "")}>
                      <PastelCard card={card} />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Other Services Grid (Mini) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 pb-8">
              <AppTile title="Title IX" icon={<Shield size={24} className="text-purple-500" />}>
                <TitleIXHub />
              </AppTile>
              <AppTile title="Events" icon={<CalendarDays size={24} className="text-pink-500" />}>
                <EventsCalendar />
              </AppTile>
              <AppTile title="Dining" icon={<Building2 size={24} className="text-green-500" />}>
                <DiningServices />
              </AppTile>
              <AppTile title="BisonChat" icon={<MessageSquare size={24} className="text-teal-500" />}>
                <BisonChat />
              </AppTile>
            </div>

          </main>
        </div>
      </PullToRefresh>
    </div>
  );
}

function PastelCard({ card }: { card: any }) {
  return (
    <div className={cn(
      "relative p-5 rounded-[28px] flex items-center justify-between shadow-sm transition-transform active:scale-[0.98]",
      card.color,
      card.isEmergency && "shadow-md shadow-red-200 border-2 border-red-200 py-8" // Increased padding for emergency
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm",
          card.isEmergency ? "bg-red-500 text-white" : "bg-white/40"
        )}>
          {card.emoji ? (
            <span className="text-2xl">{card.emoji}</span>
          ) : (
            <card.icon className={cn("w-6 h-6", card.isEmergency ? "text-white" : card.textColor)} />
          )}
        </div>
        <div>
          <h3 className={cn("font-bold text-lg leading-tight", card.textColor)}>{card.title}</h3>
          <p className={cn("text-sm opacity-80 font-medium", card.textColor)}>{card.subtitle}</p>
        </div>
      </div>

      {card.fullWidth ? (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-sm", // Slightly larger button
            card.isEmergency ? "bg-red-600 text-white animate-pulse" : "bg-white"
          )}>
            <Phone className={cn("w-7 h-7", card.isEmergency ? "text-white" : "text-red-500")} />
          </div>
        </div>
      ) : (
        <div className="bg-white/30 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm text-ui-charcoal/80">
          {card.buttonText}
        </div>
      )}
    </div>
  );
}