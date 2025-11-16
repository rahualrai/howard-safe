import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ChangelogEntry {
  version: string;
  release_date: string;
}

/**
 * Hook to check for app updates by comparing current version with latest changelog entry
 */
export function useAppUpdates(currentVersion: string) {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForUpdates();
  }, [currentVersion]);

  const checkForUpdates = async () => {
    try {
      setLoading(true);
      
      // Fetch latest changelog entry
      const { data, error } = await supabase
        .from("changelog_entries")
        .select("version, release_date")
        .order("release_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If database fails, silently return (no update notification)
        console.error("Error checking for updates:", error);
        setHasUpdate(false);
        setLatestVersion(null);
        return;
      }

      if (data) {
        const latest = data.version;
        setLatestVersion(latest);

        // Compare versions (simple string comparison works for semantic versions)
        const isNewer = compareVersions(latest, currentVersion) > 0;
        
        if (isNewer) {
          // Check if user has already seen this version
          const lastSeenVersion = localStorage.getItem("lastSeenAppVersion");
          if (lastSeenVersion !== latest) {
            setHasUpdate(true);
          } else {
            setHasUpdate(false);
          }
        } else {
          setHasUpdate(false);
        }
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
      setHasUpdate(false);
      setLatestVersion(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mark the latest version as seen (dismisses the update notification)
   */
  const markAsSeen = () => {
    if (latestVersion) {
      localStorage.setItem("lastSeenAppVersion", latestVersion);
      setHasUpdate(false);
    }
  };

  return {
    hasUpdate,
    latestVersion,
    loading,
    markAsSeen,
    checkForUpdates,
  };
}

/**
 * Compare two semantic version strings
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

