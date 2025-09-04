import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Bell, User as UserIcon, LogOut, Shield, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSecurityValidation } from "@/hooks/useSecurityValidation";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [lastLoginInfo, setLastLoginInfo] = useState<any>(null);
  const { toast } = useToast();
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

  useEffect(() => {
    if (user && isValidSession) {
      fetchProfile(user.id);
      fetchLastLoginInfo(user.id);
    }
  }, [user, isValidSession]);

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
      
      // Log successful profile access
      await logSecurityEvent('profile_accessed', {
        userId,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: "Unable to load your profile information.",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

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
        setLastLoginInfo(data[1]); // Second most recent is the "last" login
      }
    } catch (error) {
      console.warn('Error fetching login history:', error);
    }
  };

  const handleSignOut = async () => {
    await secureSignOut();
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
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
      
      <main className="p-4 max-w-md mx-auto space-y-6">
        {/* Profile Info */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Account Info</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            {profile?.username && (
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">{profile.username}</p>
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
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Display Name</p>
                <p className="text-xs text-muted-foreground">How your name appears in reports</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Emergency Contacts</p>
                <p className="text-xs text-muted-foreground">People to notify in emergencies</p>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Preferred Language</p>
                <p className="text-xs text-muted-foreground">English (US)</p>
              </div>
              <Button variant="outline" size="sm">Change</Button>
            </div>
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
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add extra security to your account</p>
              </div>
              <Button variant="outline" size="sm">Setup</Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Privacy Settings</p>
                <p className="text-xs text-muted-foreground">Control who can see your information</p>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Data Export</p>
                <p className="text-xs text-muted-foreground">Download your account data</p>
              </div>
              <Button variant="outline" size="sm">Export</Button>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button 
          onClick={handleSignOut}
          variant="outline" 
          className="w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </main>
    </div>
  );
}