import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { SubtitleParagraph } from '@audiolearn/shared';
import { translationService } from '@audiolearn/shared';
import { SelectableText } from './SelectableText';
import { ClickableSubtitles } from './ClickableSubtitles';

interface SubtitleParagraphItemProps {
  paragraph: SubtitleParagraph;
  isActive: boolean;
  currentTime?: number;
  onPlay: (startTime: number) => void;
  onTranslate?: (paragraphId: string, translatedText: string) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SubtitleParagraphItem({
  paragraph,
  isActive,
  currentTime,
  onPlay,
  onTranslate,
}: SubtitleParagraphItemProps) {
  const lastSubIndex = useRef<number>(-1);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslateParagraph = async () => {
    if (paragraph.translatedText) {
      setShowTranslation(!showTranslation);
      return;
    }

    setIsTranslating(true);
    try {
      const translatedText = await translationService.translateText(paragraph.text, 'RU', 'EN');

      onTranslate?.(paragraph.id, translatedText);
      setShowTranslation(true);
    } catch (error) {
      console.error('translation error:', error);
      Alert.alert('Ошибка', 'Не удалось перевести текст');
    } finally {
      setIsTranslating(false);
    }
  };

  const renderText = () => {
    if (!paragraph.subtitles || paragraph.subtitles.length === 0) {
      return <SelectableText text={paragraph.text} isActive={false} />;
    }

    if (!isActive || !currentTime) {
      return <ClickableSubtitles subtitles={paragraph.subtitles} activeSubIndex={-1} />;
    }

    // Добавляем offset +300ms для более ранней подсветки
    const adjustedTime = currentTime + 0.3;

    let activeSubIndex = -1;
    const cached = lastSubIndex.current;
    const subs = paragraph.subtitles;

    if (cached >= 0 && cached < subs.length) {
      if (cached + 1 < subs.length && adjustedTime >= subs[cached + 1].start) {
        activeSubIndex = cached + 1;
      } else if (adjustedTime >= subs[cached].start) {
        activeSubIndex = cached;
      } else if (cached > 0 && adjustedTime >= subs[cached - 1].start) {
        activeSubIndex = cached - 1;
      }
    }

    if (activeSubIndex === -1) {
      for (let i = subs.length - 1; i >= 0; i--) {
        if (adjustedTime >= subs[i].start) {
          activeSubIndex = i;
          break;
        }
      }
    }

    lastSubIndex.current = activeSubIndex;

    return <ClickableSubtitles subtitles={paragraph.subtitles} activeSubIndex={activeSubIndex} />;
  };

  return (
    <View className={`flex-row p-4 mb-2 rounded-lg ${isActive ? 'bg-blue-50' : 'bg-white'}`}>
      <TouchableOpacity onPress={() => onPlay(paragraph.startTime)} className="mr-3 mt-1">
        <MaterialIcons
          name="play-circle-outline"
          size={28}
          color={isActive ? '#3B82F6' : '#6B7280'}
        />
      </TouchableOpacity>

      <View className="flex-1">
        <Text className="text-xs text-gray-500 mb-1">{formatTime(paragraph.startTime)}</Text>
        {renderText()}

        {showTranslation && paragraph.translatedText && (
          <Text className="text-xl text-gray-600 mt-2 italic leading-8">
            {paragraph.translatedText}
          </Text>
        )}

        <TouchableOpacity
          onPress={handleTranslateParagraph}
          disabled={isTranslating}
          className="flex-row items-center mt-2"
        >
          {isTranslating ? (
            <>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text className="text-blue-500 text-sm ml-2">Перевод...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="translate" size={16} color="#3B82F6" />
              <Text className="text-blue-500 text-sm ml-1">
                {paragraph.translatedText
                  ? showTranslation
                    ? 'Скрыть перевод'
                    : 'Показать перевод'
                  : 'Перевести абзац'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
