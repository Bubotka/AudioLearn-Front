'use client';

import { ServicesProvider } from '@/contexts/ServicesContext';
import { createServices } from '@audiolearn/shared/services';
import type { ReactNode } from 'react';

const services = createServices(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
);

export function Providers({ children }: { children: ReactNode }) {
  return <ServicesProvider services={services}>{children}</ServicesProvider>;
}
