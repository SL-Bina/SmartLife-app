import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from '../../../components/common/safe-linear-gradient';
import {
  ArrowRight,
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  Clock3,
  FileText,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react-native';

import AppPageLayout from '../../../components/common/app-page-layout';
import { useThemeMode } from '../../../hooks/use-theme';
import { useTranslation } from '../../../hooks/use-translation';
import { showToast } from '../../../utils/action';

type IconType = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

function formatDelta(delta: string) {
  const positive = delta.trim().startsWith('+');
  return {
    positive,
    text: `${positive ? '▲' : '▼'} ${delta.replace(/[+-]/, '')}`,
  };
}

function SectionTitle({
  title,
  subtitle,
  icon: Icon,
  isDark,
}: {
  title: string;
  subtitle: string;
  icon: IconType;
  isDark: boolean;
}) {
  return (
    <View style={styles.sectionTitleWrap}>
      <View style={styles.sectionTitleLeft}>
        <View
          style={[
            styles.sectionIcon,
            isDark ? styles.sectionIconDark : styles.sectionIconLight,
          ]}
        >
          <Icon
            size={18}
            color={isDark ? '#dbeafe' : '#1d4ed8'}
            strokeWidth={2.3}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.sectionTitleText,
              isDark ? styles.sectionTitleTextDark : styles.sectionTitleTextLight,
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.sectionSubtitleText,
              isDark ? styles.sectionSubtitleTextDark : styles.sectionSubtitleTextLight,
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => showToast('This section will be expanded soon')}
        style={[
          styles.sectionGhostButton,
          isDark ? styles.sectionGhostButtonDark : styles.sectionGhostButtonLight,
        ]}
      >
        <ArrowRight
          size={16}
          color={isDark ? '#cbd5e1' : '#334155'}
          strokeWidth={2.4}
        />
      </Pressable>
    </View>
  );
}

function TopMetricCard({
  title,
  value,
  delta,
  note,
  icon: Icon,
  isDark,
  wide,
}: {
  title: string;
  value: string;
  delta: string;
  note: string;
  icon: IconType;
  isDark: boolean;
  wide?: boolean;
}) {
  const d = formatDelta(delta);

  return (
    <View
      style={[
        styles.metricCard,
        isDark ? styles.metricCardDark : styles.metricCardLight,
        wide ? styles.metricCardWide : undefined,
      ]}
    >
      <View style={styles.metricCardTop}>
        <View
          style={[
            styles.metricIconWrap,
            isDark ? styles.metricIconWrapDark : styles.metricIconWrapLight,
          ]}
        >
          <Icon
            size={18}
            color={isDark ? '#bfdbfe' : '#1d4ed8'}
            strokeWidth={2.3}
          />
        </View>

        <View
          style={[
            styles.metricDeltaChip,
            d.positive ? styles.metricDeltaChipUp : styles.metricDeltaChipDown,
          ]}
        >
          <Text style={styles.metricDeltaChipText}>{d.text}</Text>
        </View>
      </View>

      <Text
        style={[
          styles.metricTitle,
          isDark ? styles.metricTitleDark : styles.metricTitleLight,
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.metricValue,
          isDark ? styles.metricValueDark : styles.metricValueLight,
        ]}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.metricNote,
          isDark ? styles.metricNoteDark : styles.metricNoteLight,
        ]}
      >
        {note}
      </Text>
    </View>
  );
}

function InsightCard({
  title,
  value,
  desc,
  isDark,
}: {
  title: string;
  value: string;
  desc: string;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.insightCard,
        isDark ? styles.insightCardDark : styles.insightCardLight,
      ]}
    >
      <Text
        style={[
          styles.insightTitle,
          isDark ? styles.insightTitleDark : styles.insightTitleLight,
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.insightValue,
          isDark ? styles.insightValueDark : styles.insightValueLight,
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.insightDesc,
          isDark ? styles.insightDescDark : styles.insightDescLight,
        ]}
      >
        {desc}
      </Text>
    </View>
  );
}

