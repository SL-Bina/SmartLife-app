import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  LayoutGrid,
  List,
  RefreshCcw,
  Search,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';

import AppPageLayout from '../../../components/common/app-page-layout';
import LinearGradient from '../../../components/common/safe-linear-gradient';
import { useThemeMode } from '../../../hooks/use-theme';
import {
  formatDate,
  type ResidentListItem,
} from '../resident-data-utils';
import { useResidentPropertySelector } from '../use-resident-property-selector';

type SummaryMetric = {
  label: string;
  value: string;
};

type ResidentModuleDataScreenProps = {
  title: string;
  subtitle: string;
  emptyText: string;
  loadData: (context: {
    propertyId: number | string | null;
  }) => Promise<{
    items: ResidentListItem[];
    metrics: SummaryMetric[];
  }>;
};

export default function ResidentModuleDataScreen({
  title,
  subtitle,
  emptyText,
  loadData,
}: ResidentModuleDataScreenProps) {
  const { resolvedTheme } = useThemeMode();
  const {
    propertyId,
    propertyOptions,
    selectedPropertyName,
    onPropertyChange,
  } = useResidentPropertySelector();
  const isDark = resolvedTheme === 'dark';

  const [items, setItems] = React.useState<ResidentListItem[]>([]);
  const [metrics, setMetrics] = React.useState<SummaryMetric[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = React.useState<string>('');
  const [query, setQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'cards' | 'list'>('cards');

  const runLoad = React.useCallback(
    async (isRefresh: boolean) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        setError(null);
        const result = await loadData({ propertyId });
        setItems(result.items);
        setMetrics(result.metrics);
        setUpdatedAt(formatDate(new Date().toISOString()));
      } catch (loadError) {
        setItems([]);
        setMetrics([]);
        if (loadError instanceof Error && loadError.message) {
          setError(loadError.message);
        } else {
          setError('Məlumatlar yüklənmədi');
        }
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [loadData, propertyId],
  );

  React.useEffect(() => {
    runLoad(false);
  }, [runLoad]);

  const filteredItems = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return items;
    }

    return items.filter(item => {
      return (
        item.title.toLowerCase().includes(q)
        || item.subtitle?.toLowerCase().includes(q)
        || item.status?.toLowerCase().includes(q)
        || item.meta?.toLowerCase().includes(q)
        || item.amount?.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const cardStyle = React.useMemo(
    () => [styles.card, isDark ? styles.cardDark : styles.cardLight],
    [isDark],
  );

  const metaTextStyle = React.useMemo(
    () => [styles.metaText, isDark ? styles.metaTextDark : styles.metaTextLight],
    [isDark],
  );

  const titleTextStyle = React.useMemo(
    () => [styles.itemTitle, isDark ? styles.itemTitleDark : styles.itemTitleLight],
    [isDark],
  );

  const subtitleTextStyle = React.useMemo(
    () => [styles.itemSubtitle, isDark ? styles.itemSubtitleDark : styles.itemSubtitleLight],
    [isDark],
  );

  const resolveStatusTone = React.useCallback((status?: string): 'good' | 'warn' | 'bad' | 'neutral' => {
    const text = (status || '').toLowerCase();

    if (text.includes('paid') || text.includes('active') || text.includes('done') || text.includes('closed')) {
      return 'good';
    }

    if (text.includes('overdue') || text.includes('error') || text.includes('failed') || text.includes('unpaid')) {
      return 'bad';
    }

    if (text.includes('pending') || text.includes('wait') || text.includes('progress') || text.includes('new')) {
      return 'warn';
    }

    return 'neutral';
  }, []);

  const MetricCard = React.useCallback(({
    metric,
    icon: Icon,
  }: {
    metric: SummaryMetric;
    icon: LucideIcon;
  }) => {
    return (
      <View style={[styles.metricCard, isDark ? styles.metricCardDark : styles.metricCardLight]}>
        <View style={[styles.metricIconWrap, isDark ? styles.metricIconWrapDark : styles.metricIconWrapLight]}>
          <Icon size={15} color={isDark ? '#bfdbfe' : '#1d4ed8'} strokeWidth={2.2} />
        </View>

        <Text style={[styles.metricLabel, isDark ? styles.metricLabelDark : styles.metricLabelLight]}>
          {metric.label}
        </Text>
        <Text style={[styles.metricValue, isDark ? styles.metricValueDark : styles.metricValueLight]}>
          {metric.value}
        </Text>
      </View>
    );
  }, [isDark]);

  const metricIcons = [Sparkles, LayoutGrid, List, RefreshCcw];

  return (
    <AppPageLayout
      title={title}
      isDark={isDark}
      scrollable
      settingsRouteKey="resident_settings"
      profileRouteKey="resident_profile"
      devicesRouteKey="resident_my_devices"
      notificationsRouteKey="resident_notifications"
      mtkOptions={propertyOptions.map(option => option.name)}
      initialMtk={selectedPropertyName}
      onMtkChange={propertyName => {
        const result = onPropertyChange(propertyName);
        if (!result.changed) {
          void runLoad(true);
        }
      }}
    >
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
              Resident Module
            </Text>
          </View>

          <Pressable
            onPress={() => runLoad(true)}
            style={[styles.refreshButton, isDark ? styles.refreshButtonDark : styles.refreshButtonLight]}
            disabled={refreshing || loading}
          >
            <RefreshCcw size={14} color={isDark ? '#dbeafe' : '#1d4ed8'} strokeWidth={2.3} />
            <Text style={[styles.refreshButtonText, isDark ? styles.refreshButtonTextDark : styles.refreshButtonTextLight]}>
              {refreshing ? 'Yenilənir...' : 'Yenilə'}
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.pageTitle, isDark ? styles.pageTitleDark : styles.pageTitleLight]}>
          {title}
        </Text>
        <Text style={[styles.pageSubtitle, isDark ? styles.pageSubtitleDark : styles.pageSubtitleLight]}>
          {subtitle}
        </Text>

        <View style={styles.metaRow}>
          <Text style={metaTextStyle}>
            Aktiv mənzil: {selectedPropertyName ?? '-'}
          </Text>
          <Text style={metaTextStyle}>
            Yeniləndi: {updatedAt || '-'}
          </Text>
        </View>
      </LinearGradient>

      {metrics.length > 0 && (
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <MetricCard
              key={metric.label}
              metric={metric}
              icon={metricIcons[index % metricIcons.length]}
            />
          ))}
        </View>
      )}

      <View style={styles.toolbarRow}>
        <View style={[styles.searchWrap, isDark ? styles.searchWrapDark : styles.searchWrapLight]}>
          <Search size={15} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Axtar..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            style={[styles.searchInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
          />
        </View>

        <View style={[styles.modeToggle, isDark ? styles.modeToggleDark : styles.modeToggleLight]}>
          <Pressable
            onPress={() => setViewMode('cards')}
            style={[
              styles.modeButton,
              viewMode === 'cards'
                ? isDark
                  ? styles.modeButtonActiveDark
                  : styles.modeButtonActiveLight
                : null,
            ]}
          >
            <LayoutGrid size={14} color={viewMode === 'cards' ? '#dbeafe' : isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            onPress={() => setViewMode('list')}
            style={[
              styles.modeButton,
              viewMode === 'list'
                ? isDark
                  ? styles.modeButtonActiveDark
                  : styles.modeButtonActiveLight
                : null,
            ]}
          >
            <List size={14} color={viewMode === 'list' ? '#dbeafe' : isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={isDark ? '#93c5fd' : '#2563eb'} />
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.centerWrap}>
          <Text style={[styles.errorText, isDark ? styles.errorTextDark : styles.errorTextLight]}>{error}</Text>
        </View>
      ) : null}

      {!loading && !error && filteredItems.length === 0 ? (
        <View style={styles.centerWrap}>
          <Text style={[styles.emptyText, isDark ? styles.emptyTextDark : styles.emptyTextLight]}>{emptyText}</Text>
        </View>
      ) : null}

      {!loading && !error && filteredItems.length > 0 ? (
        <View style={styles.itemsWrap}>
          {viewMode === 'cards' ? (
            filteredItems.map(item => {
              const tone = resolveStatusTone(item.status);
              return (
                <View key={item.id} style={cardStyle}>
                  <View style={styles.itemTopRow}>
                    <Text style={titleTextStyle}>{item.title}</Text>

                    {item.status ? (
                      <View
                        style={[
                          styles.statusPill,
                          tone === 'good'
                            ? styles.statusPillGood
                            : tone === 'bad'
                              ? styles.statusPillBad
                              : tone === 'warn'
                                ? styles.statusPillWarn
                                : styles.statusPillNeutral,
                        ]}
                      >
                        <Text style={styles.statusPillText}>{item.status}</Text>
                      </View>
                    ) : null}
                  </View>

                  {item.amount ? (
                    <Text style={[styles.amountText, isDark ? styles.amountTextDark : styles.amountTextLight]}>
                      {item.amount}
                    </Text>
                  ) : null}

                  {item.subtitle ? <Text style={subtitleTextStyle}>{item.subtitle}</Text> : null}

                  <View style={styles.itemMetaRow}>
                    {item.meta ? <Text style={metaTextStyle}>{item.meta}</Text> : null}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={[styles.tableWrap, isDark ? styles.tableWrapDark : styles.tableWrapLight]}>
              {filteredItems.map(item => {
                const tone = resolveStatusTone(item.status);

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.tableRow,
                      isDark ? styles.tableRowDark : styles.tableRowLight,
                    ]}
                  >
                    <View style={styles.tableLeft}>
                      <Text style={[styles.tableTitle, isDark ? styles.tableTitleDark : styles.tableTitleLight]}>
                        {item.title}
                      </Text>
                      {item.subtitle ? (
                        <Text style={[styles.tableSubtitle, isDark ? styles.tableSubtitleDark : styles.tableSubtitleLight]}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.tableRight}>
                      {item.amount ? (
                        <Text style={[styles.tableAmount, isDark ? styles.tableAmountDark : styles.tableAmountLight]}>
                          {item.amount}
                        </Text>
                      ) : null}

                      {item.status ? (
                        <Text
                          style={[
                            styles.tableStatus,
                            tone === 'good'
                              ? styles.tableStatusGood
                              : tone === 'bad'
                                ? styles.tableStatusBad
                                : tone === 'warn'
                                  ? styles.tableStatusWarn
                                  : styles.tableStatusNeutral,
                          ]}
                        >
                          {item.status}
                        </Text>
                      ) : null}

                      {item.meta ? (
                        <Text style={[styles.tableMeta, isDark ? styles.tableMetaDark : styles.tableMetaLight]}>
                          {item.meta}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ) : null}
    </AppPageLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
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
    gap: 8,
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
  pageTitle: {
    marginTop: 16,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'WorkSans-Bold',
  },
  pageTitleLight: {
    color: '#0f172a',
  },
  pageTitleDark: {
    color: '#f8fafc',
  },
  pageSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'WorkSans-Regular',
  },
  pageSubtitleLight: {
    color: '#334155',
  },
  pageSubtitleDark: {
    color: '#cbd5e1',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  },
  refreshButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  refreshButtonLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
  },
  refreshButtonDark: {
    backgroundColor: '#111827',
    borderColor: '#1e3a8a',
  },
  refreshButtonText: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  refreshButtonTextLight: {
    color: '#1e3a8a',
  },
  refreshButtonTextDark: {
    color: '#dbeafe',
  },
  toolbarRow: {
    marginTop: 10,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },
  searchWrapLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
  },
  searchWrapDark: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: 'WorkSans-Regular',
  },
  searchInputLight: {
    color: '#1e293b',
  },
  searchInputDark: {
    color: '#e2e8f0',
  },
  modeToggle: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  modeToggleLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
  },
  modeToggleDark: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  modeButton: {
    width: 32,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActiveLight: {
    backgroundColor: '#1d4ed8',
  },
  modeButtonActiveDark: {
    backgroundColor: '#1e3a8a',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    width: '48.5%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  metricCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  metricCardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
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
  metricLabel: {
    fontSize: 12,
    marginTop: 10,
    fontFamily: 'WorkSans-Medium',
  },
  metricLabelLight: {
    color: '#64748b',
  },
  metricLabelDark: {
    color: '#94a3b8',
  },
  metricValue: {
    marginTop: 8,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: 'WorkSans-Bold',
  },
  metricValueLight: {
    color: '#0f172a',
  },
  metricValueDark: {
    color: '#f8fafc',
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorTextLight: {
    color: '#b91c1c',
  },
  errorTextDark: {
    color: '#fecaca',
  },
  emptyText: {
    fontSize: 14,
  },
  emptyTextLight: {
    color: '#475569',
  },
  emptyTextDark: {
    color: '#cbd5e1',
  },
  itemsWrap: {
    gap: 10,
    paddingBottom: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  cardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  itemTitleLight: {
    color: '#0f172a',
  },
  itemTitleDark: {
    color: '#f8fafc',
  },
  itemSubtitle: {
    marginTop: 6,
    fontSize: 13,
  },
  itemSubtitleLight: {
    color: '#475569',
  },
  itemSubtitleDark: {
    color: '#cbd5e1',
  },
  itemMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillGood: {
    backgroundColor: 'rgba(16,185,129,0.18)',
  },
  statusPillWarn: {
    backgroundColor: 'rgba(245,158,11,0.18)',
  },
  statusPillBad: {
    backgroundColor: 'rgba(239,68,68,0.18)',
  },
  statusPillNeutral: {
    backgroundColor: 'rgba(100,116,139,0.20)',
  },
  statusPillText: {
    fontSize: 10,
    color: '#e5e7eb',
    fontFamily: 'WorkSans-SemiBold',
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'WorkSans-Regular',
  },
  metaTextLight: {
    color: '#64748b',
  },
  metaTextDark: {
    color: '#94a3b8',
  },
  amountText: {
    marginTop: 10,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: 'WorkSans-Bold',
  },
  amountTextLight: {
    color: '#0f172a',
  },
  amountTextDark: {
    color: '#f8fafc',
  },
  tableWrap: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableWrapLight: {
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  tableWrapDark: {
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  tableRow: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  tableRowLight: {
    borderBottomColor: '#e2e8f0',
  },
  tableRowDark: {
    borderBottomColor: '#334155',
  },
  tableLeft: {
    flex: 1,
    paddingRight: 8,
  },
  tableRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  tableTitle: {
    fontSize: 13,
    fontFamily: 'WorkSans-SemiBold',
  },
  tableTitleLight: {
    color: '#0f172a',
  },
  tableTitleDark: {
    color: '#f8fafc',
  },
  tableSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'WorkSans-Regular',
  },
  tableSubtitleLight: {
    color: '#64748b',
  },
  tableSubtitleDark: {
    color: '#94a3b8',
  },
  tableAmount: {
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  tableAmountLight: {
    color: '#0f172a',
  },
  tableAmountDark: {
    color: '#f8fafc',
  },
  tableStatus: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
    textTransform: 'capitalize',
  },
  tableStatusGood: {
    color: '#34d399',
  },
  tableStatusWarn: {
    color: '#fbbf24',
  },
  tableStatusBad: {
    color: '#f87171',
  },
  tableStatusNeutral: {
    color: '#94a3b8',
  },
  tableMeta: {
    fontSize: 10,
    fontFamily: 'WorkSans-Regular',
  },
  tableMetaLight: {
    color: '#64748b',
  },
  tableMetaDark: {
    color: '#94a3b8',
  },
});
