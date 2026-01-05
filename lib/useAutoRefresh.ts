import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for auto-refreshing data from CMS
 * Uses polling with smart interval - faster when window is focused, slower when hidden
 * 
 * @param fetchFn - Async function to fetch data
 * @param options - Configuration options
 */
export function useAutoRefresh<T>(
  fetchFn: () => Promise<T>,
  options: {
    enabled?: boolean;
    interval?: number; // Default 10 seconds
    backgroundInterval?: number; // Default 60 seconds when tab not focused
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const {
    enabled = true,
    interval = 10000, // 10 seconds default
    backgroundInterval = 60000, // 1 minute when backgrounded
    onSuccess,
    onError,
  } = options;

  const lastFetchRef = useRef<number>(0);
  const isFocusedRef = useRef(true);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const doFetch = useCallback(async () => {
    try {
      const data = await fetchFn();
      onSuccess?.(data);
      lastFetchRef.current = Date.now();
    } catch (error) {
      onError?.(error as Error);
    }
  }, [fetchFn, onSuccess, onError]);

  // Setup polling
  useEffect(() => {
    if (!enabled) return;

    const startPolling = () => {
      const currentInterval = isFocusedRef.current ? interval : backgroundInterval;
      
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      
      intervalIdRef.current = setInterval(doFetch, currentInterval);
    };

    // Initial fetch
    doFetch();
    startPolling();

    // Handle visibility changes
    const handleVisibilityChange = () => {
      isFocusedRef.current = !document.hidden;
      startPolling(); // Restart with appropriate interval
      
      // Fetch immediately when tab becomes visible
      if (!document.hidden) {
        doFetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, interval, backgroundInterval, doFetch]);

  // Return function to manually trigger refresh
  return { refresh: doFetch };
}

/**
 * Hook for checking if CMS data has updated
 * Compares last-modified timestamps
 */
export function useCMSSync(
  endpoints: string[],
  onUpdate: () => void,
  options: { interval?: number; enabled?: boolean } = {}
) {
  const { interval = 10000, enabled = true } = options;
  const lastHashesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!enabled || endpoints.length === 0) return;

    const checkForUpdates = async () => {
      try {
        let hasChanges = false;
        
        for (const endpoint of endpoints) {
          const res = await fetch(endpoint, { method: 'HEAD' });
          const etag = res.headers.get('etag') || res.headers.get('last-modified') || '';
          
          if (lastHashesRef.current[endpoint] && lastHashesRef.current[endpoint] !== etag) {
            hasChanges = true;
          }
          lastHashesRef.current[endpoint] = etag;
        }
        
        if (hasChanges) {
          onUpdate();
        }
      } catch (error) {
        console.error('CMS sync check failed:', error);
      }
    };

    // Initial check (without triggering update)
    const initCheck = async () => {
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, { method: 'HEAD' });
          lastHashesRef.current[endpoint] = res.headers.get('etag') || res.headers.get('last-modified') || '';
        } catch {
          // Ignore initial errors
        }
      }
    };
    
    initCheck();
    const intervalId = setInterval(checkForUpdates, interval);
    
    return () => clearInterval(intervalId);
  }, [endpoints, onUpdate, interval, enabled]);
}
