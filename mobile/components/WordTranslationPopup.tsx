import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useWordTranslation } from '../contexts/WordTranslationContext';

export function WordTranslationPopup() {
  const {
    selectedWord,
    translation,
    isVisible,
    isTranslating,
    isSpeaking,
    setIsSpeaking,
    hideTranslation,
  } = useWordTranslation();

  const handleSpeak = async () => {
    try {
      setIsSpeaking(true);
      const isSpeakingNow = await Speech.isSpeakingAsync();
      if (isSpeakingNow) {
        await Speech.stop();
      }

      Speech.speak(selectedWord, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.85,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('speech error:', error);
      setIsSpeaking(false);
    }
  };

  const handleClose = async () => {
    const isSpeakingNow = await Speech.isSpeakingAsync();
    if (isSpeakingNow) {
      await Speech.stop();
    }
    hideTranslation();
  };

  if (!isVisible) return null;

  return (
    <View className="bg-white border-t border-gray-200 px-4 py-3">
      {/* Строка со словом */}
      <View className="mb-3" style={{ position: 'relative' }}>
        <View className="items-center">
          <View className="flex-row items-center">
            <Text style={{ fontSize: 28, fontWeight: 'bold' }}>{selectedWord}</Text>
            <TouchableOpacity
              onPress={handleSpeak}
              disabled={isSpeaking}
              className="ml-2 p-2 bg-blue-50 rounded-full"
            >
              {isSpeaking ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <MaterialIcons name="volume-up" size={24} color="#3B82F6" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Кнопка закрытия справа */}
        <TouchableOpacity
          onPress={handleClose}
          style={{ position: 'absolute', right: 0, top: 0 }}
          className="p-2"
        >
          <MaterialIcons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Перевод */}
      <View className="bg-gray-50 p-3 rounded-lg">
        {isTranslating ? (
          <View className="flex-row items-center justify-center py-1">
            <ActivityIndicator size="small" color="#6B7280" />
            <Text className="text-gray-600 ml-2">Перевод...</Text>
          </View>
        ) : (
          <Text style={{ fontSize: 22, textAlign: 'center' }}>
            {translation || 'Перевод не найден'}
          </Text>
        )}
      </View>
    </View>
  );
}
