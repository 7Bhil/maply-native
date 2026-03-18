import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Share, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryById } from '../data/categories';

export default function PlaceList({ places, search, onSearchChange, onSelectPlace, onDeletePlace, selectedPlace, userLocation }) {
  const [filter, setFilter] = useState('all'); // all, favorites, high_rated

  const filtered = places.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filter === 'favorites') return p.isFavorite;
    if (filter === 'high_rated') return (p.rating || 0) >= 4;
    return true;
  });

  const handleShare = async (place) => {
    try {
      const message = `Regarde ce lieu sur Maply : ${place.name}\n${place.description || ''}\nCoordonnées : ${place.lat}, ${place.lng}`;
      await Share.share({
        message,
        title: place.name,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const calculateDistance = (lat, lng) => {
    if (!userLocation) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat - userLocation.latitude) * (Math.PI / 180);
    const dLon = (lng - userLocation.longitude) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.latitude * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; 
    return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un lieu..."
          value={search}
          onChangeText={onSearchChange}
        />
        
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]} 
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Tous</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'favorites' && styles.filterChipActive]} 
            onPress={() => setFilter('favorites')}
          >
            <Ionicons name="heart" size={14} color={filter === 'favorites' ? '#fff' : '#f43f5e'} />
            <Text style={[styles.filterText, filter === 'favorites' && styles.filterTextActive]}>Favoris</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'high_rated' && styles.filterChipActive]} 
            onPress={() => setFilter('high_rated')}
          >
            <Text style={[styles.filterText, filter === 'high_rated' && styles.filterTextActive]}>4+ ⭐</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const cat = getCategoryById(item.category);
          return (
            <TouchableOpacity style={styles.card} onPress={() => onSelectPlace(item)}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.icon, { backgroundColor: cat.color + '15' }]}>
                  <Ionicons name={cat.icon || 'location'} size={20} color={cat.color} />
                </View>
              )}
               <View style={styles.info}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                   <Text style={styles.name}>{item.name}</Text>
                   {item.isFavorite && <Ionicons name="heart" size={12} color="#f43f5e" />}
                   <Text style={{ fontSize: 10 }}>{'⭐️'.repeat(Math.max(0, Math.floor(item.rating || 3)))}</Text>
                 </View>
                 <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                   <Text style={styles.category}>{cat.label}</Text>
                   {userLocation && (
                     <Text style={styles.distance}>{calculateDistance(item.lat, item.lng)}</Text>
                   )}
                 </View>
                 {selectedPlace?.id === item.id && item.description ? (
                   <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
                 ) : null}
               </View>
               <View style={styles.actions}>
                <TouchableOpacity style={styles.share} onPress={() => handleShare(item)}>
                  <Ionicons name="share-outline" size={20} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.delete} onPress={() => onDeletePlace(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#cbd5e1" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun lieu trouvé 🏝️</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    maxHeight: 300,
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1e293b',
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  emoji: {
    fontSize: 20,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 15,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  category: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  share: {
    padding: 10,
    marginRight: 5,
  },
  delete: {
    padding: 10,
  },
  deleteText: {
    fontSize: 18,
    color: '#ccc',
  },
  actionEmoji: {
    fontSize: 18,
  },
  distance: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    lineHeight: 18,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});
