import { useEffect, useRef } from 'react';
import type { SubtitleParagraph } from '@audiolearn/shared';
import { SubtitleParagraphItem } from './SubtitleParagraphItem';

interface SubtitleParagraphListProps {
  paragraphs: SubtitleParagraph[];
  currentParagraphIndex: number;
  currentTime: number;
  onSeek: (time: number) => void;
  onTranslate?: (paragraph: SubtitleParagraph, translation: string) => void;
}

export function SubtitleParagraphList({
  paragraphs,
  currentParagraphIndex,
  currentTime,
  onSeek,
  onTranslate,
}: SubtitleParagraphListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (currentParagraphIndex >= 0 && currentParagraphIndex < paragraphs.length) {
      const element = itemRefs.current.get(currentParagraphIndex);
      if (element) {
        const elementTop = element.getBoundingClientRect().top + window.scrollY;
        const offset = window.innerHeight * 0.2;

        window.scrollTo({
          top: elementTop - offset,
          behavior: 'smooth',
        });
      }
    }
  }, [currentParagraphIndex, paragraphs.length]);

  return (
    <div ref={listRef} className="space-y-3">
      {paragraphs.map((paragraph, index) => (
        <div
          key={paragraph.id || index}
          ref={(el) => {
            if (el) {
              itemRefs.current.set(index, el);
            }
          }}
        >
          <SubtitleParagraphItem
            paragraph={paragraph}
            isActive={index === currentParagraphIndex}
            currentTime={currentTime}
            onPlay={() => onSeek(paragraph.startTime)}
            onTranslate={onTranslate}
          />
        </div>
      ))}
    </div>
  );
}