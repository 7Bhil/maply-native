import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { CATEGORIES } from '../data/categories';

export default function AddPlaceModal({ visible, coords, onConfirm, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onConfirm({
      name: name.trim(),
      description: description.trim(),
      category,
      lat: coords.latitude,
      lng: coords.longitude,
    });
    setName('');
    setDescription('');
    setCategory('other');
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Ajouter un lieu</Text>
          <Text style={styles.coords}>
            📍 {coords?.latitude?.toFixed(4)}, {coords?.longitude?.toFixed(4)}
          </Text>

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
});
