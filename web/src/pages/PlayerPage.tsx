import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { audiobookStorage } from '../services/storage';
import type { Audiobook, SubtitleParagraph } from '@audiolearn/shared';
import { SubtitleParagraphList } from '../components/SubtitleParagraphList';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playerRef = useRef<AudioPlayer>(null);

  const [audiobook, setAudiobook] = useState<Audiobook | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(-1);
  const lastParagraphIndex = useRef(-1);
  const paragraphsRef = useRef<SubtitleParagraph[]>([]);

  useEffect(() => {
    const loadAudiobook = async () => {
      if (!id) return;
      try {
        const book = await audiobookStorage.get(id);
        setAudiobook(book);

        if (book?.paragraphs) {
          paragraphsRef.current = book.paragraphs;
        }
      } catch (error) {
        console.error('failed to load audiobook:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAudiobook();
  }, [id]);

  // Update paragraph tracking when time changes
  const handleListen = (e: Event) => {
    const audio = e.currentTarget as HTMLAudioElement;
    const time = audio.currentTime;
    setCurrentTime(time);

    const paragraphs = paragraphsRef.current;
    if (!paragraphs || paragraphs.length === 0) return;

    let currentIndex = -1;
    const cachedIdx = lastParagraphIndex.current;

    // Fast path: check cached index
    if (cachedIdx >= 0 && cachedIdx < paragraphs.length) {
      if (
        cachedIdx + 1 < paragraphs.length &&
        time >= paragraphs[cachedIdx + 1].startTime &&
        time <= paragraphs[cachedIdx + 1].endTime
      ) {
        currentIndex = cachedIdx + 1;
      } else if (
        time >= paragraphs[cachedIdx].startTime &&
        time <= paragraphs[cachedIdx].endTime
      ) {
        currentIndex = cachedIdx;
      }
    }

    // Fallback: search for active paragraph
    if (currentIndex === -1) {
      for (let i = paragraphs.length - 1; i >= 0; i--) {
        if (time >= paragraphs[i].startTime && time <= paragraphs[i].endTime) {
          currentIndex = i;
          break;
        }
      }
    }

    if (currentIndex !== lastParagraphIndex.current) {
      lastParagraphIndex.current = currentIndex;
      setActiveParagraphIndex(currentIndex);
    }
  };

  const seekToTime = (time: number) => {
    if (playerRef.current?.audio?.current) {
      playerRef.current.audio.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleParagraphTranslate = async (
    paragraph: SubtitleParagraph,
    translation: string
  ) => {
    if (!id || !audiobook) return;

    const updatedParagraphs = audiobook.paragraphs?.map((p) =>
      p.id === paragraph.id ? { ...p, translatedText: translation } : p
    );

    if (updatedParagraphs) {
      await audiobookStorage.update(id, {
        paragraphs: updatedParagraphs,
      });
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
    <div className="min-h-screen bg-gray-100 pb-40">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2"
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
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{audiobook.title}</h1>
          {audiobook.author && (
            <p className="text-sm text-gray-600">{audiobook.author}</p>
          )}
        </div>
      </div>

      {/* Subtitles - Full width */}
      {audiobook.paragraphs && audiobook.paragraphs.length > 0 ? (
        <div className="container mx-auto px-4 py-6">
          <SubtitleParagraphList
            paragraphs={audiobook.paragraphs}
            currentParagraphIndex={activeParagraphIndex}
            currentTime={currentTime}
            onSeek={seekToTime}
            onTranslate={handleParagraphTranslate}
          />
        </div>
      ) : (
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            <p>No subtitles available</p>
            <p className="text-sm mt-2">
              Upload an SRT file when adding an audiobook to see synchronized
              subtitles
            </p>
          </div>
        </div>
      )}

      {/* Audio Player - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="container mx-auto px-4 py-2">
          <AudioPlayer
            ref={playerRef}
            src={
              audiobook.audioUri ||
              (audiobook.youtubeUrl
                ? `https://www.youtube.com/watch?v=${audiobook.youtubeUrl.split('v=')[1]}`
                : '')
            }
            onListen={handleListen}
            showSkipControls={false}
            showJumpControls={true}
            progressJumpSteps={{ backward: 10000, forward: 10000 }}
            customAdditionalControls={[]}
            layout="horizontal"
          />
        </div>
      </div>
    </div>
  );
}
