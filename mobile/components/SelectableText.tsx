import React from 'react';
import { View, Text, Alert } from 'react-native';
import { translationService } from '../../services/translation';
import { useWordTranslation } from '../contexts/WordTranslationContext';

interface SelectableTextProps {
  text: string;
  isActive?: boolean;
}

export function SelectableText({ text }: SelectableTextProps) {
  const { showTranslation, setTranslation, setIsTranslating } = useWordTranslation();

  const words = text.split(/(\s+)/);

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

  return (
    <View>
      <Text className="text-xl leading-8">
        {words.map((word, index) => {
          const cleanWord = word.trim();
          if (!cleanWord) return <Text key={index}>{word}</Text>;

          return (
            <Text key={index} onPress={() => handleWordPress(word)} className="text-gray-500">
              {word}
            </Text>
          );
        })}
      </Text>
    </View>
  );
}
