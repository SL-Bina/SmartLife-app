import React from 'react';
import { config } from '@gluestack-ui/config';
import { GluestackUIProvider } from '@gluestack-ui/themed';

type UIProviderProps = {
  children: React.ReactNode;
};

export default function UIProvider({ children }: UIProviderProps) {
  return <GluestackUIProvider config={config}>{children}</GluestackUIProvider>;
}
