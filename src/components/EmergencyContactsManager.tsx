import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, UserCircle, Trash2, Edit, Star, Plus, Loader2 } from "lucide-react";
import { useUserEmergencyContacts, CreateUserEmergencyContact, UserEmergencyContact } from "@/hooks/useUserEmergencyContacts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface EmergencyContactsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmergencyContactsManager({ open, onOpenChange }: EmergencyContactsManagerProps) {
  const { contacts, loading, addContact, updateContact, deleteContact, setPrimaryContact } = useUserEmergencyContacts();
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<UserEmergencyContact | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateUserEmergencyContact>({
    name: "",
    phone: "",
    email: "",
    relationship: "",
    priority: 0
  });
  const [formLoading, setFormLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingContact) {
        await updateContact(editingContact.id, formData);
      } else {
        await addContact(formData);
      }
      
      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "",
        relationship: "",
        priority: 0
      });
      setShowForm(false);
      setEditingContact(null);
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (contact: UserEmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || "",
      relationship: contact.relationship,
      priority: contact.priority
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContact(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimaryContact(id);
    } catch (error) {
      console.error('Error setting primary contact:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      relationship: "",
      priority: 0
    });
    setShowForm(false);
    setEditingContact(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Emergency Contacts</DialogTitle>
            <DialogDescription>
              Add people to notify when you use Quick Help. They'll receive an alert with your location.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {loading && !showForm ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : showForm ? (
              // Add/Edit Form
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(202) 555-0123"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Select
                    value={formData.relationship}
                    onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                  >
                    <SelectTrigger id="relationship">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Guardian">Guardian</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Partner">Partner</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Roommate">Roommate</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={formLoading} className="flex-1">
                    {formLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>{editingContact ? 'Update' : 'Add'} Contact</>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={formLoading}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              // Contacts List
              <>
                {contacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No emergency contacts yet</p>
                    <p className="text-xs mt-1">Add someone who can help in emergencies</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <Card key={contact.id} className="relative">
                        <CardContent className="p-4">
                          {contact.priority === 1 && (
                            <Badge className="absolute top-2 right-2 bg-amber-500">
                              <Star className="h-3 w-3 mr-1" />
                              Primary
                            </Badge>
                          )}
                          
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm">{contact.name}</h4>
                                <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Phone className="h-3 w-3 mr-2" />
                                {contact.phone}
                              </div>
                              {contact.email && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3 mr-2" />
                                  {contact.email}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 pt-2">
                              {contact.priority !== 1 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSetPrimary(contact.id)}
                                  className="flex-1 text-xs"
                                >
                                  <Star className="h-3 w-3 mr-1" />
                                  Set as Primary
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(contact)}
                                className="text-xs"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteConfirm(contact.id)}
                                className="text-destructive hover:bg-destructive/10 text-xs"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => setShowForm(true)}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Emergency Contact
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This contact will no longer be notified during emergencies. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
