import { useRef, useState, useEffect } from 'react';
import type { Subtitle } from '@audiolearn/shared';
import { useServices } from '@/contexts/ServicesContext';

interface ClickableSubtitlesProps {
  subtitles: Subtitle[];
  isActive: boolean;
  currentTime: number;
}

export function ClickableSubtitles({
  subtitles,
  isActive,
  currentTime,
}: ClickableSubtitlesProps) {
  const { translation: translationService } = useServices();
  const lastSubIndex = useRef(-1);
  const [activeSubIndex, setActiveSubIndex] = useState(-1);
  const [selectedWord, setSelectedWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isActive || !currentTime || subtitles.length === 0) {
      setActiveSubIndex(-1);
      return;
    }

    const adjustedTime = currentTime + 0.3;
    let newActiveIndex = -1;
    const cached = lastSubIndex.current;

    if (cached >= 0 && cached < subtitles.length) {
      if (
        cached + 1 < subtitles.length &&
        adjustedTime >= subtitles[cached + 1].start
      ) {
        newActiveIndex = cached + 1;
      } else if (adjustedTime >= subtitles[cached].start) {
        newActiveIndex = cached;
      } else if (cached > 0 && adjustedTime >= subtitles[cached - 1].start) {
        newActiveIndex = cached - 1;
      }
    }

    if (newActiveIndex === -1) {
      for (let i = subtitles.length - 1; i >= 0; i--) {
        if (adjustedTime >= subtitles[i].start) {
          newActiveIndex = i;
          break;
        }
      }
    }

    lastSubIndex.current = newActiveIndex;
    setActiveSubIndex(newActiveIndex);
  }, [isActive, currentTime, subtitles]);

  const handleWordClick = async (word: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent text selection handler

    const cleanWord = word.trim().replace(/[.,!?;:]/g, '');
    if (!cleanWord) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + window.scrollY,
    });

    setSelectedWord(cleanWord);
    setShowPopup(true);
    setIsTranslating(true);
    setTranslation('');

    try {
      const translated = await translationService.translateText(
        cleanWord,
        'RU',
        'EN',
        'word'
      );
      setTranslation(translated);
    } catch (error) {
      console.error('translation error:', error);
      setTranslation('Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTextSelection = async (event: React.MouseEvent) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    // Only handle if user actually selected text (not just clicked)
    if (!text || text.length === 0) return;

    // Don't translate single words - those are handled by handleWordClick
    if (text.split(/\s+/).length === 1) return;

    const range = selection?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();

    if (rect) {
      setPopupPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + window.scrollY,
      });
    }

    setSelectedWord(text);
    setShowPopup(true);
    setIsTranslating(true);
    setTranslation('');

    try {
      const translated = await translationService.translateText(
        text,
        'RU',
        'EN',
        'word'
      );
      setTranslation(translated);
    } catch (error) {
      console.error('translation error:', error);
      setTranslation('Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <>
      <span onMouseUp={handleTextSelection}>
        {subtitles.map((sub, index) => {
          const words = sub.text.split(/(\s+)/); // Split by spaces but keep them
          return (
            <span key={`subtitle-${index}`}>
              {words.map((word, wordIndex) => {
                // If it's just whitespace, render it as is
                if (/^\s+$/.test(word)) {
                  return <span key={`${index}-${wordIndex}`}>{word}</span>;
                }

                return (
                  <span
                    key={`${index}-${wordIndex}`}
                    onClick={(e) => handleWordClick(word, e)}
                    className={`cursor-pointer transition-all ${
                      index === activeSubIndex
                        ? 'text-gray-900 underline font-medium'
                        : 'text-gray-600'
                    } hover:text-blue-600`}
                  >
                    {word}
                  </span>
                );
              })}
              {index < subtitles.length - 1 && ' '}
            </span>
          );
        })}
      </span>

      {showPopup && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPopup(false)}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm"
            style={{
              left: `${popupPosition.x}px`,
              top: `${popupPosition.y + 10}px`,
              transform: 'translateX(-50%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedWord}
              </h3>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="bg-gray-50 rounded p-3">
              {isTranslating ? (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span>Translating...</span>
                </div>
              ) : (
                <p className="text-xl text-center text-gray-900">
                  {translation || 'Translation not found'}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
