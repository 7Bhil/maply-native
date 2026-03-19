import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'maply_native_places';

export function usePlaces() {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    loadPlaces();

    const channel = supabase
      .channel('places_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'places' }, () => {
        loadPlaces();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPlaces = async () => {
    try {
      // Priorité Supabase
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Map database fields to app state fields
        const mapped = data.map(p => ({
          ...p,
          isFavorite: p.is_favorite,
          image: p.image_url,
        }));
        setPlaces(mapped);
        await savePlaces(mapped);
      } else {
        // Fallback local
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setPlaces(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Failed to load places', e);
    }
  };

  const savePlaces = async (newPlaces) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPlaces));
    } catch (e) {
      console.error('Failed to save places', e);
    }
  };

  const addPlace = useCallback(async (placeData) => {
    const newPlace = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...placeData,
    };

    // Sync to Supabase
    const { data, error } = await supabase
      .from('places')
      .insert([{
        id: newPlace.id,
        name: newPlace.name,
        description: newPlace.description,
        category: newPlace.category,
        lat: newPlace.lat,
        lng: newPlace.lng,
        rating: newPlace.rating,
        is_favorite: newPlace.isFavorite,
        image_url: newPlace.image,
        created_at: newPlace.createdAt,
      }])
      .select();

    const updated = [newPlace, ...places];
    setPlaces(updated);
    await savePlaces(updated);
    return newPlace;
  }, [places]);

  const deletePlace = useCallback(async (id) => {
    // Delete from Supabase
    await supabase.from('places').delete().eq('id', id);

    const updated = places.filter((p) => p.id !== id);
    setPlaces(updated);
    await savePlaces(updated);
  }, [places]);

  return { places, addPlace, deletePlace };
}
