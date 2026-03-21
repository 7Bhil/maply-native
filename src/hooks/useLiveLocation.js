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

  useEffect(() => {
    // Load persisted state
    (async () => {
      const savedLive = await AsyncStorage.getItem(LIVE_KEY);
      const savedName = await AsyncStorage.getItem(USERNAME_KEY);
      if (savedLive === 'true') setIsLive(true);
      if (savedName) setUsername(savedName);
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

  const toggleLive = useCallback(async () => {
    const nextState = !isLive;
    setIsLive(nextState);
    await AsyncStorage.setItem(LIVE_KEY, nextState.toString());

    if (nextState) {
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
    } else {
      // Stop watching
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
      // Optional: remove from DB when stopping
      await supabase.from('users_locations').delete().eq('username', username);
    }
  }, [isLive, username, updateLocation]);

  return { isLive, toggleLive, username, setUsername };
}
