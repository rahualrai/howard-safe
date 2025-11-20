import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Bell, User as UserIcon, LogOut, Shield, AlertTriangle, IdCard, Camera, Upload, X as XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSecurityValidation } from "@/hooks/useSecurityValidation";
import { DigitalIDForm } from "@/components/DigitalIDForm";
import { useFriends } from "@/hooks/useFriends";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import { FriendsList } from "@/components/FriendsList";
import { FriendRequests } from "@/components/FriendRequests";
import { AddFriendDialog } from "@/components/AddFriendDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { EmergencyContactsManager } from "@/components/EmergencyContactsManager";
import { useUserEmergencyContacts } from "@/hooks/useUserEmergencyContacts";
import { BugReportDialog } from "@/components/BugReportDialog";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { ChangelogDialog } from "@/components/ChangelogDialog";
import { Info, Bug, MessageSquare, Sparkles, X, Settings } from "lucide-react";
import { useAppUpdates } from "@/hooks/useAppUpdates";
import { useAdmin } from "@/hooks/useAdmin";
import { ProfileSkeleton } from "@/components/ProfileSkeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Type definitions
interface Profile {
  user_id: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

interface LoginInfo {
  created_at: string;
  event_details?: Record<string, unknown>;
}

interface DigitalIDData {
  id: string;
  full_name: string;
  student_id: string;
  program: string;
  class_year: string;
  photo_url?: string;
  status: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [lastLoginInfo, setLastLoginInfo] = useState<LoginInfo | null>(null);
  const [digitalID, setDigitalID] = useState<DigitalIDData | null>(null);
  const [showIDForm, setShowIDForm] = useState(false);
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showDisplayNameDialog, setShowDisplayNameDialog] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [displayNameSaving, setDisplayNameSaving] = useState(false);
  const { toast } = useToast();
  
  // Get app version from package.json
  const appVersion = "1.1.1"; // Update this when releasing new versions
  const navigate = useNavigate();
  
  // Use enhanced security validation
  const { 
    user, 
    loading, 
    isValidSession, 
    secureSignOut, 
    logSecurityEvent 
  } = useSecurityValidation({
    requireAuth: true,
    redirectTo: '/auth'
  });

  // Check for app updates
  const { hasUpdate, latestVersion, markAsSeen } = useAppUpdates(appVersion);
  
  // Check admin status
  const { isAdmin } = useAdmin(user?.id);

  // Friends and location sharing
  const {
    friends,
    friendRequests,
    searchResults,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
  } = useFriends(user?.id);

  const {
    friendsLocations,
    sharingPreferences,
    isSharing,
    updateSharingPreferences,
    startSharingLocation,
    stopSharingLocation,
  } = useLocationSharing(user?.id);

  // Get personal emergency contacts count (for Twilio notifications)
  const { contacts: emergencyContacts } = useUserEmergencyContacts();
  const personalContactsCount = useMemo(() => emergencyContacts.length, [emergencyContacts.length]);

  // Memoize display name
  const currentDisplayName = useMemo(() => {
    return profile?.username || 
           user?.user_metadata?.full_name || 
           user?.user_metadata?.name || 
           user?.email?.split('@')[0] || 
           'User';
  }, [profile?.username, user?.user_metadata?.full_name, user?.user_metadata?.name, user?.email]);

  useEffect(() => {
    if (user && isValidSession) {
      fetchProfile(user.id);
      fetchLastLoginInfo(user.id);
      fetchDigitalID(user.id);
    }
  }, [user, isValidSession]);

  // Initialize display name when profile loads
  useEffect(() => {
    if (profile && !displayName) {
      setDisplayName(currentDisplayName);
    }
  }, [profile, currentDisplayName, displayName]);
  useEffect(() => {
    if (profile?.avatar_url) {
      const getAvatarUrl = async () => {
        const { data, error } = await supabase.storage
          .from('avatars')
          .createSignedUrl(profile.avatar_url, 3600); // URL is valid for 1 hour (3600 seconds)
        
        if (error) {
          console.warn("Could not create signed avatar URL:", error);
        } else {
          setAvatarDisplayUrl(data.signedUrl);
        }
      };
      getAvatarUrl();
    }
  }, [profile]);

