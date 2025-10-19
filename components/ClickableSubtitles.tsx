import React from 'react';
import { View, Text, Alert } from 'react-native';
import { translationService } from '../services/translation';
import type { Subtitle } from '../types/audiobook';
import { useWordTranslation } from '../contexts/WordTranslationContext';

interface ClickableSubtitlesProps {
  subtitles: Subtitle[];
  activeSubIndex: number;
}

export function ClickableSubtitles({ subtitles, activeSubIndex }: ClickableSubtitlesProps) {
  const { showTranslation, setTranslation, setIsTranslating } = useWordTranslation();

  const handleWordPress = async (word: string) => {
    const cleanWord = word.trim();
    if (!cleanWord) return;

    showTranslation(cleanWord);

    setIsTranslating(true);
    try {
      const translated = await translationService.translateText(cleanWord, 'RU', 'EN');
      setTranslation(translated);
    } catch (error) {
      console.error('translation error:', error);
      Alert.alert('Ошибка', 'Не удалось перевести текст');
    } finally {
      setIsTranslating(false);
    }
  };

  const renderWords = (text: string, isActive: boolean) => {
    const words = text.split(/(\s+)/);

    return words.map((word, idx) => {
      const cleanWord = word.trim();
      if (!cleanWord) return <Text key={idx}>{word}</Text>;

      return (
        <Text
          key={idx}
          onPress={() => handleWordPress(word)}
          className={isActive ? 'text-gray-900' : 'text-gray-500'}
          style={isActive ? { textDecorationLine: 'underline' } : undefined}
        >
          {word}
        </Text>
      );
    });
  };

  return (
    <View>
      <Text className="text-xl leading-8">
        {subtitles.map((sub, index) => (
          <React.Fragment key={index}>
            {renderWords(sub.text, index === activeSubIndex)}
            {index < subtitles.length - 1 && ' '}
          </React.Fragment>
        ))}
      </Text>
    </View>
  );
}