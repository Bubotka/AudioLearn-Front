'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Services } from '@audiolearn/shared/services';

const ServicesContext = createContext<Services | null>(null);

interface ServicesProviderProps {
  children: ReactNode;
  services: Services;
}

export function ServicesProvider({ children, services }: ServicesProviderProps) {
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices(): Services {
  const context = useContext(ServicesContext);

  if (!context) {
    throw new Error('useServices must be used within ServicesProvider');
  }

  return context;
}
