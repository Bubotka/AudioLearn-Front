import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { audiobookStorage } from '../services/storage';
import type { Audiobook, SubtitleParagraph } from '@audiolearn/shared';
import { translationService } from '@audiolearn/shared';

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [audiobook, setAudiobook] = useState<Audiobook | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(-1);

  // Translation state
  const [selectedText, setSelectedText] = useState('');
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    const loadAudiobook = async () => {
      if (!id) return;
      try {
        const book = await audiobookStorage.get(id);
        setAudiobook(book);

        // Restore last position
        if (book?.lastPosition && audioRef.current) {
          audioRef.current.currentTime = book.lastPosition;
        }
      } catch (error) {
        console.error('failed to load audiobook:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAudiobook();
  }, [id]);

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // Find active paragraph
      if (audiobook?.paragraphs) {
        const index = audiobook.paragraphs.findIndex(
          (p) => audio.currentTime >= p.startTime && audio.currentTime <= p.endTime
        );
        setActiveParagraphIndex(index);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [audiobook]);

  // Save position periodically
  useEffect(() => {
    if (!id || !audiobook) return;

    const interval = setInterval(async () => {
      if (audioRef.current && audioRef.current.currentTime > 0) {
        await audiobookStorage.update(id, {
          lastPosition: audioRef.current.currentTime,
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, audiobook]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const seekToParagraph = (paragraph: SubtitleParagraph) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = paragraph.startTime;
    setCurrentTime(paragraph.startTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTextSelection = async () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      setSelectedText(text);
      setShowTranslation(true);
      setIsTranslating(true);

      try {
        const translated = await translationService.translateText(text, 'RU', 'EN');
        setTranslation(translated);
      } catch (error) {
        console.error('translation error:', error);
        setTranslation('Translation failed');
      } finally {
        setIsTranslating(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!audiobook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-xl mb-4">Audiobook not found</div>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-32">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => navigate('/')}
          className="mb-4 text-blue-500 hover:text-blue-700 flex items-center"
        >
          ← Back
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{audiobook.title}</h1>
          {audiobook.author && (
            <p className="text-gray-600 mb-4">{audiobook.author}</p>
          )}

          {audiobook.thumbnailUrl && (
            <img
              src={audiobook.thumbnailUrl}
              alt={audiobook.title}
              className="w-full max-w-md rounded mb-6 mx-auto"
            />
          )}

          {/* Audio Element */}
          {(audiobook.audioUri || audiobook.youtubeUrl) && (
            <audio
              ref={audioRef}
              src={audiobook.audioUri || `https://www.youtube.com/watch?v=${audiobook.youtubeUrl?.split('v=')[1]}`}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          )}

          {/* Player Controls */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={togglePlayPause}
                className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-600"
              >
                {isPlaying ? '⏸' : '▶'}
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subtitles */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Subtitles</h2>
          <div className="space-y-4" onMouseUp={handleTextSelection}>
            {audiobook.paragraphs?.map((paragraph, index) => (
              <div
                key={index}
                onClick={() => seekToParagraph(paragraph)}
                className={`border-l-4 pl-4 py-2 cursor-pointer transition-colors ${
                  index === activeParagraphIndex
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <p className="text-gray-800 select-text">{paragraph.text}</p>
                <span className="text-xs text-gray-500">
                  {formatTime(paragraph.startTime)} - {formatTime(paragraph.endTime)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Translation Popup */}
      {showTranslation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
             onClick={() => setShowTranslation(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Translation</h3>
              <button
                onClick={() => setShowTranslation(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Original:</p>
              <p className="text-gray-900">{selectedText}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Translation:</p>
              {isTranslating ? (
                <p className="text-gray-500">Translating...</p>
              ) : (
                <p className="text-gray-900">{translation}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
