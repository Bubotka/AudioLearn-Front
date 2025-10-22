import { useState } from 'react';
import type { SubtitleParagraph } from '@audiolearn/shared';
import { translationService } from '@audiolearn/shared';
import { ClickableSubtitles } from './ClickableSubtitles';

interface SubtitleParagraphItemProps {
  paragraph: SubtitleParagraph;
  isActive: boolean;
  currentTime: number;
  onPlay: () => void;
  onTranslate?: (paragraph: SubtitleParagraph, translation: string) => void;
}

export function SubtitleParagraphItem({
  paragraph,
  isActive,
  currentTime,
  onPlay,
  onTranslate,
}: SubtitleParagraphItemProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTranslateParagraph = async () => {
    if (paragraph.translatedText) {
      setShowTranslation(!showTranslation);
      return;
    }

    setIsTranslating(true);
    try {
      const translated = await translationService.translateText(
        paragraph.text,
        'RU',
        'EN'
      );
      paragraph.translatedText = translated;
      setShowTranslation(true);

      if (onTranslate) {
        onTranslate(paragraph, translated);
      }
    } catch (error) {
      console.error('translation error:', error);
      alert('Failed to translate paragraph');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div
      className={`flex gap-3 p-4 rounded-lg transition-all ${
        isActive ? 'bg-blue-50 shadow-md' : 'bg-white hover:bg-gray-50'
      }`}
    >
      <button
        onClick={onPlay}
        className={`flex-shrink-0 w-7 h-7 mt-1 flex items-center justify-center rounded-full transition-colors ${
          isActive
            ? 'text-blue-600 hover:bg-blue-100'
            : 'text-gray-500 hover:bg-gray-200'
        }`}
        title="Play from here"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
          />
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 mb-1">
          {formatTime(paragraph.startTime)}
        </div>

        <div className="text-xl leading-8 text-gray-800 select-text">
          {paragraph.subtitles && paragraph.subtitles.length > 0 ? (
            <ClickableSubtitles
              subtitles={paragraph.subtitles}
              isActive={isActive}
              currentTime={currentTime}
            />
          ) : (
            <p>{paragraph.text}</p>
          )}
        </div>

        {showTranslation && paragraph.translatedText && (
          <div className="mt-3 text-xl text-gray-600 italic leading-8 border-l-4 border-gray-300 pl-3">
            {paragraph.translatedText}
          </div>
        )}

        <button
          onClick={handleTranslateParagraph}
          disabled={isTranslating}
          className="flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"
            />
          </svg>
          {isTranslating
            ? 'Translating...'
            : paragraph.translatedText
            ? showTranslation
              ? 'Hide translation'
              : 'Show translation'
            : 'Translate paragraph'}
        </button>
      </div>
    </div>
  );
}