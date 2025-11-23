import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Type definitions
interface TwoFASecret {
  is_enabled?: boolean;
  secret?: string;
}

interface PendingSession {
  user: User;
}

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        navigate("/");
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          navigate("/");
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Enhanced input sanitization
  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  };

  // Security audit logging - simplified to avoid 401 errors
  const logSecurityEvent = async (eventType: string, details: Record<string, unknown>) => {
    // Only log to console for debugging
    console.debug('Security event:', eventType, details);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedEmail)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) {
        // Log failed signin attempt
        await logSecurityEvent('signin_failed', {
          email: sanitizedEmail,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        // Enhanced error messages
        let userMessage = "Sign in failed. Please check your credentials.";
        if (error.message.includes("Invalid login credentials")) {
          userMessage = "Invalid email or password. Please try again.";
        } else if (error.message.includes("Email not confirmed")) {
          userMessage = "Please confirm your email address first.";
        } else if (error.message.includes("Too many requests")) {
          userMessage = "Too many attempts. Please try again in a few minutes.";
        }

        toast({
          title: "Sign in failed",
          description: userMessage,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check if 2FA is enabled for this user (optional - only if table exists)
      if (data.user) {
        try {
          const { data: twoFactorData } = await supabase
            .from('user_2fa_secrets')
            .select('is_enabled')
            .eq('user_id', data.user.id)
            .single();

          if ((twoFactorData as TwoFASecret)?.is_enabled) {
            // Store session temporarily and show 2FA input
            setPendingSession(data);
            setShow2FA(true);
            setLoading(false);
            return;
          }
        } catch (error: unknown) {
          // 2FA table might not exist yet, continue without 2FA
          console.debug('2FA check skipped:', error);
        }
      }

      // Ensure profile exists for friend system
      if (data.user) {
        try {
          await supabase.rpc('ensure_profile_exists', { user_uuid: data.user.id });
        } catch (error) {
          // If function doesn't exist yet, try to create profile directly
          console.debug('Profile ensure function not available, creating profile directly:', error);
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(
              {
                user_id: data.user.id,
                username: data.user.user_metadata?.username || 
                         data.user.user_metadata?.full_name || 
                         data.user.user_metadata?.name || 
                         data.user.email?.split('@')[0] || 
                         'User',
              },
              { onConflict: 'user_id' }
            );
          if (profileError) {
            console.warn('Could not ensure profile exists:', profileError);
          }
        }
      }

      // Log successful signin
      await logSecurityEvent('signin_success', {
        email: sanitizedEmail,
        timestamp: new Date().toISOString()
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logSecurityEvent('signin_error', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingSession || !twoFactorCode) return;

    setLoading(true);
    try {
      // Get the 2FA secret for the user
      const { data: twoFactorData, error: fetchError } = await supabase
        .from('user_2fa_secrets')
        .select('secret')
        .eq('user_id', pendingSession.user.id)
        .single();

      if (fetchError || !twoFactorData) {
        toast({
          title: "2FA Error",
          description: "Failed to verify 2FA. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verify TOTP code (simplified - in production, use a proper TOTP library)
      // For now, we'll use a simple verification approach
      // In production, you'd use: import { authenticator } from 'otplib';
      const secret = (twoFactorData as TwoFASecret).secret ?? '';
      const isValid = await verifyTOTP(secret, twoFactorCode);

      if (isValid) {
        // 2FA verified, session is already established
        await logSecurityEvent('2fa_verified', {
          user_id: pendingSession.user.id,
          timestamp: new Date().toISOString()
        });
        setShow2FA(false);
        setTwoFactorCode("");
        setPendingSession(null);
      } else {
        toast({
          title: "Invalid Code",
          description: "The 2FA code you entered is incorrect. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error('2FA verification error:', error);
      toast({
        title: "Error",
        description: "An error occurred during 2FA verification.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // TOTP verification using otplib
  const verifyTOTP = async (secret: string, code: string): Promise<boolean> => {
    try {
      // Dynamic import to avoid SSR issues
      const { authenticator } = await import('otplib');
      
      if (code.length !== 6 || !/^\d+$/.test(code)) {
        return false;
      }
      
      // Verify the TOTP code
      return authenticator.verify({ token: code, secret });
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/oauth2callback`,
        }
      });

      if (error) {
        // Check if it's a provider not enabled error
        if (error.message.includes('not enabled') || error.message.includes('Unsupported provider')) {
          toast({
            title: "Google Sign In Not Available",
            description: "Google OAuth is not enabled in your Supabase project. Please use email/password login or enable Google OAuth in your Supabase dashboard.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Google Sign In Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } catch (error: unknown) {
      console.error('Google OAuth error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return null; // Will redirect in useEffect
  }

  // Show 2FA input if needed
  if (show2FA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-foreground flex items-center justify-center gap-2">
              <Shield className="w-6 h-6" />
              Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handle2FAVerification} className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please enter the 6-digit code from your authenticator app.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="2fa-code">Verification Code</Label>
                <Input
                  id="2fa-code"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || twoFactorCode.length !== 6}
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShow2FA(false);
                  setTwoFactorCode("");
                  setPendingSession(null);
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-foreground">
            Welcome Back
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                required
                placeholder="Enter your email"
                maxLength={255}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                maxLength={128}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Loading..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}