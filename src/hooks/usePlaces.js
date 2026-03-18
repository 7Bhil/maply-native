import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'maply_native_places';

export function usePlaces() {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPlaces(JSON.parse(raw));
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
    const updated = [newPlace, ...places];
    setPlaces(updated);
    await savePlaces(updated);
    return newPlace;
  }, [places]);

  const deletePlace = useCallback(async (id) => {
    const updated = places.filter((p) => p.id !== id);
    setPlaces(updated);
    await savePlaces(updated);
  }, [places]);

  return { places, addPlace, deletePlace };
}
