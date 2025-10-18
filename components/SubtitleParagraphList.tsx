import React, { useRef, useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import type { SubtitleParagraph } from '../types/audiobook';
import { SubtitleParagraphItem } from './SubtitleParagraphItem';

interface SubtitleParagraphListProps {
  paragraphs: SubtitleParagraph[];
  currentParagraphIndex: number;
  currentTime: number;
  onSeek: (time: number) => void;
}

export function SubtitleParagraphList({
  paragraphs,
  currentParagraphIndex,
  currentTime,
  onSeek,
}: SubtitleParagraphListProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const itemRefs = useRef<{ [key: number]: View | null }>({});

  useEffect(() => {
    if (currentParagraphIndex >= 0 && itemRefs.current[currentParagraphIndex]) {
      itemRefs.current[currentParagraphIndex]?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, y - 10),
            animated: true,
          });
        },
        () => {}
      );
    }
  }, [currentParagraphIndex]);

  return (
    <ScrollView
      ref={scrollViewRef}
      className="flex-1 px-4"
      showsVerticalScrollIndicator={true}
    >
      {paragraphs.map((paragraph, index) => (
        <View
          key={paragraph.id}
          ref={(ref) => {
            itemRefs.current[index] = ref;
          }}
          collapsable={false}
        >
          <SubtitleParagraphItem
            paragraph={paragraph}
            isActive={index === currentParagraphIndex}
            currentTime={currentTime}
            onPlay={onSeek}
          />
        </View>
      ))}
      <View className="h-4" />
    </ScrollView>
  );
}