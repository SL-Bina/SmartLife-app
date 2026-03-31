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
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  LayoutGrid,
  List,
  ReceiptText,
  RefreshCcw,
  Search,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react-native';

import AppPageLayout from '../../../components/common/app-page-layout';
import LinearGradient from '../../../components/common/safe-linear-gradient';
import { useThemeMode } from '../../../hooks/use-theme';
import { residentInvoicesAPI } from '../../../services/resident-api';
import {
  asNumber,
  asString,
  extractList,
  formatCurrency,
  formatDate,
  pickText,
  toRecord,
} from '../resident-data-utils';
import { useResidentPropertySelector } from '../use-resident-property-selector';

type InvoiceStatus = 'paid' | 'unpaid' | 'not_paid' | 'overdue' | 'pending' | 'unknown';

type InvoiceItem = {
  id: string;
  serviceName: string;
  description: string;
  amount: number;
  amountPaid: number;
  remaining: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
};

const normalizeStatus = (value: unknown): InvoiceStatus => {
  const status = asString(value).trim().toLowerCase();
  if (
    status === 'paid'
    || status === 'unpaid'
    || status === 'not_paid'
    || status === 'overdue'
    || status === 'pending'
  ) {
    return status;
  }

  return 'unknown';
};

const statusMeta = (status: InvoiceStatus): {
  label: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
  icon: LucideIcon;
} => {
  if (status === 'paid') {
    return {
      label: 'Ödənilib',
      tone: 'good',
      icon: CheckCircle2,
    };
  }

  if (status === 'overdue') {
    return {
      label: 'Vaxtı keçib',
      tone: 'bad',
      icon: TriangleAlert,
    };
  }

  if (status === 'unpaid' || status === 'not_paid') {
    return {
      label: 'Ödənilməyib',
      tone: 'bad',
      icon: TriangleAlert,
    };
  }

  if (status === 'pending') {
    return {
      label: 'Gözləyir',
      tone: 'warn',
      icon: Clock3,
    };
  }

  return {
    label: 'Naməlum',
    tone: 'neutral',
    icon: ReceiptText,
  };
};

const isUnpaid = (status: InvoiceStatus): boolean => {
  return status === 'unpaid' || status === 'not_paid' || status === 'overdue';
};

function MetricCard({
  title,
  value,
  note,
  icon: Icon,
  isDark,
}: {
  title: string;
  value: string;
  note: string;
  icon: LucideIcon;
  isDark: boolean;
}) {
  return (
    <View style={[styles.metricCard, isDark ? styles.metricCardDark : styles.metricCardLight]}>
      <View style={[styles.metricIconWrap, isDark ? styles.metricIconWrapDark : styles.metricIconWrapLight]}>
        <Icon size={17} color={isDark ? '#bfdbfe' : '#1d4ed8'} strokeWidth={2.3} />
      </View>

      <Text style={[styles.metricTitle, isDark ? styles.metricTitleDark : styles.metricTitleLight]}>
        {title}
      </Text>

      <Text style={[styles.metricValue, isDark ? styles.metricValueDark : styles.metricValueLight]}>
        {value}
      </Text>

      <Text style={[styles.metricNote, isDark ? styles.metricNoteDark : styles.metricNoteLight]}>
        {note}
      </Text>
    </View>
  );
}

