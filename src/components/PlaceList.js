import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Share } from 'react-native';
import { getCategoryById } from '../data/categories';

export default function PlaceList({ places, search, onSearchChange, onSelectPlace, onDeletePlace }) {
  const filtered = places.filter((p) => 
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.search}
          placeholder="Rechercher un lieu..."
          value={search}
          onChangeText={onSearchChange}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const cat = getCategoryById(item.category);
          return (
            <TouchableOpacity style={styles.card} onPress={() => onSelectPlace(item)}>
              <View style={[styles.icon, { backgroundColor: cat.color + '22' }]}>
                <Text style={styles.emoji}>{cat.emoji}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.category}>{cat.label}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.share} onPress={() => handleShare(item)}>
                  <Text style={styles.actionEmoji}>📤</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delete} onPress={() => onDeletePlace(item.id)}>
                  <Text style={styles.deleteText}>✕</Text>
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
    borderBottomColor: '#eee',
  },
  search: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
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
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});
