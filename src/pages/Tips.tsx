import { useState, useMemo } from "react";
import { Shield, Book, Phone, MapPin, AlertTriangle, Users, Lock, Eye, MessageSquare, Search, Filter, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Tips() {
  const [activeTab, setActiveTab] = useState<'tips' | 'resources'>('tips');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  // Helper function to extract phone number from contact string
  const extractPhoneNumber = (contact: string): string => {
    // Remove all non-digit characters except + for international numbers
    const cleaned = contact.replace(/[^\d+]/g, '');
    
    // If it starts with +, keep it as is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // For numbers without country code, warn user and return as-is
    // Let the device handle the number format
    if (cleaned.length >= 10) {
      return cleaned;
    }
    
    // For very short numbers, return as-is (might be extension or special number)
    return cleaned;
  };

  // Handle tap-to-call functionality
  const handleCall = (contact: string, title: string) => {
    const phoneNumber = extractPhoneNumber(contact);
    const telUrl = `tel:${phoneNumber}`;
    
    // Check if we're on a mobile device or if tel: protocol is supported
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // On mobile devices, try to open the dialer
      window.location.href = telUrl;
      toast({
        title: "Calling...",
        description: `Opening phone dialer for ${title}`,
      });
    } else {
      // On desktop, copy to clipboard as fallback
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
    
    // Check if we're on a mobile device or if sms: protocol is supported
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // On mobile devices, try to open the SMS app
      window.location.href = smsUrl;
      toast({
        title: "Texting...",
        description: `Opening SMS for ${title}`,
      });
    } else {
      // On desktop, copy to clipboard as fallback
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

  // Check if contact is a phone number (robust pattern)
  const isPhoneNumber = (contact: string): boolean => {
    // Matches phone numbers with optional +, digits, spaces, dashes, parentheses
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    const trimmedContact = contact.trim();
    
    // Must match phone pattern and contain at least 7 digits (minimum for valid phone)
    const digitCount = (trimmedContact.match(/\d/g) || []).length;
    
    return phoneRegex.test(trimmedContact) && 
           digitCount >= 7 && 
           !trimmedContact.toLowerCase().includes('download') && 
           !trimmedContact.toLowerCase().includes('campus-wide');
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

  // Get all available categories for filter
  const availableCategories = [
    { value: 'all', label: 'All Categories' },
    ...resources.map(category => ({
      value: category.category.toLowerCase().replace(/\s+/g, '-'),
      label: category.category
    }))
  ];

  // Filter and search logic
  const filteredResources = useMemo(() => {
    return resources.map(category => {
      // Filter by category
      const categoryMatches = selectedCategory === 'all' || 
        category.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
      
      if (!categoryMatches) {
        return { ...category, items: [] };
      }

      // Filter items by search query
      const filteredItems = category.items.filter(item => {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.contact.toLowerCase().includes(query)
        );
      });

      return { ...category, items: filteredItems };
    }).filter(category => category.items.length > 0); // Only show categories with matching items
  }, [searchQuery, selectedCategory]);

  // Clear search and filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

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
            {/* Search and Filter Section */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search emergency contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X size={14} />
                  </Button>
                )}
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <Button
                    key={category.value}
                    variant={selectedCategory === category.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.value)}
                    className="text-xs"
                  >
                    <Filter size={12} className="mr-1" />
                    {category.label}
                  </Button>
                ))}
              </div>

              {/* Clear Filters Button */}
              {(searchQuery || selectedCategory !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={14} className="mr-1" />
                  Clear all filters
                </Button>
              )}

              {/* Results Count */}
              {searchQuery && (
                <div className="text-sm text-muted-foreground">
                  {filteredResources.reduce((total, category) => total + category.items.length, 0)} result(s) found
                </div>
              )}
            </div>

            {/* Filtered Resources */}
            {filteredResources.length > 0 ? (
              filteredResources.map((category, categoryIndex) => (
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
            ))
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or clearing the filters
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}