import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudiobooks } from '../hooks/useAudiobooks';
import type { Audiobook, Subtitle } from '@audiolearn/shared';
import { youtubeService, groupSubtitlesIntoParagraphs } from '@audiolearn/shared';

export default function HomePage() {
  const navigate = useNavigate();
  const { audiobooks, loading, addAudiobook, deleteAudiobook } = useAudiobooks();
  const [showModal, setShowModal] = useState(false);
  const [uploadType, setUploadType] = useState<'youtube' | 'file'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddFromYoutube = async () => {
    if (!youtubeUrl.trim()) return;

    try {
      setIsLoading(true);

      const metadata = await youtubeService.getMetadata(youtubeUrl);
      const subtitles = await youtubeService.getSubtitles(youtubeUrl, 'en');
      const paragraphs = groupSubtitlesIntoParagraphs(subtitles);

      const newBook: Audiobook = {
        id: Date.now().toString(),
        title: metadata.title,
        author: metadata.author,
        youtubeUrl,
        thumbnailUrl: metadata.thumbnailUrl,
        subtitles,
        paragraphs,
        duration: metadata.duration,
        status: 'ready',
        createdAt: Date.now(),
      };

      await addAudiobook(newBook);
      setShowModal(false);
      setYoutubeUrl('');
    } catch (error) {
      console.error('failed to add audiobook:', error);
      alert('Failed to add audiobook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const audioFile = Array.from(files).find(f => f.type.startsWith('audio/'));
    const srtFile = Array.from(files).find(f => f.name.endsWith('.srt'));

    if (!audioFile) {
      alert('Please select an audio file');
      return;
    }

    try {
      setIsLoading(true);

      // Create object URL for audio
      const audioUrl = URL.createObjectURL(audioFile);

      // Parse SRT if provided
      let subtitles = [];
      let paragraphs = [];

      if (srtFile) {
        const srtText = await srtFile.text();
        subtitles = parseSRT(srtText);
        paragraphs = groupSubtitlesIntoParagraphs(subtitles);
      }

      const newBook: Audiobook = {
        id: Date.now().toString(),
        title: audioFile.name.replace(/\.[^/.]+$/, ''),
        audioUri: audioUrl,
        subtitles,
        paragraphs,
        status: 'ready',
        createdAt: Date.now(),
      };

      await addAudiobook(newBook);
      setShowModal(false);
    } catch (error) {
      console.error('failed to add audiobook:', error);
      alert('Failed to add audiobook');
    } finally {
      setIsLoading(false);
    }
  };

  const parseSRT = (srt: string): Subtitle[] => {
    const blocks = srt.trim().split('\n\n');
    return blocks.map(block => {
      const lines = block.split('\n');
      if (lines.length < 3) return null;

      const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      if (!timeMatch) return null;

      const start = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000;
      const end = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000;
      const text = lines.slice(2).join(' ');

      return { start, end, text };
    }).filter((item): item is Subtitle => item !== null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">AudioLearn</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Add Audiobook
        </button>
      </div>

      {audiobooks.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-xl">No audiobooks yet</p>
          <p className="mt-2">Add your first audiobook from YouTube!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audiobooks.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/player/${book.id}`)}
            >
              {book.thumbnailUrl && (
                <img
                  src={book.thumbnailUrl}
                  alt={book.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{book.title}</h3>
                {book.author && (
                  <p className="text-gray-600 text-sm">{book.author}</p>
                )}
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-gray-500">
                    {book.paragraphs?.length || 0} paragraphs
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this audiobook?')) {
                        deleteAudiobook(book.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Add Audiobook</h2>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setUploadType('youtube')}
                className={`flex-1 px-4 py-2 rounded ${
                  uploadType === 'youtube'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                YouTube
              </button>
              <button
                onClick={() => setUploadType('file')}
                className={`flex-1 px-4 py-2 rounded ${
                  uploadType === 'file'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Upload File
              </button>
            </div>

            {uploadType === 'youtube' ? (
              <>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
                  disabled={isLoading}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddFromYoutube}
                    disabled={isLoading}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    {isLoading ? 'Adding...' : 'Add'}
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setYoutubeUrl('');
                    }}
                    disabled={isLoading}
                    className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 disabled:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select audio file (MP3, M4A, etc.) and optionally SRT subtitles
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="audio/*,.srt"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    className="w-full border border-gray-300 rounded px-4 py-2"
                  />
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isLoading}
                  className="w-full bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 disabled:bg-gray-200"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
