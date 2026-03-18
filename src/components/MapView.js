import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { getCategoryById } from '../data/categories';

export default function AppMapView({ places, selectedPlace, onSelectPlace, onMapLongPress }) {
  const mapRef = React.useRef(null);

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
              coordinate={{ latitude: place.lat, longitude: place.lng }}
              tracksViewChanges={false}
              onPress={() => onSelectPlace(place)}
            >
              <View style={[styles.marker, { backgroundColor: cat.color }]}>
                <Text style={styles.markerEmoji}>{cat.emoji}</Text>
              </View>
              <Callout onPress={() => {
                const url = Platform.OS === 'ios' 
                  ? `maps://app?daddr=${place.lat},${place.lng}`
                  : `google.navigation:q=${place.lat},${place.lng}`;
                Linking.openURL(url);
              }}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{place.name}</Text>
                  <Text style={styles.calloutCategory}>{cat.label}</Text>
                  {place.description ? <Text style={styles.calloutDesc}>{place.description}</Text> : null}
                  <Text style={styles.calloutNavHint}>Tap pour l'itinéraire 🚗</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <TouchableOpacity style={styles.locateBtn} onPress={centerOnUser}>
        <Text style={styles.locateEmoji}>🎯</Text>
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
  callout: {
    width: 150,
    padding: 5,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  calloutCategory: {
    fontSize: 12,
    color: '#666',
  },
  calloutDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  calloutNavHint: {
    fontSize: 10,
    color: '#6366f1',
    marginTop: 5,
    fontWeight: 'bold',
  },
});
