import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAudiobooks } from '../hooks/useAudiobooks';
import { AudiobookCard } from '../components/AudiobookCard';
import { AddAudiobookModal } from '../components/AddAudiobookModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const { audiobooks, loading, addAudiobook, deleteAudiobook, refresh } = useAudiobooks();
  const [showAddModal, setShowAddModal] = useState(false);

  const handleCardPress = (id: string) => {
    router.push(`/player?id=${id}`);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Audiobook',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAudiobook(id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete audiobook');
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all audiobooks. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              await refresh();
              Alert.alert('Success', 'All data cleared!');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center p-8">
      <MaterialIcons name="library-music" size={64} color="#C7C7CC" />
      <Text className="text-xl font-semibold text-gray-800 mt-4 text-center">
        No Audiobooks Yet
      </Text>
      <Text className="text-base text-gray-600 mt-2 text-center">
        Tap the + button to add your first audiobook from YouTube
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white pt-12 pb-4 px-6 flex-row items-center justify-between shadow-sm">
        <View>
          <Text className="text-2xl font-bold text-gray-900">My Audiobooks</Text>
          <Text className="text-sm text-gray-500 mt-0.5">
            {audiobooks.length} {audiobooks.length === 1 ? 'book' : 'books'}
          </Text>
        </View>
        {audiobooks.length > 0 && (
          <TouchableOpacity
            onPress={handleClearAll}
            className="bg-red-50 p-3 rounded-full"
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete-sweep" size={24} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={audiobooks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AudiobookCard
            audiobook={item}
            onPress={() => handleCardPress(item.id)}
            onDelete={() => handleDelete(item.id, item.title)}
          />
        )}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={{
          padding: 16,
          flexGrow: audiobooks.length === 0 ? 1 : undefined
        }}
        refreshing={loading}
      />

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-lg"
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>

      <AddAudiobookModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addAudiobook}
      />
    </View>
  );
}