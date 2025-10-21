import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Audiobook } from '@audiolearn/shared';

interface AudiobookCardProps {
  audiobook: Audiobook;
  onPress: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
}

export function AudiobookCard({ audiobook, onPress, onDelete, onCancel }: AudiobookCardProps) {
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

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatSpeed = (bytesPerSecond?: number) => {
    if (!bytesPerSecond) return '0 MB/s';
    const mbps = bytesPerSecond / (1024 * 1024);
    return `${mbps.toFixed(1)} MB/s`;
  };

  return (
    <View className="bg-white rounded-2xl mb-4 overflow-hidden shadow-md">
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={{ height: 192, position: 'relative' }}>
          {audiobook.thumbnail ? (
            <Image
              source={{ uri: audiobook.thumbnail }}
              style={{ width: '100%', height: 192 }}
              resizeMode="cover"
            />
          ) : (
            <View
              className="w-full bg-blue-500 items-center justify-center"
              style={{ height: 192 }}
            >
              <MaterialIcons name="audiotrack" size={64} color="white" />
            </View>
          )}

          <View
            style={{ position: 'absolute', top: 12, left: 12 }}
            className="flex-row items-center bg-black/70 rounded-full px-3 py-1.5"
          >
            {getStatusIcon()}
            <Text className="text-xs text-white font-medium ml-1.5">
              {audiobook.status === 'downloading'
                ? `${Math.round(audiobook.progress)}%`
                : getStatusText()}
            </Text>
          </View>

          {audiobook.status === 'downloading' && onCancel ? (
            <TouchableOpacity
              onPress={onCancel}
              style={{ position: 'absolute', top: 12, right: 12 }}
              className="bg-red-500 rounded-full p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            onDelete &&
            audiobook.status !== 'downloading' && (
              <TouchableOpacity
                onPress={onDelete}
                style={{ position: 'absolute', top: 12, right: 12 }}
                className="bg-red-500 rounded-full p-2"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="delete-outline" size={20} color="white" />
              </TouchableOpacity>
            )
          )}

          {audiobook.status === 'downloading' && (
            <View
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
              className="bg-black/80 px-4 py-2.5"
            >
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-xs text-white/80">
                  {formatBytes(audiobook.bytesWritten)} / {formatBytes(audiobook.totalBytes)}
                </Text>
                <Text className="text-xs text-blue-400 font-semibold">
                  {formatSpeed(audiobook.downloadSpeed)}
                </Text>
              </View>
              <View className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <View className="h-full bg-blue-500" style={{ width: `${audiobook.progress}%` }} />
              </View>
            </View>
          )}
        </View>

        <View className="p-4">
          <Text className="text-lg font-bold text-gray-900 mb-2" numberOfLines={2}>
            {audiobook.title}
          </Text>

          <View className="flex-row items-center">
            <MaterialIcons name="person-outline" size={14} color="#8E8E93" />
            <Text className="text-sm text-gray-600 ml-1 flex-1" numberOfLines={1}>
              {audiobook.youtubeUrl.includes('youtube') ? 'YouTube' : 'Unknown'}
            </Text>
            {audiobook.duration && (
              <View className="flex-row items-center">
                <MaterialIcons name="schedule" size={14} color="#8E8E93" />
                <Text className="text-sm text-gray-600 ml-1">
                  {formatDuration(audiobook.duration)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
