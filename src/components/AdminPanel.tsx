import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  CalendarDays, 
  Building2, 
  Link as LinkIcon,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types
interface EmergencyContact {
  id: string;
  title: string;
  contact: string;
  description: string;
  category: string;
  priority: number;
  is_active: boolean;
}

interface Event {
  id: string;
  title: string;
  starts_at: string;
  category: "academic" | "social" | "career" | "cultural";
  location: string;
}

interface Service {
  id: string;
  name: string;
  category: "dining" | "service";
  hours: string | null;
  url: string | null;
  open_time: string | null;
  close_time: string | null;
  days_open: string[] | null;
  is_closed: boolean;
}

interface DefaultQuickLink {
  id: string;
  label: string;
  href: string;
  order_index: number;
  is_active: boolean;
}

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  release_date: string;
}

interface Incident {
  id: string;
  category: string;
  location_text: string | null;
  description: string;
  status: string;
  reported_at: string;
  is_anonymous: boolean;
}

export function AdminPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("contacts");
  const [loading, setLoading] = useState(true);

  // Emergency Contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [contactForm, setContactForm] = useState({
    title: "",
    contact: "",
    description: "",
    category: "emergency-contacts",
    priority: 1,
  });

  // Events
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    starts_at: new Date().toISOString().slice(0, 16),
    category: "academic" as Event["category"],
    location: "",
  });

  // Services
  const [services, setServices] = useState<Service[]>([]);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    category: "dining" as Service["category"],
    hours: "",
    url: "",
    open_time: "",
    close_time: "",
    days_open: [] as string[],
    is_closed: false,
  });

  // Default Quick Links
  const [defaultLinks, setDefaultLinks] = useState<DefaultQuickLink[]>([]);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<DefaultQuickLink | null>(null);
  const [linkForm, setLinkForm] = useState({
    label: "",
    href: "",
    order_index: 0,
  });

  // Changelog
  const [changelogEntries, setChangelogEntries] = useState<ChangelogEntry[]>([]);
  const [showChangelogDialog, setShowChangelogDialog] = useState(false);
  const [editingChangelog, setEditingChangelog] = useState<ChangelogEntry | null>(null);
  const [changelogForm, setChangelogForm] = useState({
    version: "",
    title: "",
    description: "",
    release_date: new Date().toISOString().split("T")[0],
  });

  // Incidents (view-only)
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentFilter, setIncidentFilter] = useState<"all" | "pending" | "investigating" | "resolved">("all");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchContacts(),
        fetchEvents(),
        fetchServices(),
        fetchDefaultLinks(),
        fetchChangelog(),
        fetchIncidents(),
      ]);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Emergency Contacts Management
  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .is("user_id", null) // Only global contacts
        .order("priority", { ascending: false })
        .order("title", { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: "Failed to load emergency contacts.",
        variant: "destructive",
      });
    }
  };

  const handleContactSubmit = async () => {
    try {
      if (editingContact) {
        const { error } = await supabase
          .from("emergency_contacts")
          .update({
            title: contactForm.title,
            contact: contactForm.contact,
            description: contactForm.description,
            category: contactForm.category,
            priority: contactForm.priority,
          })
          .eq("id", editingContact.id);

        if (error) throw error;
        toast({ title: "Success", description: "Emergency contact updated." });
      } else {
        const { error } = await supabase
          .from("emergency_contacts")
          .insert({
            title: contactForm.title,
            contact: contactForm.contact,
            description: contactForm.description,
            category: contactForm.category,
            priority: contactForm.priority,
            is_active: true,
            user_id: null, // Global contact
          });

        if (error) throw error;
        toast({ title: "Success", description: "Emergency contact added." });
      }

      setShowContactDialog(false);
      setEditingContact(null);
      setContactForm({ title: "", contact: "", description: "", category: "emergency-contacts", priority: 1 });
      fetchContacts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save emergency contact.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to delete this emergency contact?")) return;

    try {
      const { error } = await supabase
        .from("emergency_contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "Emergency contact deleted." });
      fetchContacts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete emergency contact.",
        variant: "destructive",
      });
    }
  };

  // Events Management
  const fetchEvents = async () => {
    try {
      const { data, error } = await (supabase
        .from("events" as any)
        .select("*")
        .order("starts_at", { ascending: true })) as unknown as { data: Event[] | null; error: any };

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error("Error fetching events:", error);
    }
  };

  const handleEventSubmit = async () => {
    try {
      if (editingEvent) {
        const { error } = await (supabase
          .from("events" as any)
          .update({
            title: eventForm.title,
            starts_at: eventForm.starts_at,
            category: eventForm.category,
            location: eventForm.location,
          })
          .eq("id", editingEvent.id)) as unknown as { error: any };

        if (error) throw error;
        toast({ title: "Success", description: "Event updated." });
      } else {
        const { error } = await (supabase
          .from("events" as any)
          .insert({
            title: eventForm.title,
            starts_at: eventForm.starts_at,
            category: eventForm.category,
            location: eventForm.location,
          })) as unknown as { error: any };

        if (error) throw error;
        toast({ title: "Success", description: "Event added." });
      }

      setShowEventDialog(false);
      setEditingEvent(null);
      setEventForm({ title: "", starts_at: new Date().toISOString().slice(0, 16), category: "academic", location: "" });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save event.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await (supabase
        .from("events" as any)
        .delete()
        .eq("id", id)) as unknown as { error: any };

      if (error) throw error;
      toast({ title: "Success", description: "Event deleted." });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event.",
        variant: "destructive",
      });
    }
  };

  // Services Management
  const fetchServices = async () => {
    try {
      const { data, error } = await (supabase
        .from("services" as any)
        .select("*")
        .order("name", { ascending: true })) as unknown as { data: Service[] | null; error: any };

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      console.error("Error fetching services:", error);
    }
  };

  const handleServiceSubmit = async () => {
    try {
      if (editingService) {
        const { error } = await (supabase
          .from("services" as any)
          .update({
            name: serviceForm.name,
            category: serviceForm.category,
            hours: serviceForm.hours || null,
            url: serviceForm.url || null,
            open_time: serviceForm.open_time || null,
            close_time: serviceForm.close_time || null,
            days_open: serviceForm.days_open.length > 0 ? serviceForm.days_open : null,
            is_closed: serviceForm.is_closed,
          })
          .eq("id", editingService.id)) as unknown as { error: any };

        if (error) throw error;
        toast({ title: "Success", description: "Service updated." });
      } else {
        const { error } = await (supabase
          .from("services" as any)
          .insert({
            name: serviceForm.name,
            category: serviceForm.category,
            hours: serviceForm.hours || null,
            url: serviceForm.url || null,
            open_time: serviceForm.open_time || null,
            close_time: serviceForm.close_time || null,
            days_open: serviceForm.days_open.length > 0 ? serviceForm.days_open : null,
            is_closed: serviceForm.is_closed,
          })) as unknown as { error: any };

        if (error) throw error;
        toast({ title: "Success", description: "Service added." });
      }

      setShowServiceDialog(false);
      setEditingService(null);
      setServiceForm({ name: "", category: "dining", hours: "", url: "", open_time: "", close_time: "", days_open: [], is_closed: false });
      fetchServices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save service.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const { error } = await (supabase
        .from("services" as any)
        .delete()
        .eq("id", id)) as unknown as { error: any };

      if (error) throw error;
      toast({ title: "Success", description: "Service deleted." });
      fetchServices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service.",
        variant: "destructive",
      });
    }
  };

  // Default Quick Links Management
  const fetchDefaultLinks = async () => {
    try {
      const { data, error } = await (supabase
        .from("default_quick_links" as any)
        .select("*")
        .order("order_index", { ascending: true })) as unknown as { data: DefaultQuickLink[] | null; error: any };

      if (error) throw error;
      setDefaultLinks(data || []);
    } catch (error: any) {
      console.error("Error fetching default links:", error);
    }
  };

  const handleLinkSubmit = async () => {
    try {
      if (editingLink) {
        const { error } = await (supabase
          .from("default_quick_links" as any)
          .update({
            label: linkForm.label,
            href: linkForm.href,
            order_index: linkForm.order_index,
          })
          .eq("id", editingLink.id)) as unknown as { error: any };

        if (error) throw error;
        toast({ title: "Success", description: "Default link updated." });
      } else {
        const { error } = await (supabase
          .from("default_quick_links" as any)
          .insert({
            label: linkForm.label,
            href: linkForm.href,
            order_index: linkForm.order_index,
            is_active: true,
          })) as unknown as { error: any };

        if (error) throw error;
        toast({ title: "Success", description: "Default link added." });
      }

      setShowLinkDialog(false);
      setEditingLink(null);
      setLinkForm({ label: "", href: "", order_index: 0 });
      fetchDefaultLinks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save default link.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm("Are you sure you want to delete this default link?")) return;

    try {
      const { error } = await (supabase
        .from("default_quick_links" as any)
        .delete()
        .eq("id", id)) as unknown as { error: any };

      if (error) throw error;
      toast({ title: "Success", description: "Default link deleted." });
      fetchDefaultLinks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete default link.",
        variant: "destructive",
      });
    }
  };

  // Changelog Management
  const fetchChangelog = async () => {
    try {
      const { data, error } = await supabase
        .from("changelog_entries")
        .select("*")
        .order("release_date", { ascending: false });

      if (error) throw error;
      setChangelogEntries(data || []);
    } catch (error: any) {
      console.error("Error fetching changelog:", error);
    }
  };

  const handleChangelogSubmit = async () => {
    try {
      if (editingChangelog) {
        const { error } = await supabase
          .from("changelog_entries")
          .update({
            version: changelogForm.version,
            title: changelogForm.title,
            description: changelogForm.description,
            release_date: changelogForm.release_date,
          })
          .eq("id", editingChangelog.id);

        if (error) throw error;
        toast({ title: "Success", description: "Changelog entry updated." });
      } else {
        const { error } = await supabase
          .from("changelog_entries")
          .insert({
            version: changelogForm.version,
            title: changelogForm.title,
            description: changelogForm.description,
            release_date: changelogForm.release_date,
          });

        if (error) throw error;
        toast({ title: "Success", description: "Changelog entry added." });
      }

      setShowChangelogDialog(false);
      setEditingChangelog(null);
      setChangelogForm({ version: "", title: "", description: "", release_date: new Date().toISOString().split("T")[0] });
      fetchChangelog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save changelog entry.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChangelog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this changelog entry?")) return;

    try {
      const { error } = await supabase
        .from("changelog_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "Changelog entry deleted." });
      fetchChangelog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete changelog entry.",
        variant: "destructive",
      });
    }
  };

  // Incidents (View-only)
  const fetchIncidents = async () => {
    try {
      let query = supabase
        .from("incident_reports" as any)
        .select("*")
        .order("reported_at", { ascending: false })
        .limit(50);

      if (incidentFilter !== "all") {
        query = query.eq("status", incidentFilter);
      }

      const { data, error } = await query as unknown as { data: Incident[] | null; error: any };

      if (error) throw error;
      setIncidents(data || []);
    } catch (error: any) {
      console.error("Error fetching incidents:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "incidents") {
      fetchIncidents();
    }
  }, [activeTab, incidentFilter]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading admin panel...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
        </TabsList>

        {/* Emergency Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Emergency Contacts</h3>
            </div>
            <Button size="sm" onClick={() => {
              setEditingContact(null);
              setContactForm({ title: "", contact: "", description: "", category: "emergency-contacts", priority: 1 });
              setShowContactDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-1" />
              Add Contact
            </Button>
          </div>

          <div className="space-y-2">
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No emergency contacts yet.</p>
            ) : (
              contacts.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{contact.title}</span>
                          <Badge variant="outline">{contact.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{contact.contact}</p>
                        {contact.description && (
                          <p className="text-xs text-muted-foreground mt-1">{contact.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingContact(contact);
                            setContactForm({
                              title: contact.title,
                              contact: contact.contact,
                              description: contact.description,
                              category: contact.category,
                              priority: contact.priority,
                            });
                            setShowContactDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Campus Events</h3>
            </div>
            <Button size="sm" onClick={() => {
              setEditingEvent(null);
              setEventForm({ title: "", starts_at: new Date().toISOString().slice(0, 16), category: "academic", location: "" });
              setShowEventDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-1" />
              Add Event
            </Button>
          </div>

          <div className="space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            ) : (
              events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.title}</span>
                          <Badge variant="outline">{event.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.starts_at), "MMM d, yyyy 'at' h:mm a")} • {event.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingEvent(event);
                            setEventForm({
                              title: event.title,
                              starts_at: event.starts_at.slice(0, 16),
                              category: event.category,
                              location: event.location,
                            });
                            setShowEventDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Dining & Services</h3>
            </div>
            <Button size="sm" onClick={() => {
              setEditingService(null);
              setServiceForm({ name: "", category: "dining", hours: "", url: "", open_time: "", close_time: "", days_open: [], is_closed: false });
              setShowServiceDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-1" />
              Add Service
            </Button>
          </div>

          <div className="space-y-2">
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services yet.</p>
            ) : (
              services.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{service.name}</span>
                          <Badge variant="outline">{service.category}</Badge>
                          {service.is_closed && <Badge variant="destructive">Closed</Badge>}
                        </div>
                        {service.hours && (
                          <p className="text-sm text-muted-foreground">{service.hours}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingService(service);
                            setServiceForm({
                              name: service.name,
                              category: service.category,
                              hours: service.hours || "",
                              url: service.url || "",
                              open_time: service.open_time || "",
                              close_time: service.close_time || "",
                              days_open: service.days_open || [],
                              is_closed: service.is_closed,
                            });
                            setShowServiceDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Default Quick Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Default Quick Links</h3>
            </div>
            <Button size="sm" onClick={() => {
              setEditingLink(null);
              setLinkForm({ label: "", href: "", order_index: defaultLinks.length });
              setShowLinkDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-1" />
              Add Link
            </Button>
          </div>

          <div className="space-y-2">
            {defaultLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No default links yet.</p>
            ) : (
              defaultLinks.map((link) => (
                <Card key={link.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{link.label}</span>
                          <Badge variant="outline">Order: {link.order_index}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{link.href}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingLink(link);
                            setLinkForm({
                              label: link.label,
                              href: link.href,
                              order_index: link.order_index,
                            });
                            setShowLinkDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Changelog Tab */}
        <TabsContent value="changelog" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Changelog Entries</h3>
            </div>
            <Button size="sm" onClick={() => {
              setEditingChangelog(null);
              setChangelogForm({ version: "", title: "", description: "", release_date: new Date().toISOString().split("T")[0] });
              setShowChangelogDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-1" />
              Add Entry
            </Button>
          </div>

          <div className="space-y-2">
            {changelogEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No changelog entries yet.</p>
            ) : (
              changelogEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{entry.title}</span>
                          <Badge variant="secondary">{entry.version}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(entry.release_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingChangelog(entry);
                            setChangelogForm({
                              version: entry.version,
                              title: entry.title,
                              description: entry.description,
                              release_date: entry.release_date,
                            });
                            setShowChangelogDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteChangelog(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Incidents View (Separate Section) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Incident Reports (View Only)</CardTitle>
            </div>
            <Select value={incidentFilter} onValueChange={(value: any) => setIncidentFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {incidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No incidents found.</p>
            ) : (
              incidents.map((incident) => (
                <Card key={incident.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{incident.category}</span>
                          <Badge variant={incident.status === "resolved" ? "default" : "destructive"}>
                            {incident.status}
                          </Badge>
                          {incident.is_anonymous && <Badge variant="outline">Anonymous</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                        {incident.location_text && (
                          <p className="text-xs text-muted-foreground mt-1">Location: {incident.location_text}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Reported: {format(new Date(incident.reported_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit Emergency Contact" : "Add Emergency Contact"}</DialogTitle>
            <DialogDescription>
              {editingContact ? "Update the emergency contact." : "Create a new global emergency contact."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="contact_title">Title</Label>
              <Input
                id="contact_title"
                value={contactForm.title}
                onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
                placeholder="Campus Security"
              />
            </div>
            <div>
              <Label htmlFor="contact_contact">Contact</Label>
              <Input
                id="contact_contact"
                value={contactForm.contact}
                onChange={(e) => setContactForm({ ...contactForm, contact: e.target.value })}
                placeholder="(202) 806-HELP"
              />
            </div>
            <div>
              <Label htmlFor="contact_description">Description</Label>
              <Textarea
                id="contact_description"
                value={contactForm.description}
                onChange={(e) => setContactForm({ ...contactForm, description: e.target.value })}
                placeholder="24/7 emergency response"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="contact_category">Category</Label>
              <Select value={contactForm.category} onValueChange={(value) => setContactForm({ ...contactForm, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emergency-contacts">Emergency Contacts</SelectItem>
                  <SelectItem value="support-services">Support Services</SelectItem>
                  <SelectItem value="safety-resources">Safety Resources</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contact_priority">Priority (lower = higher priority)</Label>
              <Input
                id="contact_priority"
                type="number"
                value={contactForm.priority}
                onChange={(e) => setContactForm({ ...contactForm, priority: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowContactDialog(false)}>Cancel</Button>
              <Button onClick={handleContactSubmit}>{editingContact ? "Update" : "Add"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Add Event"}</DialogTitle>
            <DialogDescription>
              {editingEvent ? "Update the campus event." : "Create a new campus event."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="event_title">Title</Label>
              <Input
                id="event_title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Career Fair: Tech & Startups"
              />
            </div>
            <div>
              <Label htmlFor="event_category">Category</Label>
              <Select value={eventForm.category} onValueChange={(value: any) => setEventForm({ ...eventForm, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="career">Career</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="event_location">Location</Label>
              <Input
                id="event_location"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                placeholder="Blackburn Ballroom"
              />
            </div>
            <div>
              <Label htmlFor="event_starts_at">Date & Time</Label>
              <Input
                id="event_starts_at"
                type="datetime-local"
                value={eventForm.starts_at}
                onChange={(e) => setEventForm({ ...eventForm, starts_at: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEventDialog(false)}>Cancel</Button>
              <Button onClick={handleEventSubmit}>{editingEvent ? "Update" : "Add"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
            <DialogDescription>
              {editingService ? "Update the dining or campus service." : "Create a new dining or campus service."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="service_name">Name</Label>
              <Input
                id="service_name"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                placeholder="Café Bistro"
              />
            </div>
            <div>
              <Label htmlFor="service_category">Category</Label>
              <Select value={serviceForm.category} onValueChange={(value: any) => setServiceForm({ ...serviceForm, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dining">Dining</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="service_hours">Hours (e.g., "Mon-Fri: 8am-5pm")</Label>
              <Input
                id="service_hours"
                value={serviceForm.hours}
                onChange={(e) => setServiceForm({ ...serviceForm, hours: e.target.value })}
                placeholder="Mon-Fri: 8am-5pm"
              />
            </div>
            <div>
              <Label htmlFor="service_url">URL (optional)</Label>
              <Input
                id="service_url"
                value={serviceForm.url}
                onChange={(e) => setServiceForm({ ...serviceForm, url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="service_open_time">Open Time (e.g., "08:00")</Label>
              <Input
                id="service_open_time"
                value={serviceForm.open_time}
                onChange={(e) => setServiceForm({ ...serviceForm, open_time: e.target.value })}
                placeholder="08:00"
              />
            </div>
            <div>
              <Label htmlFor="service_close_time">Close Time (e.g., "17:00")</Label>
              <Input
                id="service_close_time"
                value={serviceForm.close_time}
                onChange={(e) => setServiceForm({ ...serviceForm, close_time: e.target.value })}
                placeholder="17:00"
              />
            </div>
            <div>
              <Label htmlFor="service_days_open">Days Open (comma-separated, e.g., "monday,tuesday,wednesday")</Label>
              <Input
                id="service_days_open"
                value={serviceForm.days_open.join(",")}
                onChange={(e) => setServiceForm({ ...serviceForm, days_open: e.target.value.split(",").map(d => d.trim()) })}
                placeholder="monday,tuesday,wednesday"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="service_is_closed"
                checked={serviceForm.is_closed}
                onChange={(e) => setServiceForm({ ...serviceForm, is_closed: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="service_is_closed">Currently Closed</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowServiceDialog(false)}>Cancel</Button>
              <Button onClick={handleServiceSubmit}>{editingService ? "Update" : "Add"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink ? "Edit Default Link" : "Add Default Link"}</DialogTitle>
            <DialogDescription>
              {editingLink ? "Update the default quick link." : "Create a new default quick link."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="link_label">Label</Label>
              <Input
                id="link_label"
                value={linkForm.label}
                onChange={(e) => setLinkForm({ ...linkForm, label: e.target.value })}
                placeholder="Canvas"
              />
            </div>
            <div>
              <Label htmlFor="link_href">URL</Label>
              <Input
                id="link_href"
                value={linkForm.href}
                onChange={(e) => setLinkForm({ ...linkForm, href: e.target.value })}
                placeholder="https://canvas.howard.edu"
              />
            </div>
            <div>
              <Label htmlFor="link_order">Order Index (lower = appears first)</Label>
              <Input
                id="link_order"
                type="number"
                value={linkForm.order_index}
                onChange={(e) => setLinkForm({ ...linkForm, order_index: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Cancel</Button>
              <Button onClick={handleLinkSubmit}>{editingLink ? "Update" : "Add"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Changelog Dialog */}
      <Dialog open={showChangelogDialog} onOpenChange={setShowChangelogDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingChangelog ? "Edit Changelog Entry" : "Add Changelog Entry"}</DialogTitle>
            <DialogDescription>
              {editingChangelog ? "Update the changelog entry." : "Create a new changelog entry."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="changelog_version">Version</Label>
              <Input
                id="changelog_version"
                value={changelogForm.version}
                onChange={(e) => setChangelogForm({ ...changelogForm, version: e.target.value })}
                placeholder="1.2.0"
              />
            </div>
            <div>
              <Label htmlFor="changelog_title">Title</Label>
              <Input
                id="changelog_title"
                value={changelogForm.title}
                onChange={(e) => setChangelogForm({ ...changelogForm, title: e.target.value })}
                placeholder="New Feature Release"
              />
            </div>
            <div>
              <Label htmlFor="changelog_description">Description</Label>
              <Textarea
                id="changelog_description"
                value={changelogForm.description}
                onChange={(e) => setChangelogForm({ ...changelogForm, description: e.target.value })}
                placeholder="Describe what's new in this version..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="changelog_release_date">Release Date</Label>
              <Input
                id="changelog_release_date"
                type="date"
                value={changelogForm.release_date}
                onChange={(e) => setChangelogForm({ ...changelogForm, release_date: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowChangelogDialog(false)}>Cancel</Button>
              <Button onClick={handleChangelogSubmit}>{editingChangelog ? "Update" : "Add"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