function ActivityRow({
  title,
  subtitle,
  value,
  icon: Icon,
  isDark,
}: {
  title: string;
  subtitle: string;
  value: string;
  icon: IconType;
  isDark: boolean;
}) {
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityLeft}>
        <View
          style={[
            styles.activityIconWrap,
            isDark ? styles.activityIconWrapDark : styles.activityIconWrapLight,
          ]}
        >
          <Icon
            size={16}
            color={isDark ? '#bfdbfe' : '#2563eb'}
            strokeWidth={2.2}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.activityTitle,
              isDark ? styles.activityTitleDark : styles.activityTitleLight,
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.activitySubtitle,
              isDark ? styles.activitySubtitleDark : styles.activitySubtitleLight,
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.activityValue,
          isDark ? styles.activityValueDark : styles.activityValueLight,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function ProgressLine({
  label,
  value,
  isDark,
}: {
  label: string;
  value: number;
  isDark: boolean;
}) {
  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressHead}>
        <Text
          style={[
            styles.progressLabel,
            isDark ? styles.progressLabelDark : styles.progressLabelLight,
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.progressPercent,
            isDark ? styles.progressPercentDark : styles.progressPercentLight,
          ]}
        >
          {value}%
        </Text>
      </View>

      <View
        style={[
          styles.progressTrack,
          isDark ? styles.progressTrackDark : styles.progressTrackLight,
        ]}
      >
        <LinearGradient
          colors={
            isDark
              ? ['#60a5fa', '#3b82f6', '#1d4ed8']
              : ['#93c5fd', '#3b82f6', '#2563eb']
          }
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.progressFill, { width: `${Math.max(8, value)}%` }]}
        />
      </View>
    </View>
  );
}

