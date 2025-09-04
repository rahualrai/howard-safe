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
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [passwordStrength, setPasswordStrength] = useState({
    isValid: false,
    hasMinLength: false,
    hasNumber: false,
    hasLetter: false,
    score: 0
  });
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

  // Password strength validation
  const validatePasswordStrength = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasNumber = /[0-9]/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    let score = 0;
    if (hasMinLength) score += 1;
    if (hasNumber) score += 1;
    if (hasLetter) score += 1;
    if (hasSpecialChar) score += 1;
    
    const isValid = hasMinLength && hasNumber && hasLetter;
    
    setPasswordStrength({
      isValid,
      hasMinLength,
      hasNumber,
      hasLetter,
      score
    });
  };

  // Enhanced input sanitization
  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  };

  // Security audit logging
  const logSecurityEvent = async (eventType: string, details: any) => {
    try {
      await supabase.from('security_audit_log').insert({
        event_type: eventType,
        event_details: details,
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.warn('Failed to log security event:', error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Enhanced validation
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      const sanitizedUsername = sanitizeInput(username);
      
      // Check password strength
      if (!passwordStrength.isValid) {
        toast({
          title: "Password too weak",
          description: "Password must be at least 8 characters with letters and numbers.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Email format validation
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

      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: sanitizedUsername
          }
        }
      });

      if (error) {
        // Log failed signup attempt
        await logSecurityEvent('signup_failed', {
          email: sanitizedEmail,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        // Enhanced error messages
        let userMessage = "Sign up failed. Please try again.";
        if (error.message.includes("already registered")) {
          userMessage = "An account with this email already exists. Try signing in instead.";
        } else if (error.message.includes("password")) {
          userMessage = "Password does not meet security requirements.";
        } else if (error.message.includes("email")) {
          userMessage = "Please enter a valid email address.";
        }

        toast({
          title: "Sign up failed",
          description: userMessage,
          variant: "destructive",
        });
      } else {
        // Log successful signup attempt
        await logSecurityEvent('signup_success', {
          email: sanitizedEmail,
          timestamp: new Date().toISOString()
        });

        toast({
          title: "Account created successfully!",
          description: "Please check your email for a confirmation link.",
        });
      }
    } catch (error: any) {
      await logSecurityEvent('signup_error', {
        error: error?.message || 'Unknown error',
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

      const { error } = await supabase.auth.signInWithPassword({
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
      } else {
        // Log successful signin
        await logSecurityEvent('signin_success', {
          email: sanitizedEmail,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      await logSecurityEvent('signin_error', {
        error: error?.message || 'Unknown error',
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

  if (user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(sanitizeInput(e.target.value))}
                  required={isSignUp}
                  placeholder="Enter your username"
                  maxLength={50}
                />
              </div>
            )}
            
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (isSignUp) {
                      validatePasswordStrength(e.target.value);
                    }
                  }}
                  required
                  placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                  minLength={isSignUp ? 8 : 1}
                  maxLength={128}
                />
                
                {/* Password Strength Indicator for Sign Up */}
                {isSignUp && password && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full ${
                                passwordStrength.score >= level
                                  ? passwordStrength.score <= 2
                                    ? "bg-destructive"
                                    : passwordStrength.score === 3
                                    ? "bg-yellow-500"
                                    : "bg-success"
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {passwordStrength.score <= 2
                          ? "Weak"
                          : passwordStrength.score === 3
                          ? "Good"
                          : "Strong"}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      {[
                        { met: passwordStrength.hasMinLength, text: "At least 8 characters" },
                        { met: passwordStrength.hasLetter, text: "Contains letters" },
                        { met: passwordStrength.hasNumber, text: "Contains numbers" },
                      ].map((requirement, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          {requirement.met ? (
                            <CheckCircle2 className="h-3 w-3 text-success" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span
                            className={
                              requirement.met ? "text-success" : "text-muted-foreground"
                            }
                          >
                            {requirement.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (isSignUp && !passwordStrength.isValid && password.length > 0)}
            >
              {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
            
            {/* Security Notice */}
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                This app follows security best practices. Your data is protected with encryption and secure access controls.
              </AlertDescription>
            </Alert>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}