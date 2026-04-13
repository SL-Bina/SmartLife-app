import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { changeIcon, getIcon, resetIcon } from 'react-native-change-icon';

import AppPageLayout from '../../../components/common/app-page-layout';
import { useQuickNavigationRoutes } from '../../../hooks/use-quick-navigation-routes';
import { selectIsResident } from '../../../store/auth-slice';
import { useThemeMode } from '../../../hooks/use-theme';
import { LanguageCode } from '../../../i18n/translations';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setLanguage } from '../../../store/locale-slice';
import { ThemeMode } from '../../../store/theme-slice';
import { useResidentPropertySelector } from '../../resident/use-resident-property-selector';
import { showToast } from '../../../utils/action';

type LanguageOption = {
  code: LanguageCode;
  label: string;
  flag: string;
};

type ThemeOption = {
  mode: ThemeMode;
  labels: Record<LanguageCode, string>;
};

type AppIconOption = {
  key: 'Default' | 'Light' | 'Dark';
  icon: string;
  labels: Record<LanguageCode, string>;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'az', label: 'Azərbaycanca', flag: '🇦🇿' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

const THEME_OPTIONS: ThemeOption[] = [
  {
    mode: 'light',
    labels: {
      az: 'Açıq',
      en: 'Light',
      ru: 'Светлая',
    },
  },
  {
    mode: 'dark',
    labels: {
      az: 'Tünd',
      en: 'Dark',
      ru: 'Темная',
    },
  },
  {
    mode: 'system',
    labels: {
      az: 'Sistem',
      en: 'System',
      ru: 'Системная',
    },
  },
];

const APP_ICON_OPTIONS: AppIconOption[] = [
  {
    key: 'Default',
    icon: '⭐',
    labels: {
      az: 'Standart',
      en: 'Default',
      ru: 'Стандартная',
    },
  },
  {
    key: 'Light',
    icon: '☀️',
    labels: {
      az: 'Açıq ikon',
      en: 'Light icon',
      ru: 'Светлая иконка',
    },
  },
  {
    key: 'Dark',
    icon: '🌙',
    labels: {
      az: 'Tünd ikon',
      en: 'Dark icon',
      ru: 'Темная иконка',
    },
  },
];

const PAGE_TITLE: Record<LanguageCode, string> = {
  az: 'Tənzimləmələr',
  en: 'Settings',
  ru: 'Настройки',
};

const COPY: Record<
  LanguageCode,
  {
    languageTitle: string;
    languageSubtitle: string;
    themeTitle: string;
    themeSubtitle: string;
    quickRoutesTitle: string;
    quickRoutesSubtitle: string;
    quickRoutesHint: string;
    quickRoutesSelected: string;
    quickRoutesChoose: string;
    quickRoutesPicked: string;
    quickRoutesLimitText: (limit: number) => string;
    activeThemePrefix: string;
    activeLanguagePrefix: string;
    iconTitle: string;
    iconSubtitle: string;
    iconApply: string;
    iconApplied: string;
    activeIconPrefix: string;
    iconChangeFailed: string;
  }
> = {
  az: {
    languageTitle: 'Dil seçimi',
    languageSubtitle: 'Tətbiq dilini dərhal dəyiş.',
    themeTitle: 'Tema seçimi',
    themeSubtitle: 'Açıq, tünd və ya sistem temasını seç.',
    quickRoutesTitle: 'Sürətli keçidlər',
    quickRoutesSubtitle: 'Bottom panelin ortasında görünəcək səhifələri seç.',
    quickRoutesHint: 'Sakin hesabında seçim limiti daha azdır.',
    quickRoutesSelected: 'Seçildi',
    quickRoutesChoose: 'Seç',
    quickRoutesPicked: 'Seçilib',
    quickRoutesLimitText: limit => `Maksimum ${limit} səhifə seçə bilərsən`,
    activeThemePrefix: 'Aktiv tema',
    activeLanguagePrefix: 'Aktiv dil',
    iconTitle: 'Tətbiq ikonu',
    iconSubtitle: 'Ana ekranda görünəcək ikon üslubunu seç.',
    iconApply: 'Tətbiq et',
    iconApplied: 'İkon yeniləndi',
    activeIconPrefix: 'Aktiv ikon',
    iconChangeFailed: 'İkon dəyişdirilə bilmədi',
  },
  en: {
    languageTitle: 'Language',
    languageSubtitle: 'Change the app language instantly.',
    themeTitle: 'Theme',
    themeSubtitle: 'Choose light, dark or system theme.',
    quickRoutesTitle: 'Quick routes',
    quickRoutesSubtitle: 'Select pages that appear in the bottom center switcher.',
    quickRoutesHint: 'Resident accounts have a lower selection limit.',
    quickRoutesSelected: 'Selected',
    quickRoutesChoose: 'Choose',
    quickRoutesPicked: 'Picked',
    quickRoutesLimitText: limit => `You can select up to ${limit} pages`,
    activeThemePrefix: 'Active theme',
    activeLanguagePrefix: 'Active language',
    iconTitle: 'App icon',
    iconSubtitle: 'Choose the launcher icon style shown on your home screen.',
    iconApply: 'Apply',
    iconApplied: 'Icon updated',
    activeIconPrefix: 'Active icon',
    iconChangeFailed: 'Could not change app icon',
  },
  ru: {
    languageTitle: 'Язык',
    languageSubtitle: 'Сразу меняйте язык приложения.',
    themeTitle: 'Тема',
    themeSubtitle: 'Выберите светлую, темную или системную тему.',
    quickRoutesTitle: 'Быстрые переходы',
    quickRoutesSubtitle: 'Выберите страницы для переключателя в центре нижней панели.',
    quickRoutesHint: 'Для резидентов лимит выбора меньше.',
    quickRoutesSelected: 'Выбрано',
    quickRoutesChoose: 'Выбрать',
    quickRoutesPicked: 'Выбрано',
    quickRoutesLimitText: limit => `Можно выбрать максимум ${limit} страниц`,
    activeThemePrefix: 'Активная тема',
    activeLanguagePrefix: 'Активный язык',
    iconTitle: 'Иконка приложения',
    iconSubtitle: 'Выберите стиль иконки на главном экране.',
    iconApply: 'Применить',
    iconApplied: 'Иконка обновлена',
    activeIconPrefix: 'Активная иконка',
    iconChangeFailed: 'Не удалось изменить иконку',
  },
};

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const language = useAppSelector(state => state.locale.language);
  const isResident = useAppSelector(selectIsResident);
  const { mode, resolvedTheme, setMode } = useThemeMode();
  const { propertyOptions, selectedPropertyName, onPropertyChange } = useResidentPropertySelector();
  const {
    availableRouteOptions,
    selectedRouteKeys,
    selectionLimit,
    toggleRouteSelection,
  } = useQuickNavigationRoutes();
  const isDark = resolvedTheme === 'dark';
  const [activeIcon, setActiveIcon] = React.useState<AppIconOption['key']>('Default');
  const [isSwitchingIcon, setIsSwitchingIcon] = React.useState(false);

  const settingsRouteKey = isResident ? 'resident_settings' : 'settings';
  const profileRouteKey = isResident ? 'resident_profile' : 'profile';
  const devicesRouteKey = isResident ? 'resident_my_devices' : 'my_devices';
  const notificationsRouteKey = isResident ? 'resident_notifications' : 'notifications';

  const text = COPY[language];

  const activeLanguageLabel =
    LANGUAGE_OPTIONS.find(option => option.code === language)?.label ??
    LANGUAGE_OPTIONS[0].label;
  const activeThemeLabel =
    THEME_OPTIONS.find(option => option.mode === mode)?.labels[language] ??
    THEME_OPTIONS[0].labels[language];
  const activeIconLabel =
    APP_ICON_OPTIONS.find(option => option.key === activeIcon)?.labels[language] ??
    APP_ICON_OPTIONS[0].labels[language];

  React.useEffect(() => {
    let mounted = true;

    const loadActiveIcon = async () => {
      try {
        const iconName = await getIcon();
        if (!mounted) {
          return;
        }
        if (iconName === 'Light' || iconName === 'Dark' || iconName === 'Default') {
          setActiveIcon(iconName);
        } else {
          setActiveIcon('Default');
        }
      } catch {
        if (mounted) {
          setActiveIcon('Default');
        }
      }
    };

    loadActiveIcon();

    return () => {
      mounted = false;
    };
  }, []);

  const onQuickRouteToggle = React.useCallback(
    (routeKey: string) => {
      const result = toggleRouteSelection(routeKey);
      if (!result.success && result.reason === 'limit') {
        showToast(text.quickRoutesLimitText(selectionLimit));
      }
    },
    [selectionLimit, text, toggleRouteSelection],
  );

  const onIconSelect = React.useCallback(
    async (iconKey: AppIconOption['key']) => {
      if (isSwitchingIcon || iconKey === activeIcon) {
        return;
      }

      setIsSwitchingIcon(true);
      try {
        if (iconKey === 'Default') {
          await resetIcon();
        } else {
          await changeIcon(iconKey);
        }
        setActiveIcon(iconKey);
        showToast(`${text.iconApplied}: ${APP_ICON_OPTIONS.find(option => option.key === iconKey)?.labels[language] ?? iconKey}`);
      } catch {
        showToast(text.iconChangeFailed);
      } finally {
        setIsSwitchingIcon(false);
      }
    },
    [activeIcon, isSwitchingIcon, language, text],
  );

  return (
    <AppPageLayout
      title={PAGE_TITLE[language]}
      isDark={isDark}
      settingsRouteKey={settingsRouteKey}
      profileRouteKey={profileRouteKey}
      devicesRouteKey={devicesRouteKey}
      notificationsRouteKey={notificationsRouteKey}
      mtkOptions={isResident ? propertyOptions.map(option => option.name) : undefined}
      initialMtk={isResident ? selectedPropertyName : undefined}
      onMtkChange={isResident ? onPropertyChange : undefined}
      contentStyle={styles.pageWrap}
      scrollable
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <Text style={[styles.cardTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
          {text.languageTitle}
        </Text>
        <Text style={[styles.cardSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          {text.languageSubtitle}
        </Text>

        <View style={styles.optionStack}>
          {LANGUAGE_OPTIONS.map(option => {
            const active = option.code === language;
            return (
              <Pressable
                key={option.code}
                onPress={() => dispatch(setLanguage(option.code))}
                style={[
                  styles.optionButton,
                  active
                    ? styles.optionButtonActive
                    : isDark
                      ? styles.optionButtonDark
                      : styles.optionButtonLight,
                ]}
              >
                <Text style={styles.flagText}>{option.flag}</Text>
                <Text
                  style={[
                    styles.optionText,
                    active
                      ? styles.optionTextActive
                      : isDark
                        ? styles.optionTextDark
                        : styles.optionTextLight,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.activeText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          {text.activeLanguagePrefix}: {activeLanguageLabel}
        </Text>
      </View>

      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <Text style={[styles.cardTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
          {text.themeTitle}
        </Text>
        <Text style={[styles.cardSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          {text.themeSubtitle}
        </Text>

        <View style={styles.optionStack}>
          {THEME_OPTIONS.map(option => {
            const active = option.mode === mode;
            return (
              <Pressable
                key={option.mode}
                onPress={() => setMode(option.mode)}
                style={[
                  styles.optionButton,
                  active
                    ? styles.optionButtonActive
                    : isDark
                      ? styles.optionButtonDark
                      : styles.optionButtonLight,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    active
                      ? styles.optionTextActive
                      : isDark
                        ? styles.optionTextDark
                        : styles.optionTextLight,
                  ]}
                >
                  {option.labels[language]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.activeText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          {text.activeThemePrefix}: {activeThemeLabel}
        </Text>
      </View>

      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <Text style={[styles.cardTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
          {text.iconTitle}
        </Text>
        <Text style={[styles.cardSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          {text.iconSubtitle}
        </Text>

        <View style={styles.optionStack}>
          {APP_ICON_OPTIONS.map(option => {
            const isActive = option.key === activeIcon;
            return (
              <Pressable
                key={option.key}
                disabled={isSwitchingIcon}
                onPress={() => onIconSelect(option.key)}
                style={[
                  styles.optionButton,
                  isActive
                    ? styles.optionButtonActive
                    : isDark
                      ? styles.optionButtonDark
                      : styles.optionButtonLight,
                  isSwitchingIcon ? styles.optionButtonDisabled : undefined,
                ]}
              >
                <Text style={styles.flagText}>{option.icon}</Text>
                <Text
                  style={[
                    styles.optionText,
                    isActive
                      ? styles.optionTextActive
                      : isDark
                        ? styles.optionTextDark
                        : styles.optionTextLight,
                  ]}
                >
                  {option.labels[language]}
                </Text>
                <View style={styles.optionActionWrap}>
                  <Text
                    style={[
                      styles.optionActionText,
                      isActive
                        ? styles.optionTextActive
                        : isDark
                          ? styles.textMutedDark
                          : styles.textMutedLight,
                    ]}
                  >
                    {isActive ? text.quickRoutesPicked : text.iconApply}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.activeText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          {text.activeIconPrefix}: {activeIconLabel}
        </Text>
      </View>

      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <View style={styles.quickRouteHeaderRow}>
          <Text style={[styles.cardTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
            {text.quickRoutesTitle}
          </Text>

          <View style={[styles.quickRouteCountPill, isDark ? styles.quickRouteCountPillDark : styles.quickRouteCountPillLight]}>
            <Text style={[styles.quickRouteCountText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              {text.quickRoutesSelected}: {selectedRouteKeys.length}/{selectionLimit}
            </Text>
          </View>
        </View>

        <Text style={[styles.cardSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          {text.quickRoutesSubtitle}
        </Text>

        <View style={styles.quickRouteGrid}>
          {availableRouteOptions.map(option => {
            const isSelected = selectedRouteKeys.includes(option.routeKey);

            return (
              <Pressable
                key={option.routeKey}
                onPress={() => onQuickRouteToggle(option.routeKey)}
                style={[
                  styles.quickRouteCard,
                  isSelected
                    ? styles.quickRouteCardSelected
                    : isDark
                      ? styles.quickRouteCardDark
                      : styles.quickRouteCardLight,
                ]}
              >
                <Text
                  numberOfLines={2}
                  style={[
                    styles.quickRouteCardTitle,
                    isSelected
                      ? styles.quickRouteCardTitleSelected
                      : isDark
                        ? styles.quickRouteCardTitleDark
                        : styles.quickRouteCardTitleLight,
                  ]}
                >
                  {option.label}
                </Text>

                <Text
                  style={[
                    styles.quickRouteCardHint,
                    isSelected
                      ? styles.quickRouteCardHintSelected
                      : isDark
                        ? styles.quickRouteCardHintDark
                        : styles.quickRouteCardHintLight,
                  ]}
                >
                  {isSelected ? text.quickRoutesPicked : text.quickRoutesChoose}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.activeText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          {text.quickRoutesHint}. {text.quickRoutesLimitText(selectionLimit)}.
        </Text>
      </View>
    </AppPageLayout>
  );
}

const styles = StyleSheet.create({
  pageWrap: {
    flex: 1,
  },
  scrollContent: {
    gap: 14,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  cardDark: {
    backgroundColor: '#111114',
    borderColor: '#27272a',
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'WorkSans-Bold',
  },
  cardSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'WorkSans-Regular',
  },
  optionStack: {
    marginTop: 14,
    gap: 10,
  },
  optionButton: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionButtonDisabled: {
    opacity: 0.75,
  },
  optionButtonLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  optionButtonDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  optionButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'WorkSans-SemiBold',
  },
  optionTextLight: {
    color: '#334155',
  },
  optionTextDark: {
    color: '#d4d4d8',
  },
  optionTextActive: {
    color: '#1d4ed8',
  },
  flagText: {
    fontSize: 16,
  },
  optionActionWrap: {
    marginLeft: 'auto',
  },
  optionActionText: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
  },
  activeText: {
    marginTop: 12,
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  quickRouteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickRouteCountPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickRouteCountPillLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#dbe4ef',
  },
  quickRouteCountPillDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  quickRouteCountText: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  quickRouteGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickRouteCard: {
    width: '48%',
    minHeight: 86,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  quickRouteCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  quickRouteCardDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  quickRouteCardSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  quickRouteCardTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'WorkSans-SemiBold',
  },
  quickRouteCardTitleLight: {
    color: '#334155',
  },
  quickRouteCardTitleDark: {
    color: '#e4e4e7',
  },
  quickRouteCardTitleSelected: {
    color: '#1d4ed8',
  },
  quickRouteCardHint: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
  },
  quickRouteCardHintLight: {
    color: '#64748b',
  },
  quickRouteCardHintDark: {
    color: '#a1a1aa',
  },
  quickRouteCardHintSelected: {
    color: '#1d4ed8',
  },
  textPrimaryLight: {
    color: '#0f172a',
  },
  textPrimaryDark: {
    color: '#f4f4f5',
  },
  textMutedLight: {
    color: '#64748b',
  },
  textMutedDark: {
    color: '#a1a1aa',
  },
});
