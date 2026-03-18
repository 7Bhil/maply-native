import React, { useState, useCallback } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, TouchableOpacity, Text } from 'react-native';
import AppMapView from './src/components/MapView';
import AddPlaceModal from './src/components/AddPlaceModal';
import PlaceList from './src/components/PlaceList';
import { usePlaces } from './src/hooks/usePlaces';

export default function App() {
  const { places, addPlace, deletePlace } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [search, setSearch] = useState('');

  const handleMapLongPress = useCallback((coords) => {
    setPendingCoords(coords);
    setModalVisible(true);
  }, []);

  const handleConfirmAdd = useCallback(async (placeData) => {
    const newPlace = await addPlace(placeData);
    setModalVisible(false);
    setSelectedPlace(newPlace);
  }, [addPlace]);

  const handleSelectPlace = useCallback((place) => {
    setSelectedPlace(place);
  }, []);

  const handleDeletePlace = useCallback(async (id) => {
    await deletePlace(id);
    if (selectedPlace?.id === id) {
      setSelectedPlace(null);
    }
  }, [deletePlace, selectedPlace]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Map View */}
      <View style={styles.mapContainer}>
        <AppMapView
          places={places}
          selectedPlace={selectedPlace}
          onSelectPlace={handleSelectPlace}
          onMapLongPress={handleMapLongPress}
        />
        
        {/* Floating instructions */}
        <View style={styles.hintContainer} pointerEvents="none">
          <Text style={styles.hint}>Appui long pour ajouter 📍</Text>
        </View>
      </View>

      {/* Place List (Bottom Panel) */}
      <PlaceList
        places={places}
        search={search}
        onSearchChange={setSearch}
        onSelectPlace={handleSelectPlace}
        onDeletePlace={handleDeletePlace}
      />

      {/* Add Place Modal */}
      <AddPlaceModal
        visible={modalVisible}
        coords={pendingCoords}
        onConfirm={handleConfirmAdd}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  hintContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  hint: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
});
