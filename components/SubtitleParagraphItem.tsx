import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { SubtitleParagraph } from '../types/audiobook';

interface SubtitleParagraphItemProps {
  paragraph: SubtitleParagraph;
  isActive: boolean;
  currentTime?: number;
  onPlay: (startTime: number) => void;
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
}: SubtitleParagraphItemProps) {
  const lastSubIndex = React.useRef<number>(-1);

  const renderText = () => {
    if (!isActive || !currentTime || !paragraph.subtitles) {
      return (
        <Text className="text-base text-gray-900 leading-6">
          {paragraph.text}
        </Text>
      );
    }

    let activeSubIndex = -1;
    const cached = lastSubIndex.current;
    const subs = paragraph.subtitles;

    if (cached >= 0 && cached < subs.length) {
      if (cached + 1 < subs.length &&
          currentTime >= subs[cached + 1].start) {
        activeSubIndex = cached + 1;
      } else if (currentTime >= subs[cached].start) {
        activeSubIndex = cached;
      } else if (cached > 0 && currentTime >= subs[cached - 1].start) {
        activeSubIndex = cached - 1;
      }
    }

    if (activeSubIndex === -1) {
      for (let i = subs.length - 1; i >= 0; i--) {
        if (currentTime >= subs[i].start) {
          activeSubIndex = i;
          break;
        }
      }
    }

    lastSubIndex.current = activeSubIndex;

    if (activeSubIndex === -1) {
      return (
        <Text className="text-base text-gray-900 leading-6">
          {paragraph.text}
        </Text>
      );
    }

    return (
      <Text className="text-base leading-6">
        {paragraph.subtitles.map((sub, index) => (
          <Text
            key={index}
            className={index === activeSubIndex ? 'text-blue-600 font-semibold' : 'text-gray-900'}
          >
            {sub.text}{index < paragraph.subtitles.length - 1 ? ' ' : ''}
          </Text>
        ))}
      </Text>
    );
  };

  return (
    <View
      className={`flex-row p-4 mb-2 rounded-lg ${
        isActive ? 'bg-blue-50' : 'bg-white'
      }`}
    >
      <TouchableOpacity
        onPress={() => onPlay(paragraph.startTime)}
        className="mr-3 mt-1"
      >
        <MaterialIcons
          name="play-circle-outline"
          size={28}
          color={isActive ? '#3B82F6' : '#6B7280'}
        />
      </TouchableOpacity>

      <View className="flex-1">
        <Text className="text-xs text-gray-500 mb-1">
          {formatTime(paragraph.startTime)}
        </Text>
        {renderText()}
      </View>
    </View>
  );
}