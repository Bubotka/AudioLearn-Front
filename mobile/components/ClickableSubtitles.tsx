import React from 'react';
import { View, Text, Alert } from 'react-native';
import { ClickableSelectableText } from './ClickableSelectableText';
import type { ClickableSelectableTextEvent } from './ClickableSelectableText';
import { translationService } from '@audiolearn/shared';
import type { Subtitle } from '@audiolearn/shared';
import { useWordTranslation } from '../contexts/WordTranslationContext';

interface ClickableSubtitlesProps {
  subtitles: Subtitle[];
  activeSubIndex: number;
}

export function ClickableSubtitles({ subtitles, activeSubIndex }: ClickableSubtitlesProps) {
  const { showTranslation, setTranslation, setIsTranslating } = useWordTranslation();

  const handleEvent = async (event: ClickableSelectableTextEvent) => {
    console.log('Event received:', JSON.stringify(event, null, 2));

    let textToTranslate = '';

    if (event.eventType === 'wordClick' && event.word) {
      // Quick click on word - immediate translation
      textToTranslate = event.word.trim();
    } else if (event.eventType === 'textSelection' && event.highlightedText) {
      // Text selection - translation after menu selection
      textToTranslate = event.highlightedText.trim();
    }

    if (!textToTranslate) {
      console.log('No text to translate');
      return;
    }

    showTranslation(textToTranslate);

    setIsTranslating(true);
    try {
      const translated = await translationService.translateText(textToTranslate, 'RU', 'EN');
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
      <ClickableSelectableText
        menuOptions={['Translate']}
        onEvent={handleEvent}
        style={{
          fontSize: 20,
          lineHeight: 32,
        }}
      >
        <Text style={{ fontSize: 20, lineHeight: 32 }}>
          {subtitles.map((sub, index) => (
            <Text
              key={index}
              style={{
                color: index === activeSubIndex ? '#111827' : '#6B7280',
                textDecorationLine: index === activeSubIndex ? 'underline' : 'none',
              }}
            >
              {sub.text}
              {index < subtitles.length - 1 ? ' ' : ''}
            </Text>
          ))}
        </Text>
      </ClickableSelectableText>
    </View>
  );
}
