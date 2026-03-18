import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { CATEGORIES } from '../data/categories';

export default function AddPlaceModal({ visible, coords, onConfirm, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [rating, setRating] = useState(3);
  const [addressSearch, setAddressSearch] = useState('');
  const [addressResults, setAddressResults] = useState([]);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [customCoords, setCustomCoords] = useState(null);

  const searchAddress = async (query) => {
    setAddressSearch(query);
    if (query.length < 3) {
      setAddressResults([]);
      return;
    }
    setLoadingAddr(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`);
      const data = await res.json();
      setAddressResults(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingAddr(false);
    }
  };

  const handleSelectAddr = (item) => {
    setName(item.display_name.split(',')[0]);
    setCustomCoords({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    });
    setAddressResults([]);
    setAddressSearch('');
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onConfirm({
      name: name.trim(),
      description: description.trim(),
      category,
      lat: customCoords?.latitude || coords.latitude,
      lng: customCoords?.longitude || coords.longitude,
      rating,
    });
    setName('');
    setDescription('');
    setCategory('other');
    setRating(3);
    setCustomCoords(null);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Ajouter un lieu</Text>
          <Text style={styles.coords}>
            📍 {(customCoords?.latitude || coords?.latitude)?.toFixed(4)}, {(customCoords?.longitude || coords?.longitude)?.toFixed(4)}
          </Text>

          <View style={{ marginBottom: 15 }}>
            <Text style={styles.label}>Rechercher une adresse</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Tour Eiffel, Paris..."
              value={addressSearch}
              onChangeText={searchAddress}
            />
            {loadingAddr && <Text style={{ fontSize: 10, color: '#6366f1', marginTop: 2 }}>Recherche...</Text>}
            {addressResults.length > 0 && (
              <View style={styles.results}>
                {addressResults.map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.resultItem} onPress={() => handleSelectAddr(item)}>
                    <Text numberOfLines={1} style={styles.resultText}>{item.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>Nom du lieu *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Le Petit Café"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décris ce lieu..."
              value={description}
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={3}
            />

            <Text style={styles.label}>Catégorie</Text>
            <View style={styles.categories}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catBtn,
                    category === cat.id && { backgroundColor: cat.color, borderColor: cat.color }
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={[styles.catEmoji, category === cat.id && { color: '#fff' }]}>{cat.emoji}</Text>
                  <Text style={[styles.catLabel, category === cat.id && { color: '#fff' }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Note</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Text style={{ fontSize: 24, opacity: rating >= s ? 1 : 0.2 }}>⭐️</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleSubmit}>
              <Text style={styles.confirmText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  coords: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  catEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  catLabel: {
    fontSize: 12,
    color: '#444',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  confirmBtn: {
    flex: 2,
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#6366f1',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  results: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultText: {
    fontSize: 12,
    color: '#333',
  },
});
