import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIVE_KEY = 'maply_is_live';
const USERNAME_KEY = 'maply_username';

export function useLiveLocation() {
  const [isLive, setIsLive] = useState(false);
  const [username, setUsername] = useState('Bhilal');
  const watchRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Load persisted state
    (async () => {
      try {
        const savedLive = await AsyncStorage.getItem(LIVE_KEY);
        const savedName = await AsyncStorage.getItem(USERNAME_KEY);
        if (savedLive === 'true') setIsLive(true);
        if (savedName) setUsername(savedName);
      } catch (e) {
        console.error('Failed to load live state', e);
      }
    })();
  }, []);

  const updateLocation = useCallback(async (coords) => {
    try {
      // We use Upsert logic based on username for simplicity in this demo
      // In a real app, we'd use a unique User ID
      await supabase
        .from('users_locations')
        .upsert({ 
          username: username,
          lat: coords.latitude,
          lng: coords.longitude,
          last_seen: new Date().toISOString()
        }, { onConflict: 'username' });
    } catch (err) {
      console.error('Live sync error:', err);
    }
  }, [username]);

  const stopLive = useCallback(async () => {
    setIsLive(false);
    await AsyncStorage.setItem(LIVE_KEY, 'false');
    
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    await supabase.from('users_locations').delete().eq('username', username);
  }, [username]);

  const toggleLive = useCallback(async () => {
    if (isLive) {
      await stopLive();
      return;
    }

    // Start Live
    setIsLive(true);
    await AsyncStorage.setItem(LIVE_KEY, 'true');

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        setIsLive(false);
        return;
    }
    
    // Start watching
    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10, // meters
        timeInterval: 20000, // 20 seconds
      },
      (location) => {
        updateLocation(location.coords);
      }
    );
    // Start 30-minute auto-disable timer to save battery and privacy
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      console.log("Auto-disabling live location after 30 minutes");
      await stopLive();
    }, 30 * 60 * 1000); // 30 minutes

  }, [isLive, username, updateLocation, stopLive]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { isLive, toggleLive, username, setUsername };
}