function TinyBars({
  values,
  labels,
  isDark,
}: {
  values: number[];
  labels: string[];
  isDark: boolean;
}) {
  const max = Math.max(...values, 1);

  return (
    <View style={styles.tinyBarsWrap}>
      {values.map((item, index) => {
        const h = Math.max((item / max) * 100, 14);

        return (
          <View key={`${labels[index]}-${item}`} style={styles.tinyBarItem}>
            <View
              style={[
                styles.tinyTrack,
                isDark ? styles.tinyTrackDark : styles.tinyTrackLight,
              ]}
            >
              <LinearGradient
                colors={
                  isDark
                    ? ['#1d4ed8', '#3b82f6', '#93c5fd']
                    : ['#dbeafe', '#60a5fa', '#2563eb']
                }
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={[styles.tinyFill, { height: `${h}%` }]}
              />
            </View>
            <Text
              style={[
                styles.tinyLabel,
                isDark ? styles.tinyLabelDark : styles.tinyLabelLight,
              ]}
            >
              {labels[index]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function HomeScene() {
  const { width } = useWindowDimensions();
  const { resolvedTheme } = useThemeMode();
  const t = useTranslation();

  const isDark = resolvedTheme === 'dark';
  const isWide = width >= 920;

  const metrics = React.useMemo(
    () => [
      {
        title: 'Monthly Revenue',
        value: '42,300 AZN',
        delta: '+6.4%',
        note: 'Compared to previous month',
        icon: CircleDollarSign,
      },
      {
        title: 'Active Residents',
        value: '1,284',
        delta: '+2.1%',
        note: 'Stable occupancy and usage',
        icon: Users,
      },
      {
        title: 'Service Requests',
        value: '37',
        delta: '-1.8%',
        note: 'Open operational tickets',
        icon: Wrench,
      },
      {
        title: 'Collection Rate',
        value: '94.2%',
        delta: '+3.0%',
        note: 'Payment success performance',
        icon: TrendingUp,
      },
    ],
    [],
  );

  const teamPerformance = React.useMemo(
    () => [
      { label: 'Support Team', value: 88 },
      { label: 'Finance Team', value: 81 },
      { label: 'Field Operations', value: 74 },
      { label: 'Management', value: 92 },
    ],
    [],
  );

  const workload = React.useMemo(
    () => [
      { label: 'Security', value: 76 },
      { label: 'Maintenance', value: 64 },
      { label: 'Cleaning', value: 84 },
      { label: 'Admin', value: 71 },
    ],
    [],
  );

  return (
    <AppPageLayout
      title={t.dashboard.title || 'Dashboard'}
      isDark={isDark}
      scrollable
      contentContainerStyle={styles.container}
      settingsRouteKey="settings"
      profileRouteKey="profile"
      notificationCount={4}
      notificationText="4 new notifications"
    >
      <LinearGradient
        colors={
          isDark
            ? ['#0f172a', '#111827', '#172554']
            : ['#dbeafe', '#eff6ff', '#ffffff']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.hero,
          isDark ? styles.heroBorderDark : styles.heroBorderLight,
        ]}
      >
        {/* <View style={styles.heroHeaderRow}>
          <View style={styles.heroBadge}>
            <Sparkles
              size={14}
              color={isDark ? '#dbeafe' : '#1d4ed8'}
              strokeWidth={2.4}
            />
            <Text
              style={[
                styles.heroBadgeText,
                isDark ? styles.heroBadgeTextDark : styles.heroBadgeTextLight,
              ]}
            >
              Premium Overview
            </Text>
          </View>

          <Pressable
            onPress={() => showToast('Notifications panel coming soon')}
            style={[
              styles.heroBell,
              isDark ? styles.heroBellDark : styles.heroBellLight,
            ]}
          >
            <Bell
              size={17}
              color={isDark ? '#e2e8f0' : '#0f172a'}
              strokeWidth={2.3}
            />
          </Pressable>
        </View> */}

        <Text
          style={[
            styles.heroTitle,
            isDark ? styles.heroTitleDark : styles.heroTitleLight,
          ]}
        >
          Command Center
        </Text>

        <Text
          style={[
            styles.heroSubtitle,
            isDark ? styles.heroSubtitleDark : styles.heroSubtitleLight,
          ]}
        >
          Bütün əsas əməliyyatları, ödəniş axınını, resident aktivliyini və
          komanda performansını bir ekranda rahat izləyə biləcəyin premium dashboard.
        </Text>

        <View style={styles.heroBottom}>
          <View style={styles.heroStatMain}>
            <Text
              style={[
                styles.heroStatMainLabel,
                isDark
                  ? styles.heroStatMainLabelDark
                  : styles.heroStatMainLabelLight,
              ]}
            >
              Weekly Completion
            </Text>
            <Text
              style={[
                styles.heroStatMainValue,
                isDark
                  ? styles.heroStatMainValueDark
                  : styles.heroStatMainValueLight,
              ]}
            >
              87.4%
            </Text>
          </View>

          <View style={styles.heroMiniStats}>
            <InsightCard
              title="Today Income"
              value="8.4K"
              desc="Daily collection"
              isDark={isDark}
            />
            <InsightCard
              title="Pending"
              value="14"
              desc="Urgent issues"
              isDark={isDark}
            />
            <InsightCard
              title="Avg Time"
              value="12m"
              desc="Response speed"
              isDark={isDark}
            />
          </View>
        </View>
      </LinearGradient>

      <SectionTitle
        title="Key Metrics"
        subtitle="Ən vacib göstəricilər"
        icon={ChartNoAxesCombined}
        isDark={isDark}
      />

      <View style={styles.metricGrid}>
        {metrics.map(item => (
          <TopMetricCard
            key={item.title}
            title={item.title}
            value={item.value}
            delta={item.delta}
            note={item.note}
            icon={item.icon}
            isDark={isDark}
            wide={isWide}
          />
        ))}
      </View>

      <View style={[styles.doubleGrid, isWide && styles.doubleGridWide]}>
        <View
          style={[
            styles.panel,
            isDark ? styles.panelDark : styles.panelLight,
            isWide && styles.doubleGridItem,
          ]}
        >
          <SectionTitle
            title="Revenue Flow"
            subtitle="Həftəlik ödəniş dinamiki"
            icon={CircleDollarSign}
            isDark={isDark}
          />

          <TinyBars
            values={[42, 55, 49, 64, 70, 78, 82]}
            labels={['M', 'T', 'W', 'T', 'F', 'S', 'S']}
            isDark={isDark}
          />
        </View>

        <View
          style={[
            styles.panel,
            isDark ? styles.panelDark : styles.panelLight,
            isWide && styles.doubleGridItem,
          ]}
        >
          <SectionTitle
            title="Team Performance"
            subtitle="Komandaların məhsuldarlığı"
            icon={Users}
            isDark={isDark}
          />

          {teamPerformance.map(item => (
            <ProgressLine
              key={item.label}
              label={item.label}
              value={item.value}
              isDark={isDark}
            />
          ))}
        </View>
      </View>

      <View style={[styles.doubleGrid, isWide && styles.doubleGridWide]}>
        <View
          style={[
            styles.panel,
            isDark ? styles.panelDark : styles.panelLight,
            isWide && styles.doubleGridItem,
          ]}
        >
          <SectionTitle
            title="Operations Feed"
            subtitle="Son fəaliyyətlər"
            icon={FileText}
            isDark={isDark}
          />

          <ActivityRow
            title="New maintenance report"
            subtitle="Block B • 12 minutes ago"
            value="Open"
            icon={Wrench}
            isDark={isDark}
          />
          <ActivityRow
            title="Resident payment confirmed"
            subtitle="Building 3 • 25 minutes ago"
            value="Done"
            icon={CircleDollarSign}
            isDark={isDark}
          />
          <ActivityRow
            title="Visitor approval updated"
            subtitle="Gate access • 43 minutes ago"
            value="Done"
            icon={Building2}
            isDark={isDark}
          />
          <ActivityRow
            title="Response SLA warning"
            subtitle="Support queue • 1 hour ago"
            value="Alert"
            icon={Clock3}
            isDark={isDark}
          />
        </View>

        <View
          style={[
            styles.panel,
            isDark ? styles.panelDark : styles.panelLight,
            isWide && styles.doubleGridItem,
          ]}
        >
          <SectionTitle
            title="Department Load"
            subtitle="Şöbələr üzrə yük bölgüsü"
            icon={Building2}
            isDark={isDark}
          />

          {workload.map(item => (
            <ProgressLine
              key={item.label}
              label={item.label}
              value={item.value}
              isDark={isDark}
            />
          ))}
        </View>
      </View>
    </AppPageLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  hero: {
    borderRadius: 30,
    // padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
  },
  heroBorderLight: {
    borderColor: '#dbeafe',
  },
  heroBorderDark: {
    borderColor: '#1e293b',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroBadgeText: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  heroBadgeTextLight: {
    color: '#1d4ed8',
  },
  heroBadgeTextDark: {
    color: '#e0f2fe',
  },
  heroBell: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroBellLight: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: '#dbeafe',
  },
  heroBellDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroTitle: {
    marginTop: 18,
    fontSize: 30,
    lineHeight: 36,
    fontFamily: 'WorkSans-Bold',
  },
  heroTitleLight: {
    color: '#0f172a',
  },
  heroTitleDark: {
    color: '#f8fafc',
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'WorkSans-Regular',
    maxWidth: '100%',
  },
  heroSubtitleLight: {
    color: '#334155',
  },
  heroSubtitleDark: {
    color: '#cbd5e1',
  },
  heroBottom: {
    marginTop: 22,
    gap: 14,
  },
  heroStatMain: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  heroStatMainLabel: {
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  heroStatMainLabelLight: {
    color: '#475569',
  },
  heroStatMainLabelDark: {
    color: '#cbd5e1',
  },
  heroStatMainValue: {
    marginTop: 8,
    fontSize: 36,
    lineHeight: 42,
    fontFamily: 'WorkSans-Bold',
  },
  heroStatMainValueLight: {
    color: '#0f172a',
  },
  heroStatMainValueDark: {
    color: '#ffffff',
  },
  heroMiniStats: {
    flexDirection: 'row',
    gap: 10,
  },

  sectionTitleWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sectionIconLight: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  sectionIconDark: {
    backgroundColor: 'rgba(59,130,246,0.16)',
    borderColor: 'rgba(96,165,250,0.2)',
  },
  sectionTitleText: {
    fontSize: 17,
    fontFamily: 'WorkSans-Bold',
  },
  sectionTitleTextLight: {
    color: '#0f172a',
  },
  sectionTitleTextDark: {
    color: '#f8fafc',
  },
  sectionSubtitleText: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'WorkSans-Regular',
  },
  sectionSubtitleTextLight: {
    color: '#64748b',
  },
  sectionSubtitleTextDark: {
    color: '#94a3b8',
  },
  sectionGhostButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sectionGhostButtonLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  sectionGhostButtonDark: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
  },

  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    width: '100%',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
  },
  metricCardWide: {
    width: '48.5%',
  },
  metricCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  metricCardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  metricCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  metricIconWrapLight: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
  },
  metricIconWrapDark: {
    backgroundColor: '#111827',
    borderColor: '#1e3a8a',
  },
  metricDeltaChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metricDeltaChipUp: {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  metricDeltaChipDown: {
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  metricDeltaChipText: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
    color: '#e5e7eb',
  },
  metricTitle: {
    marginTop: 16,
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  metricTitleLight: {
    color: '#64748b',
  },
  metricTitleDark: {
    color: '#94a3b8',
  },
  metricValue: {
    marginTop: 8,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'WorkSans-Bold',
  },
  metricValueLight: {
    color: '#0f172a',
  },
  metricValueDark: {
    color: '#f8fafc',
  },
  metricNote: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'WorkSans-Regular',
  },
  metricNoteLight: {
    color: '#64748b',
  },
  metricNoteDark: {
    color: '#94a3b8',
  },

  insightCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  insightCardLight: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderColor: '#dbeafe',
  },
  insightCardDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  insightTitle: {
    fontSize: 11,
    fontFamily: 'WorkSans-Medium',
  },
  insightTitleLight: {
    color: '#64748b',
  },
  insightTitleDark: {
    color: '#94a3b8',
  },
  insightValue: {
    marginTop: 5,
    fontSize: 18,
    fontFamily: 'WorkSans-Bold',
  },
  insightValueLight: {
    color: '#0f172a',
  },
  insightValueDark: {
    color: '#f8fafc',
  },
  insightDesc: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: 'WorkSans-Regular',
  },
  insightDescLight: {
    color: '#64748b',
  },
  insightDescDark: {
    color: '#94a3b8',
  },

  panel: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  panelLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  panelDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },

  doubleGrid: {
    gap: 12,
  },
  doubleGridWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  doubleGridItem: {
    flex: 1,
  },

  tinyBarsWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 8,
  },
  tinyBarItem: {
    alignItems: 'center',
    width: 30,
  },
  tinyTrack: {
    width: 22,
    height: 130,
    borderRadius: 999,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  tinyTrackLight: {
    backgroundColor: '#edf2f7',
  },
  tinyTrackDark: {
    backgroundColor: '#1f2937',
  },
  tinyFill: {
    width: '100%',
    borderRadius: 999,
  },
  tinyLabel: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: 'WorkSans-Medium',
  },
  tinyLabelLight: {
    color: '#64748b',
  },
  tinyLabelDark: {
    color: '#94a3b8',
  },

  progressBlock: {
    gap: 8,
  },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  progressLabelLight: {
    color: '#334155',
  },
  progressLabelDark: {
    color: '#e2e8f0',
  },
  progressPercent: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  progressPercentLight: {
    color: '#0f172a',
  },
  progressPercentDark: {
    color: '#f8fafc',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressTrackLight: {
    backgroundColor: '#e2e8f0',
  },
  progressTrackDark: {
    backgroundColor: '#1f2937',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },

  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.12)',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  activityIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  activityIconWrapLight: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
  },
  activityIconWrapDark: {
    backgroundColor: '#111827',
    borderColor: '#1e3a8a',
  },
  activityTitle: {
    fontSize: 13,
    fontFamily: 'WorkSans-SemiBold',
  },
  activityTitleLight: {
    color: '#0f172a',
  },
  activityTitleDark: {
    color: '#f8fafc',
  },
  activitySubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'WorkSans-Regular',
  },
  activitySubtitleLight: {
    color: '#64748b',
  },
  activitySubtitleDark: {
    color: '#94a3b8',
  },
  activityValue: {
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
  activityValueLight: {
    color: '#2563eb',
  },
  activityValueDark: {
    color: '#93c5fd',
  },
});