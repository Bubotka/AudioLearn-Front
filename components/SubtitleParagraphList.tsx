import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import type { SubtitleParagraph } from '../types/audiobook';
import { SubtitleParagraphItem } from './SubtitleParagraphItem';

interface SubtitleParagraphListProps {
  paragraphs: SubtitleParagraph[];
  currentParagraphIndex: number;
  currentTime: number;
  onSeek: (time: number) => void;
  onTranslate?: (paragraphId: string, translatedText: string) => void;
}

export function SubtitleParagraphList({
  paragraphs,
  currentParagraphIndex,
  currentTime,
  onSeek,
  onTranslate,
}: SubtitleParagraphListProps) {
  const listRef = useRef<FlashListRef<SubtitleParagraph>>(null);

  useEffect(() => {
    if (currentParagraphIndex >= 0 && currentParagraphIndex < paragraphs.length) {
      listRef.current?.scrollToIndex({
        index: currentParagraphIndex,
        animated: true,
        viewPosition: 0.1,
      });
    }
  }, [currentParagraphIndex, paragraphs.length]);

  const renderItem = ({ item, index }: { item: SubtitleParagraph; index: number }) => (
    <SubtitleParagraphItem
      paragraph={item}
      isActive={index === currentParagraphIndex}
      currentTime={currentTime}
      onPlay={onSeek}
      onTranslate={onTranslate}
    />
  );

  return (
    <FlashList
      ref={listRef}
      data={paragraphs}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      ListFooterComponent={<View className="h-4" />}
    />
  );
}