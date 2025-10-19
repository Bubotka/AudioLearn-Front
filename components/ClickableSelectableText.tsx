import React, { useRef, useEffect } from 'react';
import { requireNativeComponent, findNodeHandle, DeviceEventEmitter, StyleSheet, ViewStyle } from 'react-native';
import type { ViewProps } from 'react-native';

interface NativeClickableSelectableTextProps extends ViewProps {
  menuOptions: string[];
}

const NativeClickableSelectableText = requireNativeComponent<NativeClickableSelectableTextProps>(
  'ClickableSelectableTextView'
);

export interface ClickableSelectableTextEvent {
  eventType: 'wordClick' | 'textSelection';
  word?: string;
  chosenOption?: string;
  highlightedText?: string;
}

interface ClickableSelectableTextProps {
  children: React.ReactNode;
  menuOptions: string[];
  onEvent?: (event: ClickableSelectableTextEvent) => void;
  style?: ViewStyle;
}

export function ClickableSelectableText({
  children,
  menuOptions,
  onEvent,
  style,
}: ClickableSelectableTextProps) {
  const viewRef = useRef(null);

  useEffect(() => {
    if (!onEvent) return;

    const subscription = DeviceEventEmitter.addListener(
      'ClickableSelectableTextEvent',
      (eventData: any) => {
        const viewTag = findNodeHandle(viewRef.current);
        if (viewTag === eventData.viewTag) {
          onEvent({
            eventType: eventData.eventType,
            word: eventData.word,
            chosenOption: eventData.chosenOption,
            highlightedText: eventData.highlightedText,
          });
        }
      }
    );

    return () => subscription.remove();
  }, [onEvent]);

  return (
    <NativeClickableSelectableText
      ref={viewRef}
      style={style}
      menuOptions={menuOptions}
    >
      {children}
    </NativeClickableSelectableText>
  );
}
