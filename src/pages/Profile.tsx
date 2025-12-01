import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Bell, User as UserIcon, LogOut, Shield, AlertTriangle, IdCard, Camera, Upload, X as XIcon, MapPin, Info, Bug, MessageSquare, Sparkles, X, Settings, Download, HelpCircle } from "lucide-react";
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
import { EmergencyContactsManager } from "@/components/EmergencyContactsManager";
import { useUserEmergencyContacts } from "@/hooks/useUserEmergencyContacts";
import { BugReportDialog } from "@/components/BugReportDialog";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { ChangelogDialog } from "@/components/ChangelogDialog";
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
    } catch (error: unknown) {
      console.error('Error updating display name:', error);
      toast({
        title: 'Failed to update display name',
        description: (error as Error).message || 'Please try again.',
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
        .from('digital_ids')
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
    <div className="min-h-screen bg-mint-50 pb-32">
      {/* Curved Header Section */}
      <div className="relative bg-mint-500 pt-12 pb-16 rounded-b-[40px] shadow-lg mb-6 overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full bg-mint-400/30 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 rounded-full bg-mint-300/20 blur-2xl" />

        <div className="px-6 relative z-10 text-center">
          <h1 className="text-3xl font-friendly font-bold text-white tracking-tight mb-1">
            Profile
          </h1>
          <p className="text-mint-100 font-medium text-lg">Manage your account & settings</p>
        </div>
      </div>

      <main className="px-6 -mt-8 relative z-10 max-w-md mx-auto space-y-6">
        {/* Profile Info */}
        <Card className="border-none shadow-soft rounded-[24px] overflow-hidden bg-pastel-blue/20">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2 bg-transparent">
            <div className="flex items-center space-x-2">
              <div className="bg-pastel-blue p-2 rounded-full">
                <UserIcon className="h-5 w-5 text-ui-charcoal" />
              </div>
              <CardTitle className="text-lg font-bold text-ui-charcoal">Account Info</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 bg-white/60 backdrop-blur-sm p-5 m-1 rounded-[20px]">
            {/* Avatar */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-mint-100 shadow-sm">
                  <AvatarImage
                    src={avatarPreview || avatarDisplayUrl || undefined}
                    alt="Profile picture"
                  />
                  <AvatarFallback className="bg-mint-200 text-mint-700 text-2xl font-bold">
                    {currentDisplayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                  </div>
                )}
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleAvatarSelect}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md bg-white hover:bg-gray-50 border border-gray-200"
                >
                  <Camera className="h-4 w-4 text-ui-charcoal" />
                </Button>
              </div>
              <div className="flex-1">
                <p className="font-bold text-xl text-ui-charcoal">{currentDisplayName}</p>
                <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="bg-mint-50 text-mint-700 hover:bg-mint-100 border-none">
                    Student
                  </Badge>
                  {isAdmin && (
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-none">
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-gray-50 p-3 rounded-2xl">
                <p className="text-xs text-muted-foreground mb-1">Member since</p>
                <p className="font-semibold text-sm text-ui-charcoal">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              {lastLoginInfo && (
                <div className="bg-gray-50 p-3 rounded-2xl">
                  <p className="text-xs text-muted-foreground mb-1">Last sign in</p>
                  <p className="font-semibold text-sm text-ui-charcoal">
                    {new Date(lastLoginInfo.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Admin Panel Button */}
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin')}
                className="w-full rounded-xl bg-ui-charcoal text-white hover:bg-black shadow-md"
                size="default"
              >
                <Settings className="h-4 w-4 mr-2" />
                Open Admin Panel
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card className="border-none shadow-soft rounded-[24px] overflow-hidden bg-pastel-green/20">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2 bg-transparent">
            <div className="flex items-center space-x-2">
              <div className="bg-pastel-green p-2 rounded-full">
                <Shield className="h-5 w-5 text-ui-charcoal" />
              </div>
              <CardTitle className="text-lg font-bold text-ui-charcoal">Security Status</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 bg-white/60 backdrop-blur-sm p-5 m-1 rounded-[20px]">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
              <div>
                <p className="font-bold text-sm text-green-800">Account Secure</p>
                <p className="text-xs text-green-600/80">Your account has secure authentication</p>
              </div>
              <div className="bg-white p-1 rounded-full shadow-sm">
                <Shield className="h-4 w-4 text-green-500" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-sm text-ui-charcoal">Email Verified</p>
                <p className="text-xs text-muted-foreground">Your email has been confirmed</p>
              </div>
              <Badge variant="secondary" className={user.email_confirmed_at ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                {user.email_confirmed_at ? "Verified" : "Pending"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Profile Customization */}
        <Card className="border-none shadow-soft rounded-[24px] overflow-hidden bg-pastel-purple/20">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2 bg-transparent">
            <div className="flex items-center space-x-2">
              <div className="bg-pastel-purple p-2 rounded-full">
                <Settings className="h-5 w-5 text-ui-charcoal" />
              </div>
              <CardTitle className="text-lg font-bold text-ui-charcoal">Settings</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 bg-white/60 backdrop-blur-sm p-5 m-1 rounded-[20px]">
            {/* Digital ID Management */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-2xl gap-3 transition-colors hover:bg-gray-100">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm flex items-center gap-2 text-ui-charcoal">
                  <IdCard size={16} className="text-mint-600" />
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
                size="sm"
                variant="outline"
                onClick={() => setShowIDForm(true)}
                className="w-full sm:w-auto rounded-full border-gray-200 hover:bg-white hover:text-mint-600"
              >
                {digitalID ? 'Edit' : 'Add'}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-2xl gap-3 transition-colors hover:bg-gray-100">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-ui-charcoal">Display Name</p>
                <p className="text-xs text-muted-foreground truncate">{currentDisplayName}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto rounded-full border-gray-200 hover:bg-white hover:text-mint-600"
                onClick={() => {
                  setDisplayName(currentDisplayName);
                  setShowDisplayNameDialog(true);
                }}
              >
                Edit
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-2xl gap-3 transition-colors hover:bg-gray-100">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-ui-charcoal">Emergency Contacts</p>
                <p className="text-xs text-muted-foreground">
                  {personalContactsCount > 0
                    ? `${personalContactsCount} personal contact${personalContactsCount !== 1 ? 's' : ''}`
                    : 'People to notify in emergencies'}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEmergencyContacts(true)}
                className="w-full sm:w-auto rounded-full border-gray-200 hover:bg-white hover:text-mint-600"
              >
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Friends & Location Sharing */}
        <Card className="border-none shadow-soft rounded-[24px] overflow-hidden bg-pastel-pink/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent">
            <div className="flex items-center space-x-2">
              <div className="bg-pastel-pink p-2 rounded-full">
                <MapPin className="h-5 w-5 text-ui-charcoal" />
              </div>
              <CardTitle className="text-lg font-bold text-ui-charcoal">Friends & Location</CardTitle>
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
          <CardContent className="space-y-4 bg-white p-5">
            {/* Location Sharing Toggle */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-full shadow-sm">
                  <MapPin className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <Label htmlFor="location-sharing" className="font-bold text-sm cursor-pointer text-purple-900">
                    Share Location
                  </Label>
                  <p className="text-xs text-purple-700/80">
                    {isSharing ? 'Visible to friends' : 'Not sharing'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSharing ? (
                  <Button
                    size="sm"
                    onClick={stopSharingLocation}
                    className="rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-md"
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
                    className="data-[state=checked]:bg-purple-600"
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
        <Card className="border-none shadow-soft rounded-[24px] overflow-hidden bg-pastel-yellow/20">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2 bg-transparent">
            <div className="flex items-center space-x-2">
              <div className="bg-pastel-yellow p-2 rounded-full">
                <Bell className="h-5 w-5 text-ui-charcoal" />
              </div>
              <CardTitle className="text-lg font-bold text-ui-charcoal">Notifications</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 bg-white/60 backdrop-blur-sm p-5 m-1 rounded-[20px]">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-sm text-ui-charcoal">Emergency Alerts</p>
                <p className="text-xs text-muted-foreground">Get notified of campus emergencies</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-sm text-ui-charcoal">Safety Updates</p>
                <p className="text-xs text-muted-foreground">Campus safety news and tips</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-sm text-ui-charcoal">Incident Reports</p>
                <p className="text-xs text-muted-foreground">Updates on your submitted reports</p>
              </div>
              <Badge variant="outline" className="text-muted-foreground">Disabled</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className="border-none shadow-soft rounded-[24px] overflow-hidden bg-pastel-sky/20">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2 bg-transparent">
            <div className="flex items-center space-x-2">
              <div className="bg-pastel-sky p-2 rounded-full">
                <Shield className="h-5 w-5 text-ui-charcoal" />
              </div>
              <CardTitle className="text-lg font-bold text-ui-charcoal">Privacy & Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 bg-white/60 backdrop-blur-sm p-5 m-1 rounded-[20px]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-2xl gap-3 transition-colors hover:bg-gray-100">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-ui-charcoal">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add extra security to your account</p>
              </div>
              <Button size="sm" variant="outline" className="w-full sm:w-auto rounded-full border-gray-200 hover:bg-white hover:text-mint-600">Setup</Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-2xl gap-3 transition-colors hover:bg-gray-100">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-ui-charcoal">Privacy Settings</p>
                <p className="text-xs text-muted-foreground">Control who can see your information</p>
              </div>
              <Button size="sm" variant="outline" className="w-full sm:w-auto rounded-full border-gray-200 hover:bg-white hover:text-mint-600">Manage</Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-2xl gap-3 transition-colors hover:bg-gray-100">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-ui-charcoal flex items-center gap-2">
                  <Download size={16} className="text-teal-600" />
                  Data Export
                </p>
                <p className="text-xs text-muted-foreground">Download your account data</p>
              </div>
              <Button size="sm" variant="outline" className="w-full sm:w-auto rounded-full border-gray-200 hover:bg-white hover:text-mint-600">Request</Button>
            </div>
          </CardContent>
        </Card>

        {/* Support & About */}
        <Card className="border-none shadow-soft rounded-[24px] overflow-hidden bg-pastel-pink/20">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2 bg-transparent">
            <div className="flex items-center space-x-2">
              <div className="bg-pastel-pink p-2 rounded-full">
                <HelpCircle className="h-5 w-5 text-ui-charcoal" />
              </div>
              <CardTitle className="text-lg font-bold text-ui-charcoal">Support & About</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 bg-white p-5">
            {hasUpdate && (
              <Alert className="border-pink-200 bg-pink-50 rounded-2xl mb-2">
                <Sparkles className="h-4 w-4 text-pink-600" />
                <AlertDescription className="flex items-center justify-between w-full">
                  <div className="flex-1 mr-2">
                    <p className="font-bold text-pink-800">Update Available</p>
                    <p className="text-xs text-pink-700/80">
                      Version {latestVersion} is now available. Check out what's new!
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setShowChangelog(true);
                        markAsSeen();
                      }}
                      className="rounded-full bg-pink-600 hover:bg-pink-700 text-white border-none h-8"
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-pink-100 text-pink-600"
                      onClick={() => {
                        markAsSeen();
                        toast({
                          title: "Notification dismissed",
                          description: "You can always check for updates in What's New.",
                          duration: 2000,
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-sm text-ui-charcoal">App Version</p>
                <p className="text-xs text-muted-foreground">Current version of the app</p>
              </div>
              <Badge variant="secondary" className="bg-gray-200 text-gray-700">{appVersion}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-ui-charcoal">What's New</p>
                  {hasUpdate && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px] bg-pink-500 hover:bg-pink-600">New</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">See recent updates and changes</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowChangelog(true);
                  markAsSeen();
                }}
                className="rounded-full border-gray-200 hover:bg-white hover:text-pink-600"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-ui-charcoal">Report a Bug</p>
                <p className="text-xs text-muted-foreground">Found an issue? Let us know</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowBugReport(true)} className="rounded-full border-gray-200 hover:bg-white hover:text-pink-600">
                <Bug className="h-3 w-3 mr-1" />
                Report
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-ui-charcoal">Send Feedback</p>
                <p className="text-xs text-muted-foreground">Share your thoughts and suggestions</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowFeedback(true)} className="rounded-full border-gray-200 hover:bg-white hover:text-pink-600">
                <MessageSquare className="h-3 w-3 mr-1" />
                Feedback
              </Button>
            </div>
          </CardContent>
        </Card >

        {/* Sign Out Button */}
        <Button
          variant="destructive"
          className="w-full rounded-2xl h-14 shadow-lg shadow-red-200 hover:shadow-red-300 transition-all active:scale-95 text-lg font-bold"
          onClick={() => setShowSignOutDialog(true)}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sign Out
        </Button>

        <div className="text-center pb-8">
          <p className="text-xs text-muted-foreground">Howard Safe v{appVersion}</p>
        </div>
      </main >

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
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Display Name Edit Dialog */}
      <Dialog open={showDisplayNameDialog} onOpenChange={setShowDisplayNameDialog}>
        <DialogContent className="rounded-[24px]">
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
                className="mt-2 rounded-xl"
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
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDisplayNameUpdate}
              disabled={displayNameSaving || !displayName.trim() || displayName === currentDisplayName}
              className="rounded-full"
            >
              {displayNameSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}