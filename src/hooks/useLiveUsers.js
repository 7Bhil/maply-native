import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useLiveUsers(currentUsername) {
  const [liveUsers, setLiveUsers] = useState([]);

  useEffect(() => {
    // 1. Load initial live users (excluding self, active in the last 10 minutes)
    const fetchLiveUsers = async () => {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('users_locations')
        .select('*')
        .neq('username', currentUsername)
        .gt('last_seen', tenMinsAgo);

      if (!error && data) {
        setLiveUsers(data);
      }
    };

    fetchLiveUsers();

    // 2. Subscribe to real-time changes
    const channel = supabase
      .channel('live-locations')
      .on('postgres_changes', { event: '*', table: 'users_locations' }, (payload) => {
        if (payload.new && payload.new.username !== currentUsername) {
          setLiveUsers(current => {
            const index = current.findIndex(u => u.username === payload.new.username);
            if (payload.eventType === 'DELETE') {
              return current.filter(u => u.username !== payload.old.username);
            }
            if (index > -1) {
              const updated = [...current];
              updated[index] = payload.new;
              return updated;
            }
            return [...current, payload.new];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUsername]);

  return liveUsers;
}
