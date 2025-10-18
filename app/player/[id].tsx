import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { audiobookStorage } from '../../services/storage';
import type { Audiobook, Subtitle } from '../../types/audiobook';

export default function PlayerScreen() {
  const params = useLocalSearchParams();
  const audiobookId = params.id as string;

  const [audiobook, setAudiobook] = useState<Audiobook | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [previousSubtitles, setPreviousSubtitles] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  const sound = useRef<Audio.Sound | null>(null);
  const subtitlesRef = useRef<Subtitle[]>([]);
  const lastSubtitleIndex = useRef<number>(-1);

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

      if (book.subtitles) {
        subtitlesRef.current = book.subtitles; // Fix closure issue

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

      // Update current subtitle
      const currentTime = status.positionMillis / 1000;

      // Use ref to avoid closure issues
      const currentSubtitles = subtitlesRef.current;

      if (currentSubtitles.length === 0) {
        setCurrentSubtitle('');
        setPreviousSubtitles([]);
        return;
      }

      // Optimized subtitle search using cached index + linear scan
      // Strategy: find the LAST subtitle that has already started (highest index where start <= currentTime)
      let currentIndex = -1;
      const cachedIdx = lastSubtitleIndex.current;

      // First check the cached subtitle and nearby ones (common case: O(1))
      if (cachedIdx >= 0 && cachedIdx < currentSubtitles.length) {
        // Check if next subtitle has started (most common: playing forward)
        if (cachedIdx + 1 < currentSubtitles.length &&
            currentTime >= currentSubtitles[cachedIdx + 1].start) {
          currentIndex = cachedIdx + 1;
        }
        // Check if cached subtitle is still active
        else if (currentTime >= currentSubtitles[cachedIdx].start) {
          currentIndex = cachedIdx;
        }
        // Check if we went back to previous subtitle
        else if (cachedIdx > 0 &&
                 currentTime >= currentSubtitles[cachedIdx - 1].start) {
          currentIndex = cachedIdx - 1;
        }
      }

      // If not found nearby, use binary search to find last started subtitle
      // Goal: find highest index where subtitle.start <= currentTime
      if (currentIndex === -1) {
        let left = 0;
        let right = currentSubtitles.length - 1;
        let bestMatch = -1;

        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          const sub = currentSubtitles[mid];

          if (sub.start <= currentTime) {
            // This subtitle has started, it's a candidate
            bestMatch = mid;
            // But check if there's a later one that also started
            left = mid + 1;
          } else {
            // This subtitle hasn't started yet, go left
            right = mid - 1;
          }
        }

        currentIndex = bestMatch;
      }

      // Update cache for next iteration
      lastSubtitleIndex.current = currentIndex;

      // Get current + previous subtitles for context
      if (currentIndex !== -1) {
        const current = currentSubtitles[currentIndex];
        setCurrentSubtitle(current.text);

        // Get previous 12-14 subtitles to fill the window
        const startIndex = Math.max(0, currentIndex - 12);
        const previous = currentSubtitles
          .slice(startIndex, currentIndex)
          .map(sub => sub.text);
        setPreviousSubtitles(previous);
      } else {
        setCurrentSubtitle('');
        setPreviousSubtitles([]);
      }

      // Save position every 5 seconds
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
    // Reset cached subtitle index on seek to trigger binary search
    lastSubtitleIndex.current = -1;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-100 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!audiobook) {
    return null;
  }

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView className="flex-1">
        {/* Thumbnail */}
        <View className="items-center mt-2 mb-3">
          {audiobook.thumbnail ? (
            <Image
              source={{ uri: audiobook.thumbnail }}
              style={{ width: 200, height: 200 }}
              className="rounded-2xl"
            />
          ) : (
            <View
              style={{ width: 200, height: 200 }}
              className="bg-blue-500 rounded-2xl items-center justify-center"
            >
              <MaterialIcons name="audiotrack" size={80} color="white" />
            </View>
          )}
        </View>

        {/* Title & Author */}
        <View className="px-6 mb-2">
          <Text className="text-lg font-bold text-gray-900 text-center" numberOfLines={1}>
            {audiobook.title}
          </Text>
          {audiobook.author && (
            <Text className="text-xs text-gray-600 text-center mt-1">
              {audiobook.author}
            </Text>
          )}
        </View>

        {/* Subtitles */}
        <View className="mx-4 mb-3 bg-white rounded-xl px-3 py-2 justify-end overflow-hidden" style={{ height: 320 }}>
          {/* Previous subtitles - dimmed, for context */}
          {previousSubtitles.map((text, index) => (
            <Text
              key={index}
              className="text-lg text-gray-600 text-center leading-6 mb-0.5"
            >
              {text}
            </Text>
          ))}

          {/* Current subtitle - highlighted */}
          <Text className="text-xl font-semibold text-gray-900 text-center leading-6 mt-0.5">
            {currentSubtitle || 'No subtitles at this moment...'}
          </Text>
        </View>

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
      </ScrollView>
    </View>
  );
}