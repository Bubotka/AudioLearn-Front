import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { audiobookStorage } from '../services/storage';
import type { Audiobook, Subtitle } from '../types/audiobook';

export default function PlayerScreen() {
  const params = useLocalSearchParams();
  const audiobookId = params.id as string;

  const [audiobook, setAudiobook] = useState<Audiobook | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [upcomingSubtitles, setUpcomingSubtitles] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  const sound = useRef<Audio.Sound | null>(null);
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const subtitlesRef = useRef<Subtitle[]>([]);

  // Load audiobook data
  useEffect(() => {
    loadAudiobook();
    return () => {
      if (sound.current) {
        sound.current.unloadAsync();
      }
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
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

      console.log('=== AUDIOBOOK DEBUG ===');
      console.log('Book ID:', book.id);
      console.log('Has subtitles?', !!book.subtitles);
      console.log('Subtitles count:', book.subtitles?.length || 0);
      if (book.subtitles && book.subtitles.length > 0) {
        console.log('First subtitle:', book.subtitles[0]);
        console.log('Last subtitle:', book.subtitles[book.subtitles.length - 1]);
      }

      if (book.subtitles) {
        setSubtitles(book.subtitles);
        subtitlesRef.current = book.subtitles; // Fix closure issue
        console.log('Subtitles SET to state');
      } else {
        console.log('NO SUBTITLES - book.subtitles is', book.subtitles);
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

      // Subtitle offset: positive = show earlier, negative = show later
      const subtitleOffset = 2;
      const adjustedTime = currentTime + subtitleOffset;

      // Use ref to avoid closure issues
      const currentSubtitles = subtitlesRef.current;

      // Debug every second
      if (status.isPlaying && Math.floor(currentTime) % 1 === 0 && currentTime < 5) {
        console.log('Time:', currentTime.toFixed(2), 'Adjusted:', adjustedTime.toFixed(2), 'Subtitles array length:', currentSubtitles.length);
      }

      // Find current subtitle index
      let currentIndex = currentSubtitles.findIndex(
        (sub) => adjustedTime >= sub.start && adjustedTime <= sub.end
      );

      // Lookahead: if no exact match, find next subtitle
      if (currentIndex === -1) {
        currentIndex = currentSubtitles.findIndex(
          (sub) => sub.start > adjustedTime && sub.start - adjustedTime < 0.5
        );
      }

      // Get current + next 3-4 subtitles to fill the window
      if (currentIndex !== -1) {
        const current = currentSubtitles[currentIndex];
        setCurrentSubtitle(current.text);

        // Get next 3-4 subtitles
        const upcoming = currentSubtitles
          .slice(currentIndex + 1, currentIndex + 5)
          .map(sub => sub.text);
        setUpcomingSubtitles(upcoming);
      } else {
        setCurrentSubtitle('');
        setUpcomingSubtitles([]);
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
        <View className="mx-4 mb-3 bg-white rounded-xl p-8" style={{ minHeight: 320 }}>
          {/* Current subtitle - highlighted */}
          <Text className="text-2xl font-semibold text-gray-900 text-center leading-9 mb-3">
            {currentSubtitle || 'No subtitles at this moment...'}
          </Text>

          {/* Upcoming subtitles - dimmed */}
          {upcomingSubtitles.map((text, index) => (
            <Text
              key={index}
              className="text-xl text-gray-600 text-center leading-8 mt-2"
            >
              {text}
            </Text>
          ))}
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