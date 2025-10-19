import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { translationService } from '../services/translation';

interface SelectableTextProps {
  text: string;
  isActive?: boolean;
}

export function SelectableText({ text, isActive }: SelectableTextProps) {
  const [selectedText, setSelectedText] = useState('');
  const [translation, setTranslation] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const words = text.split(/(\s+)/);

  const handleWordPress = async (word: string) => {
    const cleanWord = word.trim();
    if (!cleanWord) return;

    setSelectedText(cleanWord);
    setTranslation('');
    setShowMenu(true);

    // Автоматически переводим слово
    setIsTranslating(true);
    try {
      const translated = await translationService.translateText(
        cleanWord,
        'RU',
        'EN'
      );
      setTranslation(translated);
    } catch (error) {
      console.error('translation error:', error);
      Alert.alert('Ошибка', 'Не удалось перевести текст');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpeak = async () => {
    try {
      setIsSpeaking(true);
      const isSpeakingNow = await Speech.isSpeakingAsync();
      if (isSpeakingNow) {
        await Speech.stop();
      }

      Speech.speak(selectedText, {
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
    setShowMenu(false);
    setIsSpeaking(false);
  };

  return (
    <View>
      <Text className="text-xl leading-8">
        {words.map((word, index) => {
          const cleanWord = word.trim();
          if (!cleanWord) return <Text key={index}>{word}</Text>;

          return (
            <Text
              key={index}
              onPress={() => handleWordPress(word)}
              className="text-gray-500"
            >
              {word}
            </Text>
          );
        })}
      </Text>

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          className="flex-1 bg-black/30 justify-center items-center"
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="mx-4 bg-white rounded-2xl p-5 shadow-xl max-w-md w-full">
              {/* Word + Speaker Icon */}
              <View className="flex-row items-center justify-center mb-4">
                <Text className="text-2xl font-bold text-gray-900">
                  {selectedText}
                </Text>
                <TouchableOpacity
                  onPress={handleSpeak}
                  disabled={isSpeaking}
                  className="ml-3 p-2 bg-blue-50 rounded-full"
                >
                  {isSpeaking ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <MaterialIcons name="volume-up" size={24} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Translation */}
              <View className="bg-gray-50 p-4 rounded-xl mb-4">
                {isTranslating ? (
                  <View className="flex-row items-center justify-center py-2">
                    <ActivityIndicator size="small" color="#6B7280" />
                    <Text className="text-gray-600 ml-2">Перевод...</Text>
                  </View>
                ) : (
                  <Text className="text-lg text-gray-800 text-center">
                    {translation || 'Перевод не найден'}
                  </Text>
                )}
              </View>

              {/* Close Button */}
              <TouchableOpacity
                onPress={handleClose}
                className="bg-gray-100 p-4 rounded-xl"
              >
                <Text className="text-base text-gray-600 text-center font-medium">
                  Закрыть
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}