import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { youtubeService } from '../services/youtube';
import { startDownload } from '../services/downloadManager';
import type { Audiobook } from '../types/audiobook';

interface AddAudiobookModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (audiobook: Audiobook) => Promise<void>;
}

export function AddAudiobookModal({ visible, onClose, onAdd }: AddAudiobookModalProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidYoutubeUrl = (url: string): boolean => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return pattern.test(url);
  };

  const handleAdd = async () => {
    if (!youtubeUrl.trim()) {
      Alert.alert('Error', 'Please enter a YouTube URL');
      return;
    }

    if (!isValidYoutubeUrl(youtubeUrl)) {
      Alert.alert('Error', 'Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);

    try {
      // Get YouTube metadata
      const metadata = await youtubeService.getMetadata(youtubeUrl);

      // Create audiobook object
      const newAudiobook: Audiobook = {
        id: Date.now().toString(),
        youtubeUrl,
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        duration: metadata.duration,
        status: 'downloading',
        progress: 0,
        addedAt: Date.now(),
      };

      // Add to storage
      await onAdd(newAudiobook);

      // Start download in background (will be implemented)
      startDownload(newAudiobook);

      // Close modal
      setYoutubeUrl('');
      onClose();
    } catch (error) {
      console.error('failed to add audiobook:', error);
      Alert.alert('Error', 'Failed to fetch video information. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };


  const handleClose = () => {
    if (!loading) {
      setYoutubeUrl('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent = {false}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center p-6"
          activeOpacity={1}
          onPress={handleClose}
        >
          <View className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              className="w-full"
            >
              <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-gray-900">
                Add Audiobook
              </Text>
              <TouchableOpacity onPress={handleClose} disabled={loading}>
                <MaterialIcons name="close" size={28} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-600 mb-3">
              Paste a YouTube video URL to add it to your library
            </Text>

            <TextInput
              className="bg-gray-100 p-4 rounded-lg text-base mb-4"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChangeText={setYoutubeUrl}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              multiline
            />

            <TouchableOpacity
              className={`p-4 rounded-lg items-center flex-row justify-center ${
                loading ? 'bg-gray-400' : 'bg-blue-500'
              }`}
              onPress={handleAdd}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="white" className="mr-2" />
                  <Text className="text-white text-base font-semibold">
                    Adding...
                  </Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="add" size={24} color="white" />
                  <Text className="text-white text-base font-semibold ml-2">
                    Add to Library
                  </Text>
                </>
              )}
            </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
