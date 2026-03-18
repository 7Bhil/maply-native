import React, { useState, useCallback } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [showList, setShowList] = useState(true);

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
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
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
             <View style={styles.hint}>
               <Ionicons name="information-circle-outline" size={14} color="#6366f1" style={{ marginRight: 6 }} />
               <Text style={styles.hintText}>Appui long pour ajouter un lieu</Text>
             </View>
           </View>

           {/* List Toggle Button */}
           <TouchableOpacity 
             style={[styles.toggleBtn, { bottom: 80 }]} 
             onPress={() => setShowList(!showList)}
           >
             <Ionicons name={showList ? "chevron-down" : "list"} size={20} color="#6366f1" />
           </TouchableOpacity>
         </View>

         {/* Place List (Bottom Panel) */}
         {showList && (
           <PlaceList
             places={places}
             search={search}
             onSearchChange={setSearch}
             onSelectPlace={handleSelectPlace}
             onDeletePlace={handleDeletePlace}
           />
         )}
      </KeyboardAvoidingView>

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
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  toggleBtn: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
});