export default function MyInvoicesSection() {
  const { resolvedTheme } = useThemeMode();
  const {
    propertyId,
    propertyOptions,
    selectedPropertyName,
    onPropertyChange,
  } = useResidentPropertySelector();
  const isDark = resolvedTheme === 'dark';

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'cards' | 'list'>('cards');
  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([]);

  const runLoad = React.useCallback(
    async (isRefresh: boolean) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        setError(null);

        const response = propertyId !== null
          ? await residentInvoicesAPI.getByProperty(propertyId)
          : await residentInvoicesAPI.getAll();

        const list = extractList(response).map(item => toRecord(item));
        const normalized = list.map((item, index) => {
          const id = asString(item.id) || asString(item.invoice_id) || `invoice-${index + 1}`;
          const amount = asNumber(item.amount);
          const amountPaid = asNumber(item.amount_paid);
          const status = normalizeStatus(item.status);

          return {
            id,
            serviceName: pickText(item.service_name, item.title, item.name, `Faktura #${id}`),
            description: pickText(item.description, item.note, item.desc),
            amount,
            amountPaid,
            remaining: Math.max(0, amount - amountPaid),
            status,
            dueDate: formatDate(item.due_date),
            createdAt: formatDate(item.paid_at || item.created_at),
          } as InvoiceItem;
        });

        setInvoices(normalized);
        setUpdatedAt(formatDate(new Date().toISOString()));
      } catch (loadError) {
        setInvoices([]);
        if (loadError instanceof Error && loadError.message) {
          setError(loadError.message);
        } else {
          setError('Fakturalar yüklənmədi');
        }
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [propertyId],
  );

  React.useEffect(() => {
    void runLoad(false);
  }, [runLoad]);

  const filteredInvoices = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return invoices;
    }

    return invoices.filter(item => {
      const statusLabel = statusMeta(item.status).label.toLowerCase();
      return (
        item.id.toLowerCase().includes(q)
        || item.serviceName.toLowerCase().includes(q)
        || item.description.toLowerCase().includes(q)
        || statusLabel.includes(q)
      );
    });
  }, [invoices, query]);

  const totals = React.useMemo(() => {
    const unpaid = invoices.filter(item => isUnpaid(item.status));
    const paid = invoices.filter(item => item.status === 'paid');
    const debt = unpaid.reduce((sum, item) => sum + item.remaining, 0);
    return {
      all: invoices.length,
      paid: paid.length,
      unpaid: unpaid.length,
      debt,
    };
  }, [invoices]);

  return (
    <AppPageLayout
      title="Fakturalarım"
      isDark={isDark}
      scrollable
      settingsRouteKey="resident_settings"
      profileRouteKey="resident_profile"
      devicesRouteKey="resident_my_devices"
      notificationsRouteKey="resident_notifications"
      mtkOptions={propertyOptions.map(option => option.name)}
      initialMtk={selectedPropertyName}
      onMtkChange={onPropertyChange}
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
            <ReceiptText size={14} color={isDark ? '#dbeafe' : '#1d4ed8'} strokeWidth={2.4} />
            <Text style={[styles.heroBadgeText, isDark ? styles.heroBadgeTextDark : styles.heroBadgeTextLight]}>
              Invoices Center
            </Text>
          </View>

          <Pressable
            disabled={loading || refreshing}
            onPress={() => {
              void runLoad(true);
            }}
            style={[styles.refreshButton, isDark ? styles.refreshButtonDark : styles.refreshButtonLight]}
          >
            <RefreshCcw size={14} color={isDark ? '#dbeafe' : '#1d4ed8'} strokeWidth={2.3} />
            <Text style={[styles.refreshText, isDark ? styles.refreshTextDark : styles.refreshTextLight]}>
              {refreshing ? 'Yenilənir...' : 'Yenilə'}
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.heroTitle, isDark ? styles.heroTitleDark : styles.heroTitleLight]}>
          Fakturalarım
        </Text>

        <Text style={[styles.heroSubtitle, isDark ? styles.heroSubtitleDark : styles.heroSubtitleLight]}>
          Aktiv mənzil: {selectedPropertyName ?? '-'}
        </Text>

        <View style={styles.heroMainStatWrap}>
          <Text style={[styles.heroMainStatLabel, isDark ? styles.heroMainStatLabelDark : styles.heroMainStatLabelLight]}>
            Cari borc
          </Text>
          <Text style={[styles.heroMainStatValue, isDark ? styles.heroMainStatValueDark : styles.heroMainStatValueLight]}>
            {formatCurrency(totals.debt)}
          </Text>
          <Text style={[styles.heroMetaText, isDark ? styles.heroMetaTextDark : styles.heroMetaTextLight]}>
            Son yenilənmə: {updatedAt || '-'}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.metricGrid}>
        <MetricCard
          title="Cəmi faktura"
          value={String(totals.all)}
          note="Bütün fakturalar"
          icon={ReceiptText}
          isDark={isDark}
        />
        <MetricCard
          title="Ödənilib"
          value={String(totals.paid)}
          note="Tamamlanan ödəniş"
          icon={CheckCircle2}
          isDark={isDark}
        />
        <MetricCard
          title="Ödənilməyib"
          value={String(totals.unpaid)}
          note="Aktiv borc fakturaları"
          icon={TriangleAlert}
          isDark={isDark}
        />
        <MetricCard
          title="Borc"
          value={formatCurrency(totals.debt)}
          note="Cari qalıq məbləğ"
          icon={CircleDollarSign}
          isDark={isDark}
        />
      </View>

      <View style={styles.toolbarRow}>
        <View style={[styles.searchWrap, isDark ? styles.searchWrapDark : styles.searchWrapLight]}>
          <Search size={15} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Faktura axtar..."
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
          <Text style={[styles.errorText, isDark ? styles.errorTextDark : styles.errorTextLight]}>
            {error}
          </Text>
        </View>
      ) : null}

      {!loading && !error && filteredInvoices.length === 0 ? (
        <View style={styles.centerWrap}>
          <Text style={[styles.emptyText, isDark ? styles.emptyTextDark : styles.emptyTextLight]}>
            Faktura tapılmadı
          </Text>
        </View>
      ) : null}

      {!loading && !error && filteredInvoices.length > 0 ? (
        <View style={styles.listWrap}>
          {viewMode === 'cards' ? (
            <View style={styles.cardsGrid}>
              {filteredInvoices.map(item => {
                const meta = statusMeta(item.status);
                const StatusIcon = meta.icon;

                return (
                  <View key={item.id} style={[styles.invoiceCard, isDark ? styles.invoiceCardDark : styles.invoiceCardLight]}>
                    <View style={styles.invoiceTopRow}>
                      <Text style={[styles.invoiceTitle, isDark ? styles.invoiceTitleDark : styles.invoiceTitleLight]}>
                        {item.serviceName}
                      </Text>

                      <View
                        style={[
                          styles.statusPill,
                          meta.tone === 'good'
                            ? styles.statusPillGood
                            : meta.tone === 'bad'
                              ? styles.statusPillBad
                              : meta.tone === 'warn'
                                ? styles.statusPillWarn
                                : styles.statusPillNeutral,
                        ]}
                      >
                        <StatusIcon size={11} color="#e5e7eb" strokeWidth={2.4} />
                        <Text style={styles.statusPillText}>{meta.label}</Text>
                      </View>
                    </View>

                    <Text style={[styles.invoiceAmount, isDark ? styles.invoiceAmountDark : styles.invoiceAmountLight]}>
                      {formatCurrency(item.amount)}
                    </Text>

                    <Text style={[styles.invoiceMeta, isDark ? styles.invoiceMetaDark : styles.invoiceMetaLight]}>
                      Qalıq: {formatCurrency(item.remaining)}
                    </Text>

                    <View style={styles.invoiceDatesRow}>
                      <Text style={[styles.invoiceDate, isDark ? styles.invoiceDateDark : styles.invoiceDateLight]}>
                        Son tarix: {item.dueDate}
                      </Text>
                      <Text style={[styles.invoiceDate, isDark ? styles.invoiceDateDark : styles.invoiceDateLight]}>
                        Tarix: {item.createdAt}
                      </Text>
                    </View>

                    <Text style={[styles.invoiceIdText, isDark ? styles.invoiceIdTextDark : styles.invoiceIdTextLight]}>
                      #{item.id}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.tableWrap, isDark ? styles.tableWrapDark : styles.tableWrapLight]}>
              {filteredInvoices.map(item => {
                const meta = statusMeta(item.status);

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
                        {item.serviceName}
                      </Text>
                      <Text style={[styles.tableSub, isDark ? styles.tableSubDark : styles.tableSubLight]}>
                        #{item.id} • {item.dueDate}
                      </Text>
                    </View>

                    <View style={styles.tableRight}>
                      <Text style={[styles.tableAmount, isDark ? styles.tableAmountDark : styles.tableAmountLight]}>
                        {formatCurrency(item.remaining)}
                      </Text>
                      <Text
                        style={[
                          styles.tableStatus,
                          meta.tone === 'good'
                            ? styles.tableStatusGood
                            : meta.tone === 'bad'
                              ? styles.tableStatusBad
                              : meta.tone === 'warn'
                                ? styles.tableStatusWarn
                                : styles.tableStatusNeutral,
                        ]}
                      >
                        {meta.label}
                      </Text>
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
  refreshText: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  refreshTextLight: {
    color: '#1e3a8a',
  },
  refreshTextDark: {
    color: '#dbeafe',
  },
  heroTitle: {
    marginTop: 16,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'WorkSans-Bold',
  },
  heroTitleLight: {
    color: '#0f172a',
  },
  heroTitleDark: {
    color: '#f8fafc',
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'WorkSans-Regular',
  },
  heroSubtitleLight: {
    color: '#334155',
  },
  heroSubtitleDark: {
    color: '#cbd5e1',
  },
  heroMainStatWrap: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.10)',
    padding: 14,
  },
  heroMainStatLabel: {
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  heroMainStatLabelLight: {
    color: '#475569',
  },
  heroMainStatLabelDark: {
    color: '#cbd5e1',
  },
  heroMainStatValue: {
    marginTop: 6,
    fontSize: 26,
    lineHeight: 31,
    fontFamily: 'WorkSans-Bold',
  },
  heroMainStatValueLight: {
    color: '#0f172a',
  },
  heroMainStatValueDark: {
    color: '#ffffff',
  },
  heroMetaText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'WorkSans-Regular',
  },
  heroMetaTextLight: {
    color: '#64748b',
  },
  heroMetaTextDark: {
    color: '#94a3b8',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
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
    width: 40,
    height: 40,
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
  metricTitle: {
    marginTop: 12,
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
  metricNote: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'WorkSans-Regular',
  },
  metricNoteLight: {
    color: '#64748b',
  },
  metricNoteDark: {
    color: '#94a3b8',
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
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'WorkSans-SemiBold',
  },
  errorTextLight: {
    color: '#b91c1c',
  },
  errorTextDark: {
    color: '#fecaca',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'WorkSans-Regular',
  },
  emptyTextLight: {
    color: '#64748b',
  },
  emptyTextDark: {
    color: '#94a3b8',
  },
  listWrap: {
    paddingBottom: 12,
  },
  cardsGrid: {
    gap: 8,
  },
  invoiceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginTop: 2,
  },
  invoiceCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  invoiceCardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  invoiceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  invoiceTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'WorkSans-SemiBold',
  },
  invoiceTitleLight: {
    color: '#0f172a',
  },
  invoiceTitleDark: {
    color: '#f8fafc',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  invoiceAmount: {
    marginTop: 10,
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'WorkSans-Bold',
  },
  invoiceAmountLight: {
    color: '#0f172a',
  },
  invoiceAmountDark: {
    color: '#f8fafc',
  },
  invoiceMeta: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'WorkSans-Regular',
  },
  invoiceMetaLight: {
    color: '#475569',
  },
  invoiceMetaDark: {
    color: '#94a3b8',
  },
  invoiceDatesRow: {
    marginTop: 10,
    gap: 3,
  },
  invoiceDate: {
    fontSize: 11,
    fontFamily: 'WorkSans-Regular',
  },
  invoiceDateLight: {
    color: '#64748b',
  },
  invoiceDateDark: {
    color: '#94a3b8',
  },
  invoiceIdText: {
    marginTop: 8,
    fontSize: 10,
    fontFamily: 'WorkSans-Medium',
  },
  invoiceIdTextLight: {
    color: '#94a3b8',
  },
  invoiceIdTextDark: {
    color: '#64748b',
  },
  tableWrap: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 2,
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
  tableSub: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'WorkSans-Regular',
  },
  tableSubLight: {
    color: '#64748b',
  },
  tableSubDark: {
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
});
