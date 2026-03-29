import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { CATEGORIES } from '../data/categories';

export default function AppMapView({ places, selectedPlace, onSelectPlace, onMapLongPress, userLocation }) {
  const webViewRef = useRef(null);

  const getCategoryById = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

  // HTML content for Leaflet Map
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; height: 100vh; width: 100vw; }
          #map { height: 100%; width: 100%; background: #f8fafc; }
          .marker-pin {
            width: 30px; height: 30px; border-radius: 50% 50% 50% 0;
            position: absolute; transform: rotate(-45deg); left: 50%; top: 50%; margin: -15px 0 0 -15px;
            display: flex; justify-content: center; align-items: center; border: 2px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          }
          .marker-pin i { transform: rotate(45deg); color: white; font-style: normal; font-size: 14px; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([48.8566, 2.3522], 13);
          
          // CartoDB Voyager - beautiful and less restrictive
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            attribution: '© OpenStreetMap © CARTO'
          }).addTo(map);

          var markers = {};
          var userMarker = null;
          var routeLine = null;

          function updateMarkers(placesJson) {
            const places = JSON.parse(placesJson);
            Object.values(markers).forEach(m => map.removeLayer(m));
            markers = {};

            places.forEach(place => {
              if (!place.lat || !place.lng) return;
              
              const icon = L.divIcon({
                className: 'custom-div-icon',
                html: \`<div class="marker-pin" style="background-color: \${place.color || '#6366f1'}"><i>\${place.icon || '📍'}</i></div>\`,
                iconSize: [30, 42],
                iconAnchor: [15, 42]
              });

              const m = L.marker([place.lat, place.lng], { icon: icon }).addTo(map);
              m.on('click', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'onSelectPlace', payload: place }));
              });
              markers[place.id] = m;
            });
          }

          function updateUserLocation(lat, lng) {
            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.circleMarker([lat, lng], {
              radius: 8, fillColor: '#6366f1', color: '#fff', weight: 3, opacity: 1, fillOpacity: 0.8
            }).addTo(map);
          }

          function drawTrajectory(lat1, lng1, lat2, lng2) {
            if (routeLine) map.removeLayer(routeLine);
            routeLine = L.polyline([[lat1, lng1], [lat2, lng2]], {
              color: '#6366f1',
              dashArray: '10, 10',
              weight: 3,
              opacity: 0.6
            }).addTo(map);
          }

          function centerOn(lat, lng, zoom) {
            map.setView([lat, lng], zoom || map.getZoom());
          }

          map.on('contextmenu', (e) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'onMapLongPress', 
              payload: { latitude: e.latlng.lat, longitude: e.latlng.lng } 
            }));
          });

          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        </script>
      </body>
    </html>
  `;

  // Sync markers
  useEffect(() => {
    const placesWithMeta = places.map(p => {
      const cat = getCategoryById(p.category);
      return { ...p, color: cat.color, icon: cat.label.substring(0, 2) };
    });
    const script = `if (typeof updateMarkers === 'function') updateMarkers('${JSON.stringify(placesWithMeta).replace(/'/g, "\\'")}');`;
    webViewRef.current?.injectJavaScript(script);
  }, [places]);

  // Sync user location
  useEffect(() => {
    if (userLocation) {
      const script = `if (typeof updateUserLocation === 'function') updateUserLocation(${userLocation.latitude}, ${userLocation.longitude});`;
      webViewRef.current?.injectJavaScript(script);
    }
  }, [userLocation]);

  // Sync trajectory
  useEffect(() => {
    if (selectedPlace && userLocation && webViewRef.current) {
      const script = `if (typeof drawTrajectory === 'function') drawTrajectory(${userLocation.latitude}, ${userLocation.longitude}, ${selectedPlace.lat}, ${selectedPlace.lng});`;
      webViewRef.current?.injectJavaScript(script);
    } else if (!selectedPlace && routeLineExists() && webViewRef.current) {
       webViewRef.current?.injectJavaScript(`if (routeLine) map.removeLayer(routeLine); routeLine = null;`);
    }
  }, [selectedPlace, userLocation]);

  const routeLineExists = () => true; // Helper

  // Sync initial view or center
  useEffect(() => {
    if (selectedPlace && webViewRef.current) {
      const script = `if (typeof centerOn === 'function') centerOn(${selectedPlace.lat}, ${selectedPlace.lng}, 15);`;
      webViewRef.current?.injectJavaScript(script);
    }
  }, [selectedPlace]);

  const onMessage = (event) => {
    try {
      const { type, payload } = JSON.parse(event.nativeEvent.data);
      if (type === 'onSelectPlace') {
        onSelectPlace(payload);
      } else if (type === 'onMapLongPress') {
        onMapLongPress(payload);
      } else if (type === 'ready') {
        // Full initial sync
        const placesWithMeta = places.map(p => {
          const cat = getCategoryById(p.category);
          return { ...p, color: cat.color, icon: cat.label.substring(0, 2) };
        });
        webViewRef.current?.injectJavaScript(`updateMarkers('${JSON.stringify(placesWithMeta).replace(/'/g, "\\'")}');`);
        if (userLocation) {
          webViewRef.current?.injectJavaScript(`updateUserLocation(${userLocation.latitude}, ${userLocation.longitude});`);
        }
      }
    } catch (e) {
      console.error('WebView Message Error:', e);
    }
  };

  const centerOnUser = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    let location = await Location.getCurrentPositionAsync({});
    const script = `if (typeof centerOn === 'function') centerOn(${location.coords.latitude}, ${location.coords.longitude}, 15);`;
    webViewRef.current?.injectJavaScript(script);
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={onMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
        renderLoading={() => <View style={styles.loading}><Text style={{color: '#64748b'}}>Chargement de la carte...</Text></View>}
      />

      <TouchableOpacity style={styles.locateBtn} onPress={centerOnUser}>
        <Ionicons name="location" size={20} color="#6366f1" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
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
});
