import { useState, useMemo, useEffect } from "react";
import { Shield, Book, Phone, MapPin, AlertTriangle, Users, Lock, Eye, MessageSquare, Search, Filter, X, Star, Heart, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useEmergencyContacts } from "@/hooks/useEmergencyContacts";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export default function Tips() {
  const [activeTab, setActiveTab] = useState<'tips' | 'resources'>('tips');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Use the new emergency contacts hook with user ID
  const { 
    contacts, 
    groupedContacts, 
    loading, 
    error, 
    lastSyncTime, 
    refetch, 
    isOnline: hookIsOnline,
    isUserContact,
  } = useEmergencyContacts(user?.id);

  // Count personal contacts
  const personalContactsCount = contacts.filter(contact => isUserContact(contact)).length;

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

  /**
   * Determines if a contact string should display call/text buttons.
   * 
   * Rules:
   * 1. Special emergency numbers (911, 112, etc.) - always show buttons
   * 2. Phone numbers with letters (e.g., "HELP") - extract digits and validate
   * 3. Standard phone numbers - must have at least 7 digits
   * 4. Exclude non-phone contacts (websites, email addresses, etc.)
   * 
   * @param contact - The contact string to check
   * @returns true if call/text buttons should be displayed
   */
  const isPhoneNumber = (contact: string): boolean => {
    const trimmedContact = contact.trim();
    
    // Special emergency numbers - always show buttons
    const emergencyNumbers = ['911', '112', '999', '000'];
    if (emergencyNumbers.includes(trimmedContact)) {
      return true;
    }
    
    // Remove all non-digit characters (including letters) to check digit count
    const digitsOnly = trimmedContact.replace(/\D/g, '');
    const digitCount = digitsOnly.length;
    
    // Must have at least 7 digits for a valid phone number
    // (allows for international numbers, extensions, etc.)
    if (digitCount < 7) {
      return false;
    }
    
    // Exclude obvious non-phone contacts
    const lowerContact = trimmedContact.toLowerCase();
    const excludePatterns = [
      'download',
      'campus-wide',
      'http',
      'https',
      'www.',
      '@', // email addresses
      '.com',
      '.org',
      '.edu',
      '.gov',
    ];
    
    if (excludePatterns.some(pattern => lowerContact.includes(pattern))) {
      return false;
    }
    
    // Check if it contains phone-like patterns (digits, spaces, dashes, parentheses, plus)
    // This allows formats like: (202) 806-HELP (4357), +1-202-555-1234, etc.
    const phoneLikePattern = /^[\d\s\-\(\)\+A-Za-z]+$/;
    if (!phoneLikePattern.test(trimmedContact)) {
      return false;
    }
    
    // If we have enough digits and it looks like a phone number, show buttons
    return true;
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

  // Map database categories to display names and icons
  const categoryConfig = {
    'emergency-contacts': { label: 'Other Emergency Contacts', icon: Phone },
    'support-services': { label: 'Other Support Services', icon: Users },
    'safety-resources': { label: 'Other Safety Resources', icon: Shield },
  };

  // Separate global contacts from user-saved contacts
  const globalContacts: typeof contacts = [];
  const personalContacts: typeof contacts = [];
  
  contacts.forEach(contact => {
    if (isUserContact(contact)) {
      personalContacts.push(contact);
    } else {
      globalContacts.push(contact);
    }
  });

  // Group global contacts by category
  const globalGrouped = globalContacts.reduce((acc, contact) => {
    const categoryKey = contact.category;
    if (!acc[categoryKey]) {
      acc[categoryKey] = [];
    }
    acc[categoryKey].push(contact);
    return acc;
  }, {} as Record<string, typeof contacts>);

  // Convert global grouped contacts to the format expected by the UI
  const globalResources = Object.entries(globalGrouped).map(([categoryKey, items]) => ({
    category: categoryConfig[categoryKey as keyof typeof categoryConfig]?.label || categoryKey,
    icon: categoryConfig[categoryKey as keyof typeof categoryConfig]?.icon || Shield,
    items: items.map(item => ({
      title: item.title,
      contact: item.contact,
      description: item.description,
      priority: item.priority,
      id: item.id
    }))
  }));

  // Create "Personal Emergency Contacts" section for personal contacts
  const personalResources = personalContacts.length > 0 ? [{
    category: 'Personal Emergency Contacts',
    icon: Heart,
    items: personalContacts.map(item => ({
      title: item.title,
      contact: item.contact,
      description: item.description,
      priority: item.priority,
      id: item.id
    }))
  }] : [];

  // Combine resources: personal contacts first, then global contacts
  const resources = [...personalResources, ...globalResources];

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('emergency-contacts-favorites');
    if (savedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem('emergency-contacts-favorites', JSON.stringify([...favorites]));
  }, [favorites]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection restored",
        description: "You're back online. Emergency contacts are up to date.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "Showing cached emergency contacts. Some features may be limited.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Generate unique ID for each contact
  const getContactId = (category: string, title: string): string => {
    return `${category.toLowerCase().replace(/\s+/g, '-')}-${title.toLowerCase().replace(/\s+/g, '-')}`;
  };

  // Toggle favorite status
  const toggleFavorite = (contactId: string, title: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(contactId)) {
        newFavorites.delete(contactId);
        toast({
          title: "Removed from favorites",
          description: `${title} removed from your favorites`,
        });
      } else {
        newFavorites.add(contactId);
        toast({
          title: "Added to favorites",
          description: `${title} added to your favorites`,
        });
      }
      return newFavorites;
    });
  };

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

      // Filter items by search query and favorites
      const filteredItems = category.items.filter(item => {
        const contactId = getContactId(category.category, item.title);
        const isFavorite = favorites.has(contactId);
        
        // If showing favorites only, filter by favorite status
        if (showFavoritesOnly && !isFavorite) {
          return false;
        }
        
        // Filter by search query
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
  }, [searchQuery, selectedCategory, favorites, showFavoritesOnly]);

  // Clear search and filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setShowFavoritesOnly(false);
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
            {/* Network Status and Sync Section */}
            <div className="space-y-3">
              {/* Offline Alert */}
              {!hookIsOnline && (
                <Alert className="border-orange-200 bg-orange-50">
                  <WifiOff className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    You're offline. Showing cached emergency contacts. Some features may be limited.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Sync Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {hookIsOnline ? (
                    <Wifi className="h-4 w-4 text-green-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-orange-600" />
                  )}
                  <span>
                    {hookIsOnline ? 'Online' : 'Offline'} • 
                    {lastSyncTime ? ` Last updated: ${lastSyncTime.toLocaleTimeString()}` : ' Never synced'}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refetch}
                  disabled={loading || !hookIsOnline}
                  className="text-xs"
                >
                  {loading ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  {loading ? 'Syncing...' : 'Sync'}
                </Button>
              </div>
            </div>

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

              {/* Favorites Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={showFavoritesOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className="text-xs"
                >
                  <Heart size={12} className="mr-1" />
                  Favorites ({favorites.size})
                </Button>
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
              {(searchQuery || selectedCategory !== 'all' || showFavoritesOnly) && (
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

              {/* Note: Personal contacts are managed from Profile Settings */}
              {user && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  💡 Manage your personal emergency contacts from <strong>Profile Settings</strong>
                </div>
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
                  {category.items.map((resource, index) => {
                    const contactId = getContactId(category.category, resource.title);
                    const isFavorite = favorites.has(contactId);
                    
                    return (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{resource.title}</h3>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleFavorite(contactId, resource.title)}
                                  className="h-6 w-6 p-0"
                                  title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                >
                                  <Star 
                                    className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'}`} 
                                  />
                                </Button>
                              </div>
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
                    );
                  })}
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