  const fetchProfile = async (userId: string) => {
    try {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        await logSecurityEvent('profile_fetch_error', {
          userId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      setProfile(data);
      if (data?.username) {
        setDisplayName(data.username);
      }

      // Log successful profile access
      await logSecurityEvent('profile_accessed', {
        userId,
        timestamp: new Date().toISOString()
      });
    } catch (error: unknown) {
      console.error('Profile fetch error:', error);
      toast({
        title: "Error loading profile",
        description: "Unable to load your profile information.",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Upload avatar to Supabase Storage and update profile.avatar_url
  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!user) {
      toast({ title: 'Not signed in', description: 'Please sign in before uploading.', variant: 'destructive' });
      return;
    }

    setAvatarUploading(true);

    // Build safe filename and bucket
    const fileExt = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
    const safeUserId = String(user.id).replace(/[^a-z0-9-_.]/gi, '-');
    const fileName = `${safeUserId}/avatar.${fileExt}`;
    const bucket = import.meta.env.VITE_SUPABASE_AVATAR_BUCKET || 'avatars';

    try {
      // Optimistic update: show preview immediately
      if (!avatarPreview) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }

      // upload to storage (private bucket expected)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        setAvatarPreview(null);
        const message = uploadError.message || String(uploadError);
        if (message.toLowerCase().includes('bucket') || message.toLowerCase().includes('not found')) {
          toast({ title: 'Upload failed: bucket not found', description: `Bucket "${bucket}" missing. Ask the project owner to create it.`, variant: 'destructive' });
        } else {
          toast({ title: 'Upload failed', description: message, variant: 'destructive' });
        }
        console.error('uploadError', uploadError);
        return;
      }

      // Use upsert to ensure a profile row exists and include user_id so RLS allows the write
      const storagePath = fileName;
      const { data: upserted, error: upsertError } = await supabase
        .from('profiles')
        .upsert([{ user_id: user.id, avatar_url: storagePath, updated_at: new Date().toISOString() }], { onConflict: 'user_id' })
        .select('*')
        .single();

      if (upsertError) {
        setAvatarPreview(null);
        console.error('upsertError', upsertError);
        toast({ title: 'Failed to update profile', description: upsertError.message || String(upsertError), variant: 'destructive' });
        return;
      }

      // Refresh profile locally from returned row if available
      if (upserted) {
        setProfile(upserted as Profile);
        // Clear preview after successful upload
        setAvatarPreview(null);
      } else {
        fetchProfile(user.id);
      }

      toast({ title: 'Avatar uploaded successfully', description: 'Your profile picture has been updated.' });
    } catch (err: unknown) {
      setAvatarPreview(null);
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast({ title: 'Upload failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setAvatarUploading(false);
    }
  }, [user, toast, avatarPreview, fetchProfile]);

  // Handle avatar selection with preview
  const handleAvatarSelect = useCallback(async () => {
    if (!user) {
      toast({ title: 'Not signed in', description: 'Please sign in before uploading.', variant: 'destructive' });
      return;
    }

    // Create file input for web fallback
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Show preview immediately (optimistic update)
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        
        // Upload the file
        await handleAvatarUpload(file);
      }
    };
    input.click();
  }, [user, toast, handleAvatarUpload]);

  // Handle display name update with optimistic update
  const handleDisplayNameUpdate = useCallback(async () => {
    if (!user || !displayName.trim()) {
      toast({ title: 'Invalid name', description: 'Please enter a valid display name.', variant: 'destructive' });
      return;
    }

    setDisplayNameSaving(true);
    const previousName = currentDisplayName;

    try {
      // Optimistic update
      setProfile((prev) => prev ? { ...prev, username: displayName.trim() } : null);

      const { error } = await supabase
        .from('profiles')
        .upsert(
          { 
            user_id: user.id, 
            username: displayName.trim(),
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        // Revert optimistic update on error
        setProfile((prev) => prev ? { ...prev, username: previousName } : null);
        throw error;
      }

      toast({ title: 'Display name updated', description: 'Your display name has been saved.' });
      setShowDisplayNameDialog(false);
    } catch (error: any) {
      console.error('Error updating display name:', error);
      toast({ 
        title: 'Failed to update display name', 
        description: error.message || 'Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setDisplayNameSaving(false);
    }
  }, [user, displayName, currentDisplayName, toast]);

  const fetchLastLoginInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('created_at, event_details')
        .eq('user_id', userId)
        .eq('event_type', 'signin_success')
        .order('created_at', { ascending: false })
        .limit(2); // Get last 2 to show previous login

      if (error) {
        console.warn('Could not fetch login history:', error);
        return;
      }

      if (data && data.length > 1) {
        setLastLoginInfo(data[1] as LoginInfo); // Second most recent is the "last" login
      }
    } catch (error) {
      console.warn('Error fetching login history:', error);
    }
  };

  const fetchDigitalID = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('digital_ids' as any)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching digital ID:', error);
        return;
      }

      const digitalIDData = data as unknown;
      if (digitalIDData && typeof digitalIDData === 'object' && digitalIDData !== null && 'id' in digitalIDData && !('error' in digitalIDData)) {
        setDigitalID(digitalIDData as DigitalIDData);
      } else {
        setDigitalID(null);
      }
    } catch (error) {
      console.error('Digital ID fetch error:', error);
    }
  };

  const handleSignOut = async () => {
    setShowSignOutDialog(false);
    await secureSignOut();
  };

  if (loading || profileLoading) {
    return <ProfileSkeleton />;
  }

  if (!user || !isValidSession) {
    return null; // Security hook will handle redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        </div>
      </header>
      
      <main className="p-4 max-w-md mx-auto space-y-4 pb-24">
        {/* Profile Info */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Account Info</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Avatar */}
            <div className="flex items-center gap-4 pb-3 border-b border-border">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={avatarPreview || avatarDisplayUrl || undefined} 
                    alt="Profile picture" 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {currentDisplayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{currentDisplayName}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAvatarSelect}
                  disabled={avatarUploading}
                  className="mt-1 h-8 text-xs"
                >
                  <Camera className="h-3 w-3 mr-1" />
                  {avatarPreview ? 'Change' : 'Upload'} Photo
                </Button>
              </div>
            </div>

            {/* Display Name - Show user's name prominently */}
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold text-lg">{currentDisplayName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium break-all">{user.email}</p>
            </div>
            {profile?.username && profile.username !== (user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]) && (
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">{String(profile.username)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Member since</p>
              <p className="font-medium">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            {lastLoginInfo && (
              <div>
                <p className="text-sm text-muted-foreground">Last sign in</p>
                <p className="font-medium text-sm">
                  {new Date(lastLoginInfo.created_at).toLocaleString()}
                </p>
              </div>
            )}
            {profile?.updated_at && (
              <div>
                <p className="text-sm text-muted-foreground">Last updated</p>
                <p className="font-medium text-sm">
                  {new Date(profile.updated_at).toLocaleString()}
                </p>
              </div>
            )}
            
            {/* Admin Status - Only visible to admins */}
            {isAdmin && (
              <>
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Account Type</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-semibold">Admin</p>
                        <Badge variant="secondary" className="text-xs">Admin</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/admin')}
                    className="w-full min-h-[44px]"
                    size="default"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Open Admin Panel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-success" />
              <CardTitle className="text-lg">Security Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
              <div>
                <p className="font-medium text-sm text-success">Account Secure</p>
                <p className="text-xs text-muted-foreground">Your account has secure authentication</p>
              </div>
              <Badge variant="secondary" className="bg-success/20 text-success">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Email Verified</p>
                <p className="text-xs text-muted-foreground">Your email has been confirmed</p>
              </div>
              <Badge variant="secondary">
                {user.email_confirmed_at ? "Verified" : "Pending"}
              </Badge>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                For security, we monitor account activity and log access events.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Profile Customization */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Profile Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Digital ID Management */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm flex items-center gap-2">
                  <IdCard size={16} />
                  Digital ID
                </p>
                {digitalID ? (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {digitalID.full_name} • {digitalID.student_id}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Add your student ID information
                  </p>
                )}
              </div>
              <Button 
                size="default"
                onClick={() => setShowIDForm(true)}
                className="min-h-[44px] flex-shrink-0 px-4"
              >
                {digitalID ? 'Edit' : 'Add'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Display Name</p>
                <p className="text-xs text-muted-foreground truncate">{currentDisplayName}</p>
              </div>
              <Button 
                size="default" 
                className="min-h-[44px] flex-shrink-0 px-4"
                onClick={() => {
                  setDisplayName(currentDisplayName);
                  setShowDisplayNameDialog(true);
                }}
              >
                Edit
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Emergency Contacts</p>
                <p className="text-xs text-muted-foreground">
                  {personalContactsCount > 0 
                    ? `${personalContactsCount} personal contact${personalContactsCount !== 1 ? 's' : ''}`
                    : 'People to notify in emergencies'}
                </p>
              </div>
              <Button 
                size="default"
                onClick={() => setShowEmergencyContacts(true)}
                className="min-h-[44px] flex-shrink-0 px-4"
              >
                Manage
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Preferred Language</p>
                <p className="text-xs text-muted-foreground">English (US)</p>
              </div>
              <Button size="default" className="min-h-[44px] flex-shrink-0 px-4">Change</Button>
            </div>
          </CardContent>
        </Card>

        {/* Friends & Location Sharing */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Friends & Location</CardTitle>
            </div>
            <AddFriendDialog
              onSearch={searchUsers}
              searchResults={searchResults}
              onSendRequest={sendFriendRequest}
              currentUserId={user?.id || ''}
              existingFriendIds={friends.map((f) => f.friend_id)}
              pendingRequests={friendRequests.filter((r) => r.status === 'pending')}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location Sharing Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="location-sharing" className="font-medium text-sm cursor-pointer">
                    Share Location with Friends
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isSharing ? 'Your location is being shared' : 'Enable to share your location'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSharing ? (
                  <Button
                    size="default"
                    onClick={stopSharingLocation}
                    className="min-h-[44px] px-4"
                  >
                    Stop
                  </Button>
                ) : (
                  <Switch
                    id="location-sharing"
                    checked={sharingPreferences?.share_with_friends || false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        startSharingLocation();
                      } else {
                        updateSharingPreferences({ share_with_friends: false });
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Friend Requests */}
            {friendRequests.filter((r) => r.status === 'pending').length > 0 && (
              <FriendRequests
                friendRequests={friendRequests}
                currentUserId={user?.id || ''}
                onAccept={acceptFriendRequest}
                onReject={rejectFriendRequest}
                onCancel={cancelFriendRequest}
              />
            )}

            {/* Friends List */}
            <FriendsList
              friends={friends}
              friendsLocations={friendsLocations}
              onRemoveFriend={removeFriend}
            />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Emergency Alerts</p>
                <p className="text-xs text-muted-foreground">Get notified of campus emergencies</p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Safety Updates</p>
                <p className="text-xs text-muted-foreground">Campus safety news and tips</p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Incident Reports</p>
                <p className="text-xs text-muted-foreground">Updates on your submitted reports</p>
              </div>
              <Badge variant="outline">Disabled</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-success" />
              <CardTitle className="text-lg">Privacy & Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add extra security to your account</p>
              </div>
              <Button size="default" className="min-h-[44px] flex-shrink-0 px-4">Setup</Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Privacy Settings</p>
                <p className="text-xs text-muted-foreground">Control who can see your information</p>
              </div>
              <Button size="default" className="min-h-[44px] flex-shrink-0 px-4">Manage</Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Data Export</p>
                <p className="text-xs text-muted-foreground">Download your account data</p>
              </div>
              <Button size="default" className="min-h-[44px] flex-shrink-0 px-4">Export</Button>
            </div>
          </CardContent>
        </Card>

        {/* App & Support */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">App & Support</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Update Available Alert */}
            {hasUpdate && (
              <Alert className="border-primary bg-primary/5">
                <Sparkles className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">New Update Available!</p>
                    <p className="text-xs text-muted-foreground">
                      Version {latestVersion} is now available. Check out what's new!
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="default"
                      size="default"
                      onClick={() => {
                        setShowChangelog(true);
                        markAsSeen();
                      }}
                      className="min-h-[44px]"
                    >
                      View Updates
                    </Button>
                    <Button
                      variant="ghost"
                      size="default"
                      className="min-h-[44px] min-w-[44px] p-0 hover:bg-muted"
                      onClick={() => {
                        markAsSeen();
                        toast({
                          title: "Notification dismissed",
                          description: "You can always check for updates in What's New.",
                          duration: 2000,
                        });
                      }}
                      aria-label="Dismiss update notification"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">App Version</p>
                <p className="text-xs text-muted-foreground">Current version of the app</p>
              </div>
              <Badge variant="secondary">{appVersion}</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="min-w-0">
                  <p className="font-medium text-sm">What's New</p>
                  <p className="text-xs text-muted-foreground">See recent updates and changes</p>
                </div>
                {hasUpdate && (
                  <Badge variant="destructive" className="ml-2 flex-shrink-0">
                    New
                  </Badge>
                )}
              </div>
              <Button 
                size="default" 
                onClick={() => {
                  setShowChangelog(true);
                  markAsSeen();
                }}
                className="min-h-[44px] flex-shrink-0 px-4"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                View
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Report a Bug</p>
                <p className="text-xs text-muted-foreground">Found an issue? Let us know</p>
              </div>
              <Button size="default" onClick={() => setShowBugReport(true)} className="min-h-[44px] flex-shrink-0 px-4">
                <Bug className="h-4 w-4 mr-1" />
                Report
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Send Feedback</p>
                <p className="text-xs text-muted-foreground">Share your thoughts and suggestions</p>
              </div>
              <Button size="default" onClick={() => setShowFeedback(true)} className="min-h-[44px] flex-shrink-0 px-4">
                <MessageSquare className="h-4 w-4 mr-1" />
                Feedback
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button 
          onClick={() => setShowSignOutDialog(true)}
          variant="outline" 
          size="default"
          className="w-full min-h-[44px] mb-4"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </main>

      {/* Digital ID Form Dialog */}
      <DigitalIDForm
        open={showIDForm}
        onOpenChange={setShowIDForm}
        existingData={digitalID}
        onSuccess={() => user && fetchDigitalID(user.id)}
      />

      {/* Emergency Contacts Manager (Twilio Notifications) */}
      <EmergencyContactsManager
        open={showEmergencyContacts}
        onOpenChange={setShowEmergencyContacts}
      />

      {/* Bug Report Dialog */}
      <BugReportDialog
        open={showBugReport}
        onOpenChange={setShowBugReport}
        userId={user?.id || null}
      />

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={showFeedback}
        onOpenChange={setShowFeedback}
        userId={user?.id || null}
      />

      {/* Changelog Dialog */}
      <ChangelogDialog
        open={showChangelog}
        onOpenChange={setShowChangelog}
      />

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Display Name Edit Dialog */}
      <Dialog open={showDisplayNameDialog} onOpenChange={setShowDisplayNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Display Name</DialogTitle>
            <DialogDescription>
              This is how your name will appear in reports and throughout the app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="mt-2"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {displayName.length}/50 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisplayNameDialog(false)}
              disabled={displayNameSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDisplayNameUpdate}
              disabled={displayNameSaving || !displayName.trim() || displayName === currentDisplayName}
            >
              {displayNameSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}