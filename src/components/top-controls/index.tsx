/** @jsxImportSource nativewind */
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Globe, Moon, Sun } from 'lucide-react-native';

import { LanguageCode } from '../../i18n/translations';
import { useThemeMode } from '../../hooks/use-theme';
import { setLanguage } from '../../store/locale-slice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

type TopControlsProps = {
  variant?: 'inline' | 'absolute';
};

const languages: Array<{ code: LanguageCode; label: string; flag: string }> = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'az', label: 'Azərbaycanca', flag: '🇦🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export default function TopControls({ variant = 'inline' }: TopControlsProps) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector(state => state.locale.language);
  const { mode, resolvedTheme, setMode } = useThemeMode();
  const [langDropdownOpen, setLangDropdownOpen] = React.useState(false);
  const isDark = resolvedTheme === 'dark';

  const handleThemeToggle = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  const handleLanguageChange = (langCode: LanguageCode) => {
    dispatch(setLanguage(langCode));
    setLangDropdownOpen(false);
  };

  const rowClassName =
    variant === 'absolute'
      ? 'absolute left-0 right-0 z-40 px-6 flex-row justify-between items-center'
      : 'mb-6 flex-row justify-between items-center';

  return (
    <>
      <View
        className={rowClassName}
        style={variant === 'absolute' ? { top: insets.top + 12 } : undefined}
      >
        <Pressable
          onPress={handleThemeToggle}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            isDark ? 'bg-zinc-800' : 'bg-gray-200'
          }`}
        >
          {isDark ? (
            <Sun size={20} color="#FDB927" strokeWidth={2.5} />
          ) : (
            <Moon size={20} color="#1a1a1a" strokeWidth={2.5} />
          )}
        </Pressable>

        <Pressable
          onPress={() => setLangDropdownOpen(true)}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            isDark ? 'bg-zinc-800' : 'bg-gray-200'
          }`}
        >
          <Globe size={20} color={isDark ? '#ffffff' : '#1a1a1a'} strokeWidth={2.5} />
        </Pressable>
      </View>

      <Modal
        transparent
        visible={langDropdownOpen}
        animationType="slide"
        onRequestClose={() => setLangDropdownOpen(false)}
      >
        <Pressable className="flex-1 justify-end" onPress={() => setLangDropdownOpen(false)}>
          <Pressable
            onPress={() => {}}
            className={`rounded-t-3xl border z-50 overflow-hidden ${
              isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
            }`}
            style={{
              width: '100%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {languages.map((lang, index) => (
              <Pressable
                key={lang.code}
                onPress={() => handleLanguageChange(lang.code)}
                className={`flex-row items-center gap-3 px-4 py-3 ${
                  currentLanguage === lang.code
                    ? isDark
                      ? 'bg-red-600/20'
                      : 'bg-red-50'
                    : isDark
                      ? 'bg-zinc-800'
                      : 'bg-white'
                } ${index !== languages.length - 1 ? 'border-b' : ''} ${
                  isDark ? 'border-zinc-700' : 'border-gray-200'
                }`}
              >
                <Text className="text-xl">{lang.flag}</Text>
                <Text
                  className={`font-medium ${
                    currentLanguage === lang.code
                      ? isDark
                        ? 'text-red-400'
                        : 'text-red-700'
                      : isDark
                        ? 'text-gray-300'
                        : 'text-gray-700'
                  }`}
                >
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}