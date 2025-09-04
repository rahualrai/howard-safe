import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface SecurityValidationOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  onSessionExpired?: () => void;
}

export const useSecurityValidation = (options: SecurityValidationOptions = {}) => {
  const { requireAuth = true, redirectTo = '/auth', onSessionExpired } = options;
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);
  const hasHadSessionRef = useRef(false); // Track if user ever had a session
  const navigate = useNavigate();
  const { toast } = useToast();

  // Session validation function
  const validateSession = (currentSession: Session | null): boolean => {
    if (!currentSession) return false;
    
    // Check if session is expired
    const now = Date.now() / 1000;
    if (currentSession.expires_at && currentSession.expires_at < now) {
      return false;
    }
    
    // Check if token is valid
    if (!currentSession.access_token) {
      return false;
    }
    
    return true;
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

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          await logSecurityEvent('session_error', { error: error.message });
          setLoading(false);
          return;
        }

        const isValid = validateSession(session);
        setSession(session);
        setUser(session?.user ?? null);
        setIsValidSession(isValid);
        
        // Track if user ever had a valid session
        if (isValid) {
          hasHadSessionRef.current = true;
        }

        if (requireAuth && !isValid && !window.location.pathname.includes('/auth')) {
          await logSecurityEvent('unauthorized_access_attempt', { 
            path: window.location.pathname,
            timestamp: new Date().toISOString()
          });
          navigate(redirectTo);
        }
      } catch (error) {
        console.error('Failed to get session:', error);
        await logSecurityEvent('session_retrieval_error', { error: (error as Error).message });
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        const isValid = validateSession(currentSession);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsValidSession(isValid);
        
        // Track if user ever had a valid session
        if (isValid) {
          hasHadSessionRef.current = true;
        }

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            hasHadSessionRef.current = true;
            await logSecurityEvent('user_signed_in', {
              userId: currentSession?.user?.id,
              timestamp: new Date().toISOString()
            });
            break;
            
          case 'SIGNED_OUT':
            await logSecurityEvent('user_signed_out', {
              timestamp: new Date().toISOString()
            });
            if (requireAuth && !window.location.pathname.includes('/auth')) {
              navigate(redirectTo);
            }
            break;
            
          case 'TOKEN_REFRESHED':
            await logSecurityEvent('token_refreshed', {
              userId: currentSession?.user?.id,
              timestamp: new Date().toISOString()
            });
            break;
            
          case 'USER_UPDATED':
            await logSecurityEvent('user_updated', {
              userId: currentSession?.user?.id,
              timestamp: new Date().toISOString()
            });
            break;
        }

        // Handle session expiration - only show toast if user previously had a session
        if (!isValid && hasHadSessionRef.current && event !== 'SIGNED_OUT') {
          if (onSessionExpired) {
            onSessionExpired();
          } else if (requireAuth) {
            toast({
              title: 'Session expired',
              description: 'Please sign in again for security.',
              variant: 'destructive',
            });
            navigate(redirectTo);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [requireAuth, redirectTo, navigate, toast, onSessionExpired]);

  // Manual session refresh function
  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      const isValid = validateSession(session);
      setSession(session);
      setUser(session?.user ?? null);
      setIsValidSession(isValid);
      
      return { session, isValid };
    } catch (error) {
      console.error('Failed to refresh session:', error);
      await logSecurityEvent('session_refresh_error', { error: (error as Error).message });
      return { session: null, isValid: false };
    }
  };

  // Sign out function with security logging
  const secureSignOut = async () => {
    try {
      await logSecurityEvent('user_initiated_signout', {
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setSession(null);
      setUser(null);
      setIsValidSession(false);
      
      navigate(redirectTo);
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Sign out failed',
        description: 'Please try again or close your browser.',
        variant: 'destructive',
      });
    }
  };

  return {
    user,
    session,
    loading,
    isValidSession,
    refreshSession,
    secureSignOut,
    logSecurityEvent
  };
};