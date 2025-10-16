import { useState } from "react";
import { Shield, Book, Phone, MapPin, AlertTriangle, Users, Lock, Eye, MessageSquare } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Tips() {
  const [activeTab, setActiveTab] = useState<'tips' | 'resources'>('tips');
  const { toast } = useToast();

  // Helper function to extract phone number from contact string
  const extractPhoneNumber = (contact: string): string => {
    // Remove all non-digit characters except + for international numbers
    const cleaned = contact.replace(/[^\d+]/g, '');
    // If it starts with +, keep it, otherwise add +1 for US numbers
    return cleaned.startsWith('+') ? cleaned : `+1${cleaned}`;
  };

  // Handle tap-to-call functionality
  const handleCall = (contact: string, title: string) => {
    const phoneNumber = extractPhoneNumber(contact);
    const telUrl = `tel:${phoneNumber}`;
    
    try {
      // Try to open the phone dialer
      window.open(telUrl, '_self');
      
      toast({
        title: "Calling...",
        description: `Opening phone dialer for ${title}`,
      });
    } catch (error) {
      // Fallback: copy phone number to clipboard
      navigator.clipboard.writeText(phoneNumber).then(() => {
        toast({
          title: "Phone number copied",
          description: `${phoneNumber} copied to clipboard. Paste it in your phone app.`,
        });
      }).catch(() => {
        toast({
          title: "Unable to call",
          description: `Phone number: ${phoneNumber}`,
          variant: "destructive"
        });
      });
    }
  };

  // Handle tap-to-text functionality
  const handleText = (contact: string, title: string) => {
    const phoneNumber = extractPhoneNumber(contact);
    const smsUrl = `sms:${phoneNumber}`;
    
    try {
      // Try to open the SMS app
      window.open(smsUrl, '_self');
      
      toast({
        title: "Texting...",
        description: `Opening SMS for ${title}`,
      });
    } catch (error) {
      // Fallback: copy phone number to clipboard
      navigator.clipboard.writeText(phoneNumber).then(() => {
        toast({
          title: "Phone number copied",
          description: `${phoneNumber} copied to clipboard. Paste it in your messaging app.`,
        });
      }).catch(() => {
        toast({
          title: "Unable to text",
          description: `Phone number: ${phoneNumber}`,
          variant: "destructive"
        });
      });
    }
  };

  // Check if contact is a phone number (has digits)
  const isPhoneNumber = (contact: string): boolean => {
    return /\d/.test(contact) && !contact.toLowerCase().includes('download') && !contact.toLowerCase().includes('campus-wide');
  };

  const safetyTips = [
    {
      title: "Walk in Well-Lit Areas",
      category: "Night Safety Tips",
      icon: Eye,
      description: "Always use well-lit pathways when walking on campus at night. Avoid shortcuts through dark or isolated areas."
    },
    {
      title: "Travel in Groups",
      category: "Personal Safety",
      icon: Users,
      description: "When possible, walk with friends or classmates, especially during late hours. There's safety in numbers."
    },
    {
      title: "Keep Valuables Secure",
      category: "Personal Security",
      icon: Lock,
      description: "Never leave personal belongings unattended. Lock your dorm room and use secure storage for valuables."
    },
    {
      title: "Know Emergency Locations",
      category: "Emergency Preparedness",
      icon: MapPin,
      description: "Familiarize yourself with the locations of emergency phones and safe buildings on campus."
    },
    {
      title: "Trust Your Instincts",
      category: "Personal Safety",
      icon: AlertTriangle,
      description: "If a situation feels unsafe, remove yourself immediately. Trust your gut feelings about people and places."
    },
    {
      title: "Stay Connected",
      category: "Communication",
      icon: Phone,
      description: "Keep your phone charged and let someone know your whereabouts when going out alone."
    }
  ];

  const resources = [
    {
      category: "Emergency Contacts",
      icon: Phone,
      items: [
        { title: "Campus Security", contact: "(202) 806-HELP (4357)", description: "24/7 campus emergency line" },
        { title: "Metropolitan Police", contact: "911", description: "Emergency police response" },
        { title: "Howard University Hospital", contact: "(202) 865-6100", description: "Campus medical emergency" },
        { title: "Student Health Center", contact: "(202) 806-7540", description: "Non-emergency medical care" },
      ]
    },
    {
      category: "Support Services",
      icon: Users,
      items: [
        { title: "Counseling Services", contact: "(202) 806-6870", description: "Mental health support and counseling" },
        { title: "Title IX Office", contact: "(202) 806-2550", description: "Sexual harassment and discrimination reporting" },
        { title: "Dean of Students", contact: "(202) 806-2755", description: "Student affairs and support" },
        { title: "Campus Ministry", contact: "(202) 806-7280", description: "Spiritual guidance and support" },
      ]
    },
    {
      category: "Safety Resources",
      icon: Shield,
      items: [
        { title: "Safety Escort Service", contact: "(202) 806-4357", description: "Free campus escort service (6 PM - 2 AM)" },
        { title: "Blue Light Phones", contact: "Campus-wide", description: "Emergency phones located throughout campus" },
        { title: "LiveSafe App", contact: "Download from app store", description: "Campus safety app for reporting and alerts" },
        { title: "Safety Training", contact: "(202) 806-1919", description: "Personal safety workshops and training" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground px-4 py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold">Safety Tips & Resources</h1>
          <p className="text-primary-foreground/80 mt-1">Stay informed and prepared</p>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto">
        {/* Tab Navigation */}
        <div className="flex mb-6 bg-muted rounded-lg p-1">
          <Button
            variant={activeTab === 'tips' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('tips')}
            className="flex-1 rounded-md"
          >
            <Shield className="h-4 w-4 mr-2" />
            Tips
          </Button>
          <Button
            variant={activeTab === 'resources' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('resources')}
            className="flex-1 rounded-md"
          >
            <Book className="h-4 w-4 mr-2" />
            Resources
          </Button>
        </div>

        {activeTab === 'tips' ? (
          <div className="space-y-4">
            {safetyTips.map((tip, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <tip.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{tip.title}</CardTitle>
                      <Badge variant="outline" className="mt-1">{tip.category}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {resources.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="flex items-center space-x-2 mb-4">
                  <category.icon className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{category.category}</h2>
                </div>
                <div className="space-y-3">
                  {category.items.map((resource, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{resource.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                            <div className="mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {resource.contact}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Action buttons for phone numbers */}
                          {isPhoneNumber(resource.contact) && (
                            <div className="ml-3 flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleCall(resource.contact, resource.title)}
                                className="h-8 w-8 p-0"
                                title={`Call ${resource.title}`}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleText(resource.contact, resource.title)}
                                className="h-8 w-8 p-0"
                                title={`Text ${resource.title}`}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}