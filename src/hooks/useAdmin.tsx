import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to check if current user is an admin
 * Returns admin status and loading state
 */
export function useAdmin(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    checkAdminStatus();
  }, [userId]);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data?.is_admin === true);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    isAdmin,
    loading,
    refetch: checkAdminStatus,
  };
}

