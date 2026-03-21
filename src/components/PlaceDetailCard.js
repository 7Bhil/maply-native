import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryById } from '../data/categories';

export default function PlaceDetailCard({ place, onClose, onShare }) {
  if (!place) return null;
  const cat = getCategoryById(place.category);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Ionicons name="close-circle" size={24} color="#cbd5e1" />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: cat.color + '15' }]}>
          <Ionicons name={cat.icon?.replace('-outline', '') || 'location'} size={24} color={cat.color} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{place.name}</Text>
          <Text style={[styles.category, { color: cat.color }]}>{cat.label}</Text>
        </View>
      </View>

      <View style={styles.ratingRow}>
         <Text style={{ fontSize: 16 }}>{'⭐️'.repeat(Math.round(place.rating || 3))}</Text>
         {place.isFavorite && (
           <View style={styles.favoriteBadge}>
             <Ionicons name="heart" size={14} color="#f43f5e" />
             <Text style={styles.favoriteText}>Favori</Text>
           </View>
         )}
      </View>

      {place.description ? (
        <Text style={styles.description} numberOfLines={4}>{place.description}</Text>
      ) : null}

      {place.image && (
        <Image source={{ uri: place.image }} style={styles.image} />
      )}

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.navBtn} 
          onPress={() => {
            const url = Platform.OS === 'ios' 
              ? `maps://app?daddr=${place.lat},${place.lng}`
              : `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
            Linking.openURL(url);
          }}
        >
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={styles.navBtnText}>Y aller</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareBtn} onPress={() => onShare(place)}>
          <Ionicons name="share-social-outline" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 1000,
  },
  closeBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  favoriteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  favoriteText: {
    fontSize: 12,
    color: '#f43f5e',
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 15,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 15,
    backgroundColor: '#f1f5f9',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  navBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  shareBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
