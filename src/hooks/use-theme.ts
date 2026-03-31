import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { setThemeMode, ThemeMode } from '../store/theme-slice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

export function useThemeMode() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(state => state.theme.mode);
  const systemScheme = useColorScheme();

  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (mode === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }

    return mode;
  }, [mode, systemScheme]);

  const setMode = (nextMode: ThemeMode) => {
    dispatch(setThemeMode(nextMode));
  };

  return {
    mode,
    resolvedTheme,
    setMode,
  };
}