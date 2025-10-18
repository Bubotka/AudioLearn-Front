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
import * as DocumentPicker from 'expo-document-picker';
import type { Audiobook } from '../types/audiobook';
import { youtubeService } from '../services/youtube';

interface AddAudiobookModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (audiobook: Audiobook) => Promise<void>;
}

export function AddAudiobookModal({ visible, onClose, onAdd }: AddAudiobookModalProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [audioFile, setAudioFile] = useState<{ uri: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const isValidYoutubeUrl = (url: string): boolean => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return pattern.test(url);
  };

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setAudioFile({
          uri: file.uri,
          name: file.name,
        });
      }
    } catch (error) {
      console.error('error picking audio:', error);
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  const handleAdd = async () => {
    if (!audioFile) {
      Alert.alert('Error', 'Please select an MP3 file');
      return;
    }

    if (!youtubeUrl.trim()) {
      Alert.alert('Error', 'Please enter a YouTube URL for subtitles');
      return;
    }

    if (!isValidYoutubeUrl(youtubeUrl)) {
      Alert.alert('Error', 'Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);

    try {
      // Fetch metadata from YouTube using service layer
      const metadata = await youtubeService.getMetadata(youtubeUrl);

      // Fetch subtitles once and store them
      let subtitles;
      try {
        console.log('fetching subtitles for:', youtubeUrl);
        subtitles = await youtubeService.getSubtitles(youtubeUrl);
        console.log('subtitles loaded:', subtitles?.length || 0, 'entries');
      } catch (error) {
        console.warn('failed to fetch subtitles, continuing without them:', error);
        subtitles = undefined;
      }

      // Create audiobook object with metadata and subtitles
      const newAudiobook: Audiobook = {
        id: Date.now().toString(),
        youtubeUrl,
        title: metadata.title || audioFile.name.replace(/\.[^/.]+$/, ''),
        thumbnail: metadata.thumbnail,
        duration: metadata.duration,
        author: metadata.author,
        audioPath: audioFile.uri,
        audioUrl: metadata.audioUrl,
        subtitles,
        status: 'ready',
        progress: 100,
        addedAt: Date.now(),
      };

      // Add to storage
      await onAdd(newAudiobook);

      // Reset and close
      setYoutubeUrl('');
      setAudioFile(null);
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
      setAudioFile(null);
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
              Step 1: Upload MP3 file
            </Text>

            <TouchableOpacity
              className="bg-gray-100 p-4 rounded-lg mb-4 flex-row items-center justify-between"
              onPress={handlePickAudio}
              disabled={loading}
            >
              <View className="flex-row items-center flex-1">
                <MaterialIcons
                  name={audioFile ? "check-circle" : "audiotrack"}
                  size={24}
                  color={audioFile ? "#10B981" : "#6B7280"}
                />
                <Text
                  className={`ml-3 text-base flex-1 ${audioFile ? 'text-gray-900' : 'text-gray-500'}`}
                  numberOfLines={1}
                >
                  {audioFile ? audioFile.name : 'Select MP3 file...'}
                </Text>
              </View>
              <MaterialIcons name="folder-open" size={24} color="#3B82F6" />
            </TouchableOpacity>

            <Text className="text-sm text-gray-600 mb-3">
              Step 2: YouTube URL (for subtitles)
            </Text>

            <TextInput
              className="bg-gray-100 p-4 rounded-lg text-base mb-6"
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
                loading || !audioFile || !youtubeUrl ? 'bg-gray-400' : 'bg-blue-500'
              }`}
              onPress={handleAdd}
              disabled={loading || !audioFile || !youtubeUrl}
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
