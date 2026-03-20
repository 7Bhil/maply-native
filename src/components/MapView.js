import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Linking, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { getCategoryById } from '../data/categories';

export default function AppMapView({ places, selectedPlace, onSelectPlace, onMapLongPress, userLocation }) {
  const mapRef = React.useRef(null);
  const markerRefs = React.useRef({});

  const centerOnUser = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Permission de localisation refusée');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  // Expose centerOnUser via imperative handle if needed, or just a floating button inside MapView

  React.useEffect(() => {
    if (selectedPlace && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: selectedPlace.lat,
        longitude: selectedPlace.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);

      // Auto-open callout
      setTimeout(() => {
        markerRefs.current[selectedPlace.id]?.showCallout();
      }, 500); // Sooner is usually better
    }
  }, [selectedPlace]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        zoomEnabled={true}
        rotateEnabled={true}
        showsUserLocation={true}
        onLongPress={(e) => onMapLongPress(e.nativeEvent.coordinate)}
        initialRegion={{
          latitude: 48.8566,
          longitude: 2.3522,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* User Location Marker with Bubble */}
        {userLocation && (
          <Marker
            coordinate={{ 
              latitude: userLocation.latitude, 
              longitude: userLocation.longitude 
            }}
            title="Ma Position"
            description="Tu es ici !"
            pinColor="#6366f1"
          >
            <View style={[styles.marker, { backgroundColor: '#6366f1' }]} pointerEvents="none">
              <Ionicons name="person" size={16} color="#fff" />
            </View>
            <Callout tooltip={true}>
              <View style={styles.calloutBubble}>
                <View style={styles.calloutContent}>
                  <View style={styles.calloutHeader}>
                    <View style={[styles.calloutIconContainer, { backgroundColor: '#6366f122' }]}>
                      <Ionicons name="person" size={18} color="#6366f1" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.calloutTitle}>Ma Position</Text>
                      <Text style={[styles.calloutCategory, { color: '#6366f1' }]}>Utilisateur</Text>
                    </View>
                  </View>
                  <Text style={styles.calloutDesc}>C'est ici que tu te trouves actuellement sur la carte.</Text>
                  <View style={styles.calloutFooter}>
                    <Text style={styles.calloutFooterText}>{userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}</Text>
                    <Text style={styles.calloutFooterText}>Maintenant</Text>
                  </View>
                </View>
                <View style={[styles.calloutArrow, { borderTopColor: '#1e293b' }]} />
              </View>
            </Callout>
          </Marker>
        )}
        {places.map((place) => {
          const cat = getCategoryById(place.category);
          return (
            <Marker
              key={place.id}
              ref={(el) => (markerRefs.current[place.id] = el)}
              coordinate={{ latitude: place.lat, longitude: place.lng }}
              onPress={() => onSelectPlace(place)}
              title={place.name}
              description={place.description}
            >
              <View style={[styles.marker, { backgroundColor: cat.color }]} pointerEvents="none">
                <Ionicons name={cat.icon?.replace('-outline', '') || 'location'} size={16} color="#fff" />
              </View>
              <Callout 
                tooltip={true}
                onPress={() => {
                  const url = Platform.OS === 'ios' 
                    ? `maps://app?daddr=${place.lat},${place.lng}`
                    : `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
                  Linking.openURL(url);
                }}
              >
                <View style={styles.calloutBubble}>
                  <View style={styles.calloutContent}>
                    <View style={styles.calloutHeader}>
                      <View style={[styles.calloutIconContainer, { backgroundColor: cat.color + '22' }]}>
                        <Ionicons name={cat.icon?.replace('-outline', '') || 'location'} size={18} color={cat.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={styles.calloutTitle} numberOfLines={1}>{place.name}</Text>
                          {place.isFavorite && <Ionicons name="heart" size={14} color="#f43f5e" />}
                        </View>
                        <Text style={[styles.calloutCategory, { color: cat.color }]}>{cat.label}</Text>
                      </View>
                    </View>

                    <View style={styles.calloutRating}>
                      <Text style={{ fontSize: 16 }}>{'⭐️'.repeat(Math.round(place.rating || 3))}</Text>
                    </View>

                    {place.description ? (
                      <Text style={styles.calloutDesc} numberOfLines={4}>{place.description}</Text>
                    ) : null}

                    {place.image && (
                      <Image source={{ uri: place.image }} style={styles.calloutImage} />
                    )}

                    <View style={styles.calloutFooter}>
                      <Text style={styles.calloutFooterText}>{place.lat.toFixed(4)}, {place.lng.toFixed(4)}</Text>
                      <Text style={styles.calloutFooterText}>
                        {new Date(place.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.calloutArrow} />
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <TouchableOpacity style={styles.locateBtn} onPress={centerOnUser}>
        <Ionicons name="location" size={20} color="#6366f1" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  locateBtn: {
    position: 'absolute',
    bottom: 20,
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
  locateEmoji: {
    fontSize: 20,
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerEmoji: {
    fontSize: 16,
  },
  calloutBubble: {
    width: 260,
    alignItems: 'center',
  },
  calloutContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    width: '100%',
    minHeight: 100, // Important for tooltip=true on some Androids
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  calloutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  calloutTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#f8fafc',
    flex: 1,
  },
  calloutCategory: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -2,
  },
  calloutRating: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  calloutDesc: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 12,
  },
  calloutImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#0f172a',
  },
  calloutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  calloutFooterText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  calloutArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1e293b',
    marginTop: -1,
  },
});
