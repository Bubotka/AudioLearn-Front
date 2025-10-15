import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Audiobook } from '../types/audiobook';

interface AudiobookCardProps {
  audiobook: Audiobook;
  onPress: () => void;
  onDelete?: () => void;
}

export function AudiobookCard({ audiobook, onPress, onDelete }: AudiobookCardProps) {
  const getStatusIcon = () => {
    switch (audiobook.status) {
      case 'downloading':
        return <MaterialIcons name="downloading" size={24} color="#007AFF" />;
      case 'ready':
        return <MaterialIcons name="play-circle-outline" size={24} color="#34C759" />;
      case 'playing':
        return <MaterialIcons name="pause-circle-outline" size={24} color="#007AFF" />;
      case 'paused':
        return <MaterialIcons name="play-circle-outline" size={24} color="#FF9500" />;
      case 'error':
        return <MaterialIcons name="error-outline" size={24} color="#FF3B30" />;
    }
  };

  const getStatusText = () => {
    switch (audiobook.status) {
      case 'downloading':
        return `Downloading ${Math.round(audiobook.progress)}%`;
      case 'ready':
        return 'Ready to play';
      case 'playing':
        return 'Playing';
      case 'paused':
        return 'Paused';
      case 'error':
        return 'Download failed';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-3 flex-row items-center shadow-sm"
      onPress={onPress}
      activeOpacity={0.7}
    >
      {audiobook.thumbnail ? (
        <Image
          source={{ uri: audiobook.thumbnail }}
          className="w-16 h-16 rounded-lg mr-4"
        />
      ) : (
        <View className="w-16 h-16 rounded-lg mr-4 bg-gray-200 items-center justify-center">
          <MaterialIcons name="audiotrack" size={32} color="#8E8E93" />
        </View>
      )}

      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
          {audiobook.title}
        </Text>

        <View className="flex-row items-center">
          {getStatusIcon()}
          <Text className="text-sm text-gray-600 ml-2">
            {getStatusText()}
          </Text>
          {audiobook.duration && (
            <>
              <Text className="text-sm text-gray-400 mx-2">•</Text>
              <Text className="text-sm text-gray-600">
                {formatDuration(audiobook.duration)}
              </Text>
            </>
          )}
        </View>

        {audiobook.status === 'downloading' && (
          <View className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-blue-500"
              style={{ width: `${audiobook.progress}%` }}
            />
          </View>
        )}
      </View>

      {onDelete && audiobook.status !== 'downloading' && (
        <TouchableOpacity
          onPress={onDelete}
          className="ml-2 p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="delete-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
