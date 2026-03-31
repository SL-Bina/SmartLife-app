import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ArrowRight,
  CircleEllipsis,
  Sparkles,
  WandSparkles,
} from 'lucide-react-native';

import AppPageLayout from '../../components/common/app-page-layout';
import LinearGradient from '../../components/common/safe-linear-gradient';
import { useThemeMode } from '../../hooks/use-theme';
import { useResidentPropertySelector } from './use-resident-property-selector';

type ResidentModuleScreenProps = {
  title: string;
  subtitle?: string;
};

export default function ResidentModuleScreen({
  title,
  subtitle = 'Bu bölmə üçün funksionallıq genişləndirilir.',
}: ResidentModuleScreenProps) {
  const { resolvedTheme } = useThemeMode();
  const { propertyOptions, selectedPropertyName, onPropertyChange } = useResidentPropertySelector();
  const isDark = resolvedTheme === 'dark';

  return (
    <AppPageLayout
      title={title}
      isDark={isDark}
      settingsRouteKey="resident_settings"
      profileRouteKey="resident_profile"
      devicesRouteKey="resident_my_devices"
      notificationsRouteKey="resident_notifications"
      mtkOptions={propertyOptions.map(option => option.name)}
      initialMtk={selectedPropertyName}
      onMtkChange={onPropertyChange}
      contentStyle={styles.contentWrap}
    >
      <View style={styles.contentWrap}>
        <LinearGradient
          colors={
            isDark
              ? ['#0f172a', '#111827', '#172554']
              : ['#dbeafe', '#eff6ff', '#ffffff']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, isDark ? styles.heroDark : styles.heroLight]}
        >
          <View style={styles.heroTopRow}>
            <View style={[styles.heroBadge, isDark ? styles.heroBadgeDark : styles.heroBadgeLight]}>
              <Sparkles size={13} color={isDark ? '#dbeafe' : '#1d4ed8'} strokeWidth={2.4} />
              <Text style={[styles.heroBadgeText, isDark ? styles.heroBadgeTextDark : styles.heroBadgeTextLight]}>
                Coming Next
              </Text>
            </View>

            <View style={[styles.heroDot, isDark ? styles.heroDotDark : styles.heroDotLight]} />
          </View>

          <Text style={[styles.title, isDark ? styles.titleDark : styles.titleLight]}>{title}</Text>
          <Text style={[styles.subtitle, isDark ? styles.subtitleDark : styles.subtitleLight]}>{subtitle}</Text>

          <Text style={[styles.metaText, isDark ? styles.metaTextDark : styles.metaTextLight]}>
            Aktiv mənzil: {selectedPropertyName ?? '-'}
          </Text>
        </LinearGradient>

        <View style={[styles.panelCard, isDark ? styles.panelCardDark : styles.panelCardLight]}>
          <View style={styles.panelHeader}>
            <View style={[styles.panelIconWrap, isDark ? styles.panelIconWrapDark : styles.panelIconWrapLight]}>
              <WandSparkles size={17} color={isDark ? '#dbeafe' : '#1d4ed8'} strokeWidth={2.3} />
            </View>
            <Text style={[styles.panelTitle, isDark ? styles.panelTitleDark : styles.panelTitleLight]}>
              Dizayn yenilənməsi mərhələsində
            </Text>
          </View>

          <Text style={[styles.panelText, isDark ? styles.panelTextDark : styles.panelTextLight]}>
            Bu səhifə üçün yeni kartlar, detallı cədvəllər və interaktiv hissələr hazırlanır.
          </Text>

          <View style={styles.checkRow}>
            <View style={[styles.checkPill, isDark ? styles.checkPillDark : styles.checkPillLight]}>
              <CircleEllipsis size={13} color={isDark ? '#cbd5e1' : '#334155'} strokeWidth={2.3} />
              <Text style={[styles.checkPillText, isDark ? styles.checkPillTextDark : styles.checkPillTextLight]}>
                Yeni modullar əlavə olunur
              </Text>
            </View>

            <Pressable style={[styles.ctaButton, isDark ? styles.ctaButtonDark : styles.ctaButtonLight]}>
              <Text style={[styles.ctaButtonText, isDark ? styles.ctaButtonTextDark : styles.ctaButtonTextLight]}>
                Tezliklə
              </Text>
              <ArrowRight size={14} color={isDark ? '#dbeafe' : '#1d4ed8'} strokeWidth={2.3} />
            </Pressable>
          </View>
        </View>
      </View>
    </AppPageLayout>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    gap: 10,
    paddingBottom: 12,
  },
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  heroLight: {
    borderColor: '#bfdbfe',
  },
  heroDark: {
    borderColor: 'rgba(59,130,246,0.22)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeLight: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderColor: '#dbeafe',
  },
  heroBadgeDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroBadgeText: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  heroBadgeTextLight: {
    color: '#1d4ed8',
  },
  heroBadgeTextDark: {
    color: '#e0f2fe',
  },
  heroDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  heroDotLight: {
    backgroundColor: '#2563eb',
  },
  heroDotDark: {
    backgroundColor: '#60a5fa',
  },
  title: {
    marginTop: 16,
    fontSize: 28,
    lineHeight: 34,
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
  metaText: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: 'WorkSans-Regular',
  },
  metaTextLight: {
    color: '#64748b',
  },
  metaTextDark: {
    color: '#94a3b8',
  },
  panelCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  panelCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  panelCardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  panelIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelIconWrapLight: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
  },
  panelIconWrapDark: {
    backgroundColor: '#111827',
    borderColor: '#1e3a8a',
  },
  panelTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'WorkSans-Bold',
  },
  panelTitleLight: {
    color: '#0f172a',
  },
  panelTitleDark: {
    color: '#f8fafc',
  },
  panelText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'WorkSans-Regular',
  },
  panelTextLight: {
    color: '#475569',
  },
  panelTextDark: {
    color: '#cbd5e1',
  },
  checkRow: {
    marginTop: 12,
    gap: 8,
  },
  checkPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkPillLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  checkPillDark: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  checkPillText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  checkPillTextLight: {
    color: '#334155',
  },
  checkPillTextDark: {
    color: '#e2e8f0',
  },
  ctaButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctaButtonLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
  },
  ctaButtonDark: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  ctaButtonText: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  ctaButtonTextLight: {
    color: '#1d4ed8',
  },
  ctaButtonTextDark: {
    color: '#dbeafe',
  },
});