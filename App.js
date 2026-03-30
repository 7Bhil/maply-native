import React, { useState, useCallback } from 'react';
import { StyleSheet, View, StatusBar, TouchableOpacity, Text, KeyboardAvoidingView, Platform, TextInput, Keyboard, Modal } from 'react-native';
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
import { useLiveUsers } from './src/hooks/useLiveUsers';
import { supabase } from './src/lib/supabase';

export default function App() {
  const { places, addPlace, deletePlace, updatePlace } = usePlaces();
  const { isLive, toggleLive, username: localUsername } = useLiveLocation();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showPseudoPrompt, setShowPseudoPrompt] = useState(false);
  const [newPseudo, setNewPseudo] = useState('');
  
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [editingPlace, setEditingPlace] = useState(null);
  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchCoords, setSearchCoords] = useState(null);
  const [searchExpanded, setSearchExpanded] = useState(false);

  const liveUsers = useLiveUsers(profile?.username || localUsername);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setShowPseudoPrompt(false);
      }
    });
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) {
        setProfile(data);
        setShowPseudoPrompt(false);
      } else if (error && (error.code === 'PGRST116' || error.message.includes('profiles'))) {
        setShowPseudoPrompt(true);
      }
    } catch (e) {
      setShowPseudoPrompt(true);
    }
  };

  const handleSetPseudo = async () => {
    if (!newPseudo.trim()) return;
    try {
      const { error } = await supabase.from('profiles').upsert({ id: session.user.id, username: newPseudo.trim() });
      if (!error) {
        fetchProfile(session.user.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

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
    setSearchExpanded(false);
    setPendingCoords(coords);
    setModalVisible(true);
  }, []);

  const handleConfirmAdd = useCallback(async (placeData) => {
    const newPlace = await addPlace(placeData);
    setModalVisible(false);
    setSelectedPlace(newPlace);
  }, [addPlace]);

  const handleSelectPlace = useCallback((place) => {
    setSearchExpanded(false);
    setSelectedPlace(place);
    if (place) setShowList(false);
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
              <View style={styles.mapContainer}>
                <AppMapView
                  places={places}
                  selectedPlace={selectedPlace || searchCoords}
                  onSelectPlace={handleSelectPlace}
                  onMapLongPress={handleMapLongPress}
                  userLocation={userLocation}
                  liveUsers={liveUsers}
                />
                
                {/* Expandable Search Bar */}
                <View style={[styles.searchBar, searchExpanded && styles.searchBarExpanded]}>
                  <TouchableOpacity 
                    style={styles.searchIconBtn} 
                    onPress={() => setSearchExpanded(!searchExpanded)}
                  >
                    <Ionicons name={searchExpanded ? "close" : "search"} size={20} color="#6366f1" />
                  </TouchableOpacity>
                  
                  {searchExpanded && (
                    <TextInput
                      style={styles.searchInput}
                      autoFocus
                      placeholder="Chercher..."
                      value={searchQuery}
                      onChangeText={async (text) => {
                        setSearchQuery(text);
                        if (text.length > 3) {
                          try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5`, { headers: { 'User-Agent': 'Maply-App' } });
                            const data = await res.json();
                            setSearchResults(data);
                          } catch (e) {}
                        } else {
                          setSearchResults([]);
                        }
                      }}
                    />
                  )}
                  
                  {searchExpanded && searchResults.length > 0 && (
                    <View style={styles.searchResults}>
                      {searchResults.map((item, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={styles.searchResultItem}
                          onPress={() => {
                            const lat = parseFloat(item.lat);
                            const lng = parseFloat(item.lon);
                            setSearchCoords({ lat, lng, name: item.display_name });
                            setSearchQuery('');
                            setSearchResults([]);
                            setSearchExpanded(false);
                            Keyboard.dismiss();
                          }}
                        >
                          <Text numberOfLines={1} style={styles.searchResultText}>{item.display_name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                 <View style={styles.hintContainer} pointerEvents="none">
                   {!selectedPlace && (
                     <View style={styles.hint}>
                       <Ionicons name="information-circle-outline" size={14} color="#6366f1" style={{ marginRight: 6 }} />
                       <Text style={styles.hintText}>Appui long pour ajouter un lieu</Text>
                     </View>
                   )}
                 </View>

                   <View style={styles.liveContainer}>
                     <TouchableOpacity 
                       style={[styles.toggleBtn, styles.liveBtn, isLive && styles.liveBtnActive]} 
                       onPress={toggleLive}
                     >
                       <Ionicons name="radio" size={20} color={isLive ? "#fff" : "#64748b"} />
                       {isLive && <View style={styles.livePulse} />}
                     </TouchableOpacity>
                     {liveUsers.length > 0 && (
                       <View style={styles.worldCounter}>
                         <View style={styles.onlineDot} />
                         <Text style={styles.worldCounterText}>{liveUsers.length} {liveUsers.length > 1 ? 'actifs' : 'actif'}</Text>
                       </View>
                     )}
                   </View>

                 <TouchableOpacity 
                   style={[styles.toggleBtn, { top: 80 }]} 
                   onPress={() => supabase.auth.signOut()}
                 >
                   <Ionicons name="log-out-outline" size={20} color="#f43f5e" />
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={[styles.toggleBtn, { bottom: selectedPlace ? 280 : 80 }]} 
                   onPress={() => {
                     setShowList(!showList);
                     if (!showList) setSelectedPlace(null);
                     setSearchExpanded(false);
                   }}
                 >
                   <Ionicons name={showList ? "chevron-down" : "list"} size={20} color="#6366f1" />
                 </TouchableOpacity>

                 {selectedPlace && !showList && (
                   <PlaceDetailCard 
                     place={selectedPlace} 
                     onClose={() => setSelectedPlace(null)}
                     onShare={(place) => {}}
                     onEdit={handleEditPlace}
                     sessionUserId={session?.user?.id}
                   />
                 )}
               </View>

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

            {/* Pseudo Prompt Modal */}
            <Modal visible={showPseudoPrompt} transparent={true} animationType="fade">
              <View style={styles.promptOverlay}>
                <View style={styles.promptModal}>
                  <Text style={styles.promptTitle}>Bienvenue !</Text>
                  <Text style={styles.promptText}>Choisissez un pseudo pour partager vos lieux.</Text>
                  <TextInput
                    style={styles.promptInput}
                    placeholder="Votre pseudo"
                    value={newPseudo}
                    onChangeText={setNewPseudo}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.promptBtn} onPress={handleSetPseudo}>
                    <Text style={styles.promptBtnText}>Confirmer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

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
  container: { flex: 1, backgroundColor: '#fff' },
  mapContainer: { flex: 1, position: 'relative' },
  hintContainer: { position: 'absolute', top: 20, left: 20, right: 20, alignItems: 'center' },
  hint: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24,
    flexDirection: 'row', alignItems: 'center', elevation: 6,
  },
  hintText: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  toggleBtn: {
    position: 'absolute', right: 20, width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 4, zIndex: 10,
  },
  liveBtn: { padding: 0 },
  liveBtnActive: { backgroundColor: '#f43f5e' },
  liveContainer: { 
    position: 'absolute', bottom: 20, left: 20, flexDirection: 'row', alignItems: 'center', gap: 10 
  },
  worldCounter: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', elevation: 4,
  },
  onlineDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6,
  },
  worldCounterText: {
    fontSize: 12, fontWeight: '700', color: '#1e293b',
  },
  livePulse: {
    position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#f43f5e',
  },
  searchBar: { 
    position: 'absolute', top: 60, left: 20, width: 44, height: 44, 
    borderRadius: 22, backgroundColor: '#fff', elevation: 4, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
  },
  searchBarExpanded: {
    right: 70, width: 'auto', borderRadius: 12,
  },
  searchIconBtn: {
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
  },
  searchInput: { 
    flex: 1, fontSize: 14, color: '#1e293b', paddingRight: 15,
  },
  searchResults: {
    position: 'absolute', top: 50, left: 0, right: 0,
    backgroundColor: '#fff', borderRadius: 12, elevation: 5, overflow: 'hidden',
  },
  searchResultItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchResultText: { fontSize: 13, color: '#475569' },
  promptOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  promptModal: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center' },
  promptTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
  promptText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  promptInput: { width: '100%', height: 50, backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 15, fontSize: 16, marginBottom: 20 },
  promptBtn: { width: '100%', height: 50, backgroundColor: '#6366f1', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  promptBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
