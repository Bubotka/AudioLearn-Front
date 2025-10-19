import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { audiobookStorage } from '../../services/storage';
import type { Audiobook, SubtitleParagraph } from '../../types/audiobook';
import { SubtitleParagraphList } from '../../components/SubtitleParagraphList';

export default function PlayerScreen() {
  const params = useLocalSearchParams();
  const audiobookId = params.id as string;

  const [audiobook, setAudiobook] = useState<Audiobook | null>(null);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  const sound = useRef<Audio.Sound | null>(null);
  const paragraphsRef = useRef<SubtitleParagraph[]>([]);
  const lastParagraphIndex = useRef<number>(-1);

  // Load audiobook data
  useEffect(() => {
    loadAudiobook();
    return () => {
        sound.current?.unloadAsync();
    };
  }, [audiobookId]);

  const loadAudiobook = async () => {
    try {
      const audiobooks = await audiobookStorage.getAll();
      const book = audiobooks.find((a) => a.id === audiobookId);

      if (!book) {
        router.back();
        return;
      }

      setAudiobook(book);

      if (book.paragraphs) {
        paragraphsRef.current = book.paragraphs;
      }

      await loadAudio(book);
    } catch (error) {
      console.error('failed to load audiobook:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAudio = async (book: Audiobook) => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: book.audioPath! },
        { progressUpdateIntervalMillis: 100 },
        onPlaybackStatusUpdate
      );

      sound.current = audioSound;

      // Restore saved position
      if (book.lastPosition) {
        await audioSound.setPositionAsync(book.lastPosition * 1000);
        setPosition(book.lastPosition);
      }
    } catch (error) {
      console.error('failed to load audio:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis / 1000);
      setDuration(status.durationMillis / 1000);
      setIsPlaying(status.isPlaying);

      const currentTime = status.positionMillis / 1000;
      const paragraphs = paragraphsRef.current;

      if (paragraphs.length === 0) {
        setCurrentParagraphIndex(-1);
        return;
      }

      let currentIndex = -1;
      const cachedIdx = lastParagraphIndex.current;

      if (cachedIdx >= 0 && cachedIdx < paragraphs.length) {
        if (cachedIdx + 1 < paragraphs.length &&
            currentTime >= paragraphs[cachedIdx + 1].startTime) {
          currentIndex = cachedIdx + 1;
        }
        else if (currentTime >= paragraphs[cachedIdx].startTime) {
          currentIndex = cachedIdx;
        }
        else if (cachedIdx > 0 &&
                 currentTime >= paragraphs[cachedIdx - 1].startTime) {
          currentIndex = cachedIdx - 1;
        }
      }

      if (currentIndex === -1 && paragraphs.length > 0) {
        const lastParagraph = paragraphs[paragraphs.length - 1];
        const totalDuration = lastParagraph.endTime;

        if (totalDuration > 0) {
          const ratio = currentTime / totalDuration;
          const estimatedIndex = Math.min(
            paragraphs.length - 1,
            Math.max(0, Math.floor(ratio * paragraphs.length))
          );

          if (paragraphs[estimatedIndex].startTime <= currentTime) {
            currentIndex = estimatedIndex;
            for (let i = estimatedIndex + 1; i < paragraphs.length; i++) {
              if (paragraphs[i].startTime > currentTime) break;
              currentIndex = i;
            }
          } else {
            for (let i = estimatedIndex - 1; i >= 0; i--) {
              if (paragraphs[i].startTime <= currentTime) {
                currentIndex = i;
                break;
              }
            }
          }
        }
      }

      lastParagraphIndex.current = currentIndex;
      setCurrentParagraphIndex(currentIndex);

      if (status.isPlaying && Math.floor(currentTime) % 5 === 0) {
        savePosition(currentTime);
      }
    }
  };

  const savePosition = async (pos: number) => {
    if (audiobook) {
      await audiobookStorage.update(audiobook.id, { lastPosition: pos });
    }
  };

  const togglePlayPause = async () => {
    if (!sound.current) return;

    if (isPlaying) {
      await sound.current.pauseAsync();
    } else {
      await sound.current.playAsync();
    }
  };

  const seekTo = async (value: number) => {
    if (!sound.current) return;
    await sound.current.setPositionAsync(value * 1000);
    setPosition(value);
    lastParagraphIndex.current = -1;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleParagraphTranslate = async (paragraphId: string, translatedText: string) => {
    if (!audiobook || !audiobook.paragraphs) return;

    const updatedParagraphs = audiobook.paragraphs.map((p) =>
      p.id === paragraphId ? { ...p, translatedText } : p
    );

    const updatedAudiobook = {
      ...audiobook,
      paragraphs: updatedParagraphs,
    };

    setAudiobook(updatedAudiobook);
    paragraphsRef.current = updatedParagraphs;

    await audiobookStorage.update(audiobook.id, { paragraphs: updatedParagraphs });
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View className="flex-1 bg-gray-100 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </>
    );
  }

  if (!audiobook) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: audiobook.title,
          headerTitleStyle: {
            fontSize: 16,
          },
        }}
      />
      <View className="flex-1 bg-gray-100">
        {audiobook.paragraphs && audiobook.paragraphs.length > 0 ? (
          <View className="flex-1 mt-4 mb-3">
            <SubtitleParagraphList
              paragraphs={audiobook.paragraphs}
              currentParagraphIndex={currentParagraphIndex}
              currentTime={position}
              onSeek={seekTo}
              onTranslate={handleParagraphTranslate}
            />
          </View>
        ) : (
          <View className="flex-1 mx-4 mt-4 mb-3 bg-white rounded-xl px-4 py-3 justify-center items-center">
            <Text className="text-gray-500 text-center">
              No subtitles available
            </Text>
          </View>
        )}

        {/* Progress Bar */}
        <View className="px-6 mb-3">
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={seekTo}
            minimumTrackTintColor="#3B82F6"
            maximumTrackTintColor="#D1D5DB"
            thumbTintColor="#3B82F6"
          />
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">{formatTime(position)}</Text>
            <Text className="text-sm text-gray-600">{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View className="flex-row items-center justify-center mb-6">
          <TouchableOpacity
            onPress={() => seekTo(Math.max(0, position - 10))}
            className="bg-white rounded-full p-4 shadow-md mx-4"
          >
            <MaterialIcons name="replay-10" size={32} color="#1F2937" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={togglePlayPause}
            className="bg-blue-500 rounded-full p-6 shadow-lg mx-4"
          >
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={48}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => seekTo(Math.min(duration, position + 10))}
            className="bg-white rounded-full p-4 shadow-md mx-4"
          >
            <MaterialIcons name="forward-10" size={32} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}