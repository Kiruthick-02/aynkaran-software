import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';


/**
 * Custom React Hook to monitor database health and synchrony metrics
 */
export default function useSync() {
  const { isOnline, loadStateFromServer } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => new Date().toLocaleTimeString());
  const [pingMs, setPingMs] = useState(null);
  const [recordsCount, setRecordsCount] = useState({
    customers: 0,
    candidates: 0,
    policies: 0,
    reminders: 0
  });

  const checkHealthAndSync = useCallback(async () => {
    setIsSyncing(true);
    const startTime = performance.now();
    try {
      const status = await apiService.getHealth();
      const endTime = performance.now();
      
      setPingMs(Math.round(endTime - startTime));
      setLastSyncTime(new Date().toLocaleTimeString());
      
      if (status && status.records) {
        setRecordsCount({
          customers: status.records.customers,
          candidates: status.records.candidates,
          policies: status.records.policies,
          reminders: status.records.reminders
        });
      }
    } catch (e) {
      console.warn('Sync status check failed. Back-end server is likely offline.', e);
      setPingMs(null);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Sync health ping intervals
  useEffect(() => {
    checkHealthAndSync();
    const interval = setInterval(() => {
      checkHealthAndSync();
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [checkHealthAndSync]);

  const forceSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await loadStateFromServer();
      await checkHealthAndSync();
    } catch (err) {
      console.error('Trigger forced sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [loadStateFromServer, checkHealthAndSync]);

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    pingMs,
    recordsCount,
    forceSync
  };
}
