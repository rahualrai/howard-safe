import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEmergencyContacts, type EmergencyContact } from "@/hooks/useEmergencyContacts";
import { Phone, MessageSquare, Plus, Edit, Trash2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmergencyContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

export function EmergencyContactsDialog({ open, onOpenChange, userId }: EmergencyContactsDialogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({
    title: '',
    contact: '',
    description: '',
    category: 'emergency-contacts' as 'emergency-contacts' | 'support-services' | 'safety-resources',
    priority: 0,
  });

  const {
    contacts,
    addUserContact,
    updateUserContact,
    deleteUserContact,
    isUserContact,
    refetch,
  } = useEmergencyContacts(userId);

  const { toast } = useToast();

  // Get only user's personal contacts
  const personalContacts = contacts.filter(contact => isUserContact(contact));

  // Helper to extract phone number
  const extractPhoneNumber = (contact: string): string => {
    return contact.replace(/[^\d+]/g, '');
  };

  // Check if contact is a phone number
  const isPhoneNumber = (contact: string): boolean => {
    const trimmedContact = contact.trim();
    if (trimmedContact === '911') return true;
    const cleanedContact = trimmedContact.replace(/[A-Za-z]/g, '');
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    const digitCount = (cleanedContact.match(/\d/g) || []).length;
    return phoneRegex.test(cleanedContact) && digitCount >= 7 && 
           !trimmedContact.toLowerCase().includes('download') && 
           !trimmedContact.toLowerCase().includes('campus-wide');
  };

  // Handle call
  const handleCall = (contact: string, title: string) => {
    const phoneNumber = extractPhoneNumber(contact);
    const telUrl = `tel:${phoneNumber}`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.href = telUrl;
    } else {
      navigator.clipboard.writeText(phoneNumber).then(() => {
        toast({ title: "Phone number copied", description: `${phoneNumber} copied to clipboard.` });
      });
    }
  };

  // Handle text
  const handleText = (contact: string, title: string) => {
    const phoneNumber = extractPhoneNumber(contact);
    const smsUrl = `sms:${phoneNumber}`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.href = smsUrl;
    } else {
      navigator.clipboard.writeText(phoneNumber).then(() => {
        toast({ title: "Phone number copied", description: `${phoneNumber} copied to clipboard.` });
      });
    }
  };

  const handleSave = async () => {
    if (!newContact.title || !newContact.contact) {
      toast({
        title: "Missing information",
        description: "Please fill in name and phone number.",
        variant: "destructive",
      });
      return;
    }

    if (editingContact) {
      await updateUserContact(editingContact, newContact);
    } else {
      await addUserContact({
        ...newContact,
        is_active: true,
      });
    }

    setShowAddForm(false);
    setEditingContact(null);
    setNewContact({
      title: '',
      contact: '',
      description: '',
      category: 'emergency-contacts',
      priority: 0,
    });
  };

  const handleEdit = (contact: EmergencyContact) => {
    setNewContact({
      title: contact.title,
      contact: contact.contact,
      description: contact.description,
      category: contact.category as 'emergency-contacts' | 'support-services' | 'safety-resources',
      priority: contact.priority,
    });
    setEditingContact(contact.id);
    setShowAddForm(true);
  };

  const handleDelete = async (contactId: string, title: string) => {
    if (confirm(`Delete ${title}?`)) {
      await deleteUserContact(contactId);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setShowAddForm(false);
      setEditingContact(null);
      setNewContact({
        title: '',
        contact: '',
        description: '',
        category: 'emergency-contacts',
        priority: 0,
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Emergency Contacts</DialogTitle>
          <DialogDescription>
            Manage your personal emergency contacts. These are only visible to you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add/Edit Form */}
          {showAddForm ? (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label htmlFor="title">Name</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Mom, Dad, Best Friend"
                    value={newContact.title}
                    onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contact">Phone Number</Label>
                  <Input
                    id="contact"
                    placeholder="e.g., (202) 555-1234"
                    value={newContact.contact}
                    onChange={(e) => setNewContact({ ...newContact, contact: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., Emergency contact, Family member"
                    value={newContact.description}
                    onChange={(e) => setNewContact({ ...newContact, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newContact.category}
                    onValueChange={(value: 'emergency-contacts' | 'support-services' | 'safety-resources') =>
                      setNewContact({ ...newContact, category: value })
                    }
                  >
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
                <div className="flex gap-2">
                  <Button onClick={handleSave}>
                    {editingContact ? 'Update' : 'Add'} Contact
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingContact(null);
                      setNewContact({
                        title: '',
                        contact: '',
                        description: '',
                        category: 'emergency-contacts',
                        priority: 0,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Emergency Contact
            </Button>
          )}

          {/* Personal Contacts List */}
          {personalContacts.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold">Your Personal Contacts ({personalContacts.length})</h3>
              {personalContacts.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{contact.title}</h4>
                          <Badge variant="outline" className="text-xs">Personal</Badge>
                        </div>
                        {contact.description && (
                          <p className="text-sm text-muted-foreground mb-2">{contact.description}</p>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {contact.contact}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        {isPhoneNumber(contact.contact) && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleCall(contact.contact, contact.title)}
                              className="h-8 w-8 p-0"
                              title={`Call ${contact.title}`}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleText(contact.contact, contact.title)}
                              className="h-8 w-8 p-0"
                              title={`Text ${contact.title}`}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(contact)}
                          className="h-8 w-8 p-0"
                          title="Edit contact"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(contact.id, contact.title)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Delete contact"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No personal emergency contacts yet.</p>
              <p className="text-sm mt-2">Click "Add Emergency Contact" to add one.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

