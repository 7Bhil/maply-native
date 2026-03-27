import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Linking, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout, Polyline } from 'react-native-maps';
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

  const [routeData, setRouteData] = useState(null);

  useEffect(() => {
    if (selectedPlace && userLocation) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLocation.longitude},${userLocation.latitude};${selectedPlace.lng},${selectedPlace.lat}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates.map(c => ({
              latitude: c[1],
              longitude: c[0]
            }));
            const durationSec = data.routes[0].duration;
            const distanceM = data.routes[0].distance;
            
            const hours = Math.floor(durationSec / 3600);
            const minutes = Math.floor((durationSec % 3600) / 60);
            let timeStr = '';
            if (hours > 0) timeStr += `${hours}h `;
            timeStr += `${minutes}m`;

            const distStr = distanceM > 1000 ? `${(distanceM / 1000).toFixed(1)} km` : `${Math.round(distanceM)} m`;

            setRouteData({ coords, timeStr, distStr });
          }
        } catch(e) {
          console.error(e);
        }
      };
      fetchRoute();
    } else {
      setRouteData(null);
    }
  }, [selectedPlace, userLocation]);

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
              onPress={(e) => {
                e.stopPropagation();
                onSelectPlace(place);
              }}
              title={place.name}
              description={place.description || cat.label}
            >
              <View style={[styles.marker, { backgroundColor: cat.color }]} pointerEvents="none">
                <Ionicons name={cat.icon?.replace('-outline', '') || 'location'} size={16} color="#fff" />
              </View>
            </Marker>
          );
        })}
        {routeData && (
          <Polyline
            coordinates={routeData.coords}
            strokeColor="#6366f1"
            strokeWidth={4}
            lineDashPattern={[10, 10]}
          />
        )}
      </MapView>

      {routeData && (
        <View style={styles.etaPill} pointerEvents="none">
          <Text style={styles.etaTime}>🚗 {routeData.timeStr}</Text>
          <Text style={styles.etaDist}>({routeData.distStr} - sans trafic)</Text>
        </View>
      )}

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
    width: 250,
    height: 140,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  calloutContent: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    height: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  calloutTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#f8fafc',
    marginBottom: 2,
  },
  calloutCategory: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  calloutDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    flex: 1,
  },
  calloutFooter: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 6,
  },
  calloutFooterText: {
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
    borderTopColor: '#1e293b',
    marginTop: -1,
  },
  etaPill: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  etaTime: {
    color: '#6366f1',
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 8,
  },
  etaDist: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
});
