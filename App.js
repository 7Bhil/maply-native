import React, { useState, useCallback } from 'react';
import { StyleSheet, View, StatusBar, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AppMapView from './src/components/MapView';
import AddPlaceModal from './src/components/AddPlaceModal';
import PlaceList from './src/components/PlaceList';
import PlaceDetailCard from './src/components/PlaceDetailCard';
import Auth from './src/components/Auth';
import { usePlaces } from './src/hooks/usePlaces';
import { useLiveLocation } from './src/hooks/useLiveLocation';
import { supabase } from './src/lib/supabase';

export default function App() {
  const { places, addPlace, deletePlace, updatePlace } = usePlaces();
  const { isLive, toggleLive, username } = useLiveLocation();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [editingPlace, setEditingPlace] = useState(null);
  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [session, setSession] = useState(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getCurrentPositionAsync({});
          setUserLocation(location.coords);
        }
      } catch (e) {
        console.error('Location error:', e);
      }
    })();
  }, []);

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
    if (place) setShowList(false); // Hide list to show detail card
  }, []);

  const handleEditPlace = useCallback((place) => {
    setEditingPlace(place);
    setModalVisible(true);
  }, []);

  const handleConfirmEdit = useCallback(async (placeData) => {
    if (editingPlace.user_id !== session?.user?.id) {
       const newPlace = await addPlace({ ...placeData, isPublic: false });
       setModalVisible(false);
       setEditingPlace(null);
       setSelectedPlace(newPlace);
    } else {
       const updatedPlace = await updatePlace(editingPlace.id, placeData);
       setModalVisible(false);
       setEditingPlace(null);
       if (selectedPlace?.id === editingPlace.id) setSelectedPlace(updatedPlace);
    }
  }, [editingPlace, session, addPlace, updatePlace, selectedPlace]);

  const handleDeletePlace = useCallback(async (id) => {
    await deletePlace(id);
    if (selectedPlace?.id === id) {
      setSelectedPlace(null);
    }
  }, [deletePlace, selectedPlace]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {!session ? (
          <Auth />
        ) : (
          <>
            <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        {/* Map View */}
        <View style={styles.mapContainer}>
          {/* Plan B: Disable Map for testing */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
            <Ionicons name="map-outline" size={64} color="#cbd5e1" />
            <Text style={{ marginTop: 20, color: '#64748b', fontWeight: 'bold' }}>CARTE DÉSACTIVÉE (TEST PLAN B)</Text>
            <Text style={{ marginTop: 5, color: '#94a3b8', fontSize: 12 }}>Si l'appli ne crash plus, c'est la carte !</Text>
          </View>
          {/* 
          <AppMapView
            places={places}
            selectedPlace={selectedPlace}
            onSelectPlace={handleSelectPlace}
            onMapLongPress={handleMapLongPress}
            userLocation={userLocation}
          />
          */}
          
           {/* Floating instructions */}
           <View style={styles.hintContainer} pointerEvents="none">
             {!selectedPlace && (
               <View style={styles.hint}>
                 <Ionicons name="information-circle-outline" size={14} color="#6366f1" style={{ marginRight: 6 }} />
                 <Text style={styles.hintText}>Appui long pour ajouter un lieu</Text>
               </View>
             )}
           </View>

            {/* Live Toggle Button */}
            <TouchableOpacity 
              style={[styles.toggleBtn, styles.liveBtn, isLive && styles.liveBtnActive]} 
              onPress={toggleLive}
            >
              <Ionicons name="radio" size={20} color={isLive ? "#fff" : "#64748b"} />
              {isLive && <View style={styles.livePulse} />}
            </TouchableOpacity>

           {/* Logout Button */}
           <TouchableOpacity 
             style={[styles.toggleBtn, { top: 80 }]} 
             onPress={() => supabase.auth.signOut()}
           >
             <Ionicons name="log-out-outline" size={20} color="#f43f5e" />
           </TouchableOpacity>

           {/* List Toggle Button */}
           <TouchableOpacity 
             style={[styles.toggleBtn, { bottom: selectedPlace ? 280 : 80 }]} 
             onPress={() => {
               setShowList(!showList);
               if (!showList) setSelectedPlace(null);
             }}
           >
             <Ionicons name={showList ? "chevron-down" : "list"} size={20} color="#6366f1" />
           </TouchableOpacity>

           {/* Place Detail Card */}
           {selectedPlace && !showList && (
             <PlaceDetailCard 
               place={selectedPlace} 
               onClose={() => setSelectedPlace(null)}
               onShare={(place) => {/* could use Share.share here */}}
               onEdit={handleEditPlace}
               sessionUserId={session?.user?.id}
             />
           )}
         </View>

         {/* Place List (Bottom Panel) */}
         {showList && (
           <PlaceList
             places={places}
             search={search}
             onSearchChange={setSearch}
             onSelectPlace={handleSelectPlace}
             onDeletePlace={handleDeletePlace}
             selectedPlace={selectedPlace}
             userLocation={userLocation}
           />
         )}
      </KeyboardAvoidingView>

      {/* Add Place Modal */}
      <AddPlaceModal
        visible={modalVisible}
        coords={pendingCoords}
        initialData={editingPlace}
        isFork={editingPlace && editingPlace.user_id !== session?.user?.id}
        onConfirm={editingPlace ? handleConfirmEdit : handleConfirmAdd}
        onClose={() => { setModalVisible(false); setEditingPlace(null); setPendingCoords(null); }}
      />
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
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
    zIndex: 10,
  },
  liveBtn: {
    bottom: 20,
    left: 20,
    backgroundColor: '#fff',
  },
  liveBtnActive: {
    backgroundColor: '#f43f5e',
  },
  livePulse: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#f43f5e',
  },
});
