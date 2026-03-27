import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, ScrollView, Keyboard, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CATEGORIES } from '../data/categories';

export default function AddPlaceModal({ visible, coords, onConfirm, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [rating, setRating] = useState(3);
  const [isFavorite, setIsFavorite] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [addressSearch, setAddressSearch] = useState('');
  const [addressResults, setAddressResults] = useState([]);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [customCoords, setCustomCoords] = useState(null);
  const [isPublic, setIsPublic] = useState(true);

  const searchAddress = async (query) => {
    setAddressSearch(query);
    if (query.length < 3) {
      setAddressResults([]);
      return;
    }
    setLoadingAddr(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`, {
        headers: {
          'User-Agent': 'Maply-Mobile-App-User'
        }
      });
      const data = await res.json();
      setAddressResults(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingAddr(false);
    }
  };

  const handleSelectAddr = (item) => {
    Keyboard.dismiss();
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (isNaN(lat) || isNaN(lng)) return;

    setName(item.display_name.split(',')[0]);
    setCustomCoords({ latitude: lat, longitude: lng });
    setAddressResults([]);
    setAddressSearch('');
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
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
      isFavorite,
      image: photo,
      is_public: isPublic,
    });
    setName('');
    setDescription('');
    setCategory('other');
    setRating(3);
    setIsFavorite(false);
    setPhoto(null);
    setCustomCoords(null);
    setIsPublic(true);
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
                  <Ionicons name={cat.icon || 'location-outline'} size={14} color={category === cat.id ? '#fff' : '#64748b'} style={{ marginRight: 4 }} />
                  <Text style={[styles.catLabel, category === cat.id && { color: '#fff' }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Note</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 5, alignItems: 'center' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Text style={{ fontSize: 24, opacity: rating >= s ? 1 : 0.2 }}>⭐️</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={{ marginLeft: 20, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => setIsFavorite(!isFavorite)}
              >
                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color="#f43f5e" />
                <Text style={{ marginLeft: 5, fontSize: 12, fontWeight: '600', color: '#64748b' }}>Coup de cœur</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Photo</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
              <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                <Ionicons name="camera-outline" size={24} color="#6366f1" />
                <Text style={styles.photoBtnText}>{photo ? 'Changer' : 'Ajouter une photo'}</Text>
              </TouchableOpacity>
              {photo && (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: photo }} style={styles.photoPreview} />
                  <TouchableOpacity style={styles.removePhoto} onPress={() => setPhoto(null)}>
                    <Ionicons name="close-circle" size={20} color="#f43f5e" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={styles.label}>Visibilité</Text>
            <TouchableOpacity 
              style={[
                styles.visibilityBtn, 
                { backgroundColor: isPublic ? '#e0e7ff' : '#f1f5f9', borderColor: isPublic ? '#818cf8' : '#cbd5e1' }
              ]} 
              onPress={() => setIsPublic(!isPublic)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name={isPublic ? "eye-outline" : "eye-off-outline"} size={22} color={isPublic ? '#4f46e5' : '#64748b'} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: isPublic ? '#3730a3' : '#334155' }}>
                    {isPublic ? 'Publique' : 'Privé'}
                  </Text>
                  <Text style={{ fontSize: 12, color: isPublic ? '#4f46e5' : '#64748b', marginTop: 2 }}>
                    {isPublic ? 'Visible par tout le monde' : 'Visible uniquement par vous'}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.toggleTrack, 
                { backgroundColor: isPublic ? '#4f46e5' : '#cbd5e1' }
              ]}>
                <View style={[
                  styles.toggleThumb, 
                  { transform: [{ translateX: isPublic ? 16 : 0 }] }
                ]} />
              </View>
            </TouchableOpacity>
            
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
    display: 'none',
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
  photoBtn: {
    flex: 1,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  photoBtnText: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 4,
    fontWeight: '600',
  },
  photoPreviewContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  removePhoto: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  visibilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 5,
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
