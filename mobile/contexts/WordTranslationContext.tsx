import React, { createContext, useContext, useState } from 'react';

interface WordTranslationContextType {
  selectedWord: string;
  translation: string;
  isVisible: boolean;
  isTranslating: boolean;
  isSpeaking: boolean;
  showTranslation: (word: string) => void;
  setTranslation: (translation: string) => void;
  setIsTranslating: (loading: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  hideTranslation: () => void;
}

const WordTranslationContext = createContext<WordTranslationContextType | undefined>(undefined);

export function WordTranslationProvider({ children }: { children: React.ReactNode }) {
  const [selectedWord, setSelectedWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const showTranslation = (word: string) => {
    setSelectedWord(word);
    setTranslation('');
    setIsVisible(true);
  };

  const hideTranslation = () => {
    setIsVisible(false);
    setIsSpeaking(false);
  };

  return (
    <WordTranslationContext.Provider
      value={{
        selectedWord,
        translation,
        isVisible,
        isTranslating,
        isSpeaking,
        showTranslation,
        setTranslation,
        setIsTranslating,
        setIsSpeaking,
        hideTranslation,
      }}
    >
      {children}
    </WordTranslationContext.Provider>
  );
}

export function useWordTranslation() {
  const context = useContext(WordTranslationContext);
  if (!context) {
    throw new Error('useWordTranslation must be used within WordTranslationProvider');
  }
  return context;
}
