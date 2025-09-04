import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MapIcon, Shield, Users, BookOpen, ExternalLink, Clock } from "lucide-react";

export default function Resources() {
  const emergencyContacts = [
    { name: "Campus Security", number: "(202) 806-1100", available: "24/7", type: "emergency" },
    { name: "Emergency Services", number: "911", available: "24/7", type: "emergency" },
    { name: "Student Health Center", number: "(202) 806-7540", available: "M-F 8AM-5PM", type: "health" },
    { name: "Counseling Services", number: "(202) 806-6870", available: "M-F 9AM-5PM", type: "mental-health" }
  ];

  const campusResources = [
    {
      title: "Safety Escort Service",
      description: "Free walking escort service available during evening hours",
      hours: "6PM - 2AM Daily",
      contact: "(202) 806-1100",
      icon: Users
    },
    {
      title: "Emergency Blue Light Phones",
      description: "Located throughout campus for immediate emergency assistance",
      hours: "Available 24/7",
      contact: "Press button for direct connection",
      icon: Phone
    },
    {
      title: "Campus Safety App",
      description: "Additional mobile app with GPS tracking and emergency alerts",
      hours: "Download from app store",
      contact: "Better Safe App",
      icon: Shield
    }
  ];

  const safetyPrograms = [
    "Self-Defense Classes",
    "Safety Awareness Workshops",
    "Bystander Intervention Training",
    "Personal Safety Seminars",
    "Emergency Response Drills"
  ];

  const getContactTypeColor = (type: string) => {
    switch (type) {
      case "emergency": return "bg-destructive/10 text-destructive border-destructive/20";
      case "health": return "bg-success/10 text-success border-success/20";
      case "mental-health": return "bg-primary/10 text-primary border-primary/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-soft border-b border-border">
        <div className="px-mobile-padding py-4">
          <h1 className="text-xl font-semibold text-foreground text-center">Resources</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Campus safety resources and contacts
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-mobile-padding pt-6 pb-24">
        {/* Emergency Contacts */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Emergency Contacts</h2>
          
          <div className="space-y-3">
            {emergencyContacts.map((contact, index) => (
              <Card key={index} className="shadow-soft border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground">{contact.name}</h3>
                        <Badge 
                          variant="secondary" 
                          className={getContactTypeColor(contact.type)}
                        >
                          {contact.type.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-mono text-primary">{contact.number}</span>
                        <div className="flex items-center text-muted-foreground">
                          <Clock size={12} className="mr-1" />
                          {contact.available}
                        </div>
                      </div>
                    </div>
                    
                    <Button size="sm" variant="outline" className="ml-2">
                      <Phone size={14} className="mr-1" />
                      Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Campus Resources */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Campus Resources</h2>
          
          <div className="space-y-4">
            {campusResources.map((resource, index) => {
              const IconComponent = resource.icon;
              
              return (
                <Card key={index} className="shadow-soft border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="text-primary" size={18} />
                      </div>
                      {resource.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                      {resource.description}
                    </p>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hours:</span>
                        <span className="font-medium">{resource.hours}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contact:</span>
                        <span className="font-medium">{resource.contact}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Safety Programs */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Safety Programs</h2>
          
          <Card className="shadow-soft border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="text-primary" size={18} />
                Available Programs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {safetyPrograms.map((program, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                  >
                    <span className="text-sm text-foreground">{program}</span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Learn More
                      <ExternalLink size={12} className="ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Resources */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Additional Resources</h2>
          
          <div className="grid grid-cols-1 gap-3">
            <Card className="shadow-soft border-border cursor-pointer hover:shadow-primary transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapIcon className="text-primary" size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Campus Map</h3>
                      <p className="text-xs text-muted-foreground">Interactive safety map</p>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-border cursor-pointer hover:shadow-primary transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <Shield className="text-success" size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Safety Guidelines</h3>
                      <p className="text-xs text-muted-foreground">Complete safety handbook</p>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

    </div>
  );
}