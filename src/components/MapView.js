import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Linking, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { getCategoryById } from '../data/categories';

export default function AppMapView({ places, selectedPlace, onSelectPlace, onMapLongPress }) {
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
      }, 1100);
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
              <View style={[styles.marker, { backgroundColor: cat.color }]}>
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
                    {place.image && (
                      <Image source={{ uri: place.image }} style={styles.calloutImage} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Text style={styles.calloutTitle}>{place.name}</Text>
                      {place.isFavorite && <Ionicons name="heart" size={14} color="#f43f5e" />}
                    </View>
                    <Text style={styles.calloutCategory}>{cat.label}</Text>
                    {place.description ? (
                      <Text style={styles.calloutDesc} numberOfLines={3}>{place.description}</Text>
                    ) : null}
                    <View style={styles.calloutFooter}>
                      <Ionicons name="navigate-circle" size={14} color="#6366f1" />
                      <Text style={styles.calloutNavHint}>Itinéraire</Text>
                    </View>
                  </View>
                  {/* Arrow for the bubble */}
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
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
  },
  calloutContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#1e293b',
  },
  calloutImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  calloutCategory: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  calloutDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 8,
  },
  calloutFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 2,
  },
  calloutNavHint: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '700',
  },
  calloutArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    marginTop: -1, // Adjust to overlap with bubble
  },
});
