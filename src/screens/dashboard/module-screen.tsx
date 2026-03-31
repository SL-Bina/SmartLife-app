import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppPageLayout from '../../components/common/app-page-layout';
import { useThemeMode } from '../../hooks/use-theme';

type DashboardModuleScreenProps = {
  title: string;
  subtitle?: string;
};

export default function DashboardModuleScreen({
  title,
  subtitle = 'Bu bolme ucun funksionalliq elave olunur.',
}: DashboardModuleScreenProps) {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';

  const contentStyle = React.useMemo(
    () => [styles.contentCard, isDark ? styles.contentCardDark : styles.contentCardLight],
    [isDark],
  );

  return (
    <AppPageLayout
      title={title}
      isDark={isDark}
      settingsRouteKey="settings"
      profileRouteKey="profile"
      contentStyle={styles.contentWrap}
    >
      <View style={styles.contentWrap}>
        <View style={contentStyle}>
          <Text style={[styles.title, isDark ? styles.titleDark : styles.titleLight]}>{title}</Text>
          <Text style={[styles.subtitle, isDark ? styles.subtitleDark : styles.subtitleLight]}>{subtitle}</Text>
        </View>
      </View>
    </AppPageLayout>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
  },
  contentCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  contentCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  contentCardDark: {
    backgroundColor: '#111114',
    borderColor: '#27272a',
  },
  title: {
    fontSize: 22,
    fontFamily: 'WorkSans-Bold',
  },
  titleLight: {
    color: '#0f172a',
  },
  titleDark: {
    color: '#f4f4f5',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'WorkSans-Regular',
  },
  subtitleLight: {
    color: '#64748b',
  },
  subtitleDark: {
    color: '#a1a1aa',
  },
});
