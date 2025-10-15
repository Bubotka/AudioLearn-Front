import { youtubeService } from './youtube';
import { audiobookStorage } from './storage';
import type { Audiobook } from '../types/audiobook';

export async function startDownload(audiobook: Audiobook) {
  try {
    // Get audio download URL
    const audioUrl = await youtubeService.getAudioUrl(audiobook.youtubeUrl);

    // Download audio with progress updates
    const audioPath = await youtubeService.downloadAudio(
      audioUrl,
      audiobook.id,
      async (progress) => {
        // Update progress in storage
        await audiobookStorage.update(audiobook.id, {
          progress: Math.round(progress.progress * 100),
        });
      }
    );

    // Mark as ready
    await audiobookStorage.update(audiobook.id, {
      status: 'ready',
      audioPath,
      progress: 100,
    });

    console.log('download completed:', audiobook.title);
  } catch (error) {
    console.error('download failed:', error);

    // Mark as error
    await audiobookStorage.update(audiobook.id, {
      status: 'error',
    });
  }
}