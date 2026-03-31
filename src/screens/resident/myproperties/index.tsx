import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  FileText,
  Home,
  Layers3,
  type LucideIcon,
} from 'lucide-react-native';

import AppPageLayout from '../../../components/common/app-page-layout';
import LinearGradient from '../../../components/common/safe-linear-gradient';
import { useThemeMode } from '../../../hooks/use-theme';
import {
  residentInvoicesAPI,
  residentPropertiesAPI,
} from '../../../services/resident-api';
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

const invoiceStatusLabel = (status: string): string => {
  if (status === 'paid') {
    return 'Ödənilib';
  }

  if (status === 'overdue') {
    return 'Vaxtı keçib';
  }

  if (status === 'unpaid' || status === 'not_paid') {
    return 'Ödənilməyib';
  }

  return 'Naməlum';
};

const normalizeInvoiceStatus = (value: unknown): string => asString(value).trim().toLowerCase();

function SectionTitle({
  title,
  subtitle,
  icon: Icon,
  isDark,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
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
            size={17}
            color={isDark ? '#dbeafe' : '#1d4ed8'}
            strokeWidth={2.4}
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

      <View
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
      </View>
    </View>
  );
}

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
    <View
      style={[
        styles.metricCard,
        isDark ? styles.metricCardDark : styles.metricCardLight,
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
            size={17}
            color={isDark ? '#bfdbfe' : '#1d4ed8'}
            strokeWidth={2.3}
          />
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

export default function MyPropertiesSection() {
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
  const [properties, setProperties] = React.useState<Record<string, unknown>[]>([]);
  const [invoices, setInvoices] = React.useState<Record<string, unknown>[]>([]);
  const [updatedAt, setUpdatedAt] = React.useState('');

  const runLoad = React.useCallback(
    async (isRefresh: boolean) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        setError(null);

        const [propertiesResponse, invoicesResponse] = await Promise.all([
          residentPropertiesAPI.getAll(),
          propertyId !== null
            ? residentInvoicesAPI.getByProperty(propertyId)
            : residentInvoicesAPI.getAll(),
        ]);

        const propertiesList = extractList(propertiesResponse).map(item => toRecord(item));
        const invoicesList = extractList(invoicesResponse).map(item => toRecord(item));

        setProperties(propertiesList);
        setInvoices(invoicesList);
        setUpdatedAt(formatDate(new Date().toISOString()));
      } catch (loadError) {
        setProperties([]);
        setInvoices([]);

        if (loadError instanceof Error && loadError.message) {
          setError(loadError.message);
        } else {
          setError('Mənzil məlumatları yüklənmədi');
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
    runLoad(false);
  }, [runLoad]);

  const selectedProperty = React.useMemo(() => {
    if (!properties.length) {
      return null;
    }

    if (propertyId !== null) {
      const matched = properties.find(item => asString(item.id) === asString(propertyId));
      if (matched) {
        return matched;
      }
    }

    return properties[0];
  }, [properties, propertyId]);

  const detailRows = React.useMemo(() => {
    if (!selectedProperty) {
      return [] as Array<{ label: string; value: string }>;
    }

    const subData = toRecord(selectedProperty.sub_data);
    const mtk = toRecord(subData.mtk);
    const complex = toRecord(subData.complex);
    const building = toRecord(subData.building);
    const block = toRecord(subData.block);
    const meta = toRecord(selectedProperty.meta);

    const floorText = pickText(meta.floor, selectedProperty.floor);
    const areaText = pickText(meta.area, selectedProperty.area);

    const rows: Array<{ label: string; value: string }> = [
      { label: 'MTK', value: pickText(mtk.name, '-') || '-' },
      { label: 'Kompleks', value: pickText(complex.name, '-') || '-' },
      { label: 'Bina', value: pickText(building.name, '-') || '-' },
      { label: 'Blok', value: pickText(block.name, '-') || '-' },
      {
        label: 'Mərtəbə',
        value: floorText ? `${floorText}-ci mərtəbə` : '-',
      },
    ];

    if (areaText) {
      rows.push({ label: 'Sahə', value: `${areaText} m²` });
    }

    return rows;
  }, [selectedProperty]);

  const unpaidInvoices = React.useMemo(
    () => invoices.filter(item => {
      const normalized = normalizeInvoiceStatus(item.status);
      return normalized === 'unpaid' || normalized === 'not_paid' || normalized === 'overdue';
    }),
    [invoices],
  );

  const totalDebt = React.useMemo(
    () => unpaidInvoices.reduce((sum, item) => {
      const amount = asNumber(item.amount);
      const amountPaid = asNumber(item.amount_paid);
      return sum + Math.max(0, amount - amountPaid);
    }, 0),
    [unpaidInvoices],
  );

  const pageTitle = pickText(
    selectedPropertyName,
    selectedProperty?.name,
    selectedProperty?.title,
    selectedProperty?.meta,
    'Mənzil seçilməyib',
  );

  const propertyStatus = normalizeInvoiceStatus(selectedProperty?.status);
  const propertyStatusLabel = propertyStatus === 'active' ? 'Aktiv' : 'Qeyri-aktiv';

  const topMetrics = [
    {
      title: 'Status',
      value: propertyStatusLabel,
      note: 'Seçilən mənzilin vəziyyəti',
      icon: Home,
    },
    {
      title: 'Cəmi faktura',
      value: String(invoices.length),
      note: 'Bu mənzil üçün',
      icon: FileText,
    },
    {
      title: 'Ödənilməmiş',
      value: String(unpaidInvoices.length),
      note: 'Aktiv borc qeydləri',
      icon: Layers3,
    },
    {
      title: 'Borc',
      value: formatCurrency(totalDebt),
      note: 'Qalıq ödəniş',
      icon: CircleDollarSign,
    },
  ];

  return (
    <AppPageLayout
      title="Mənzilim"
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
        style={[
          styles.hero,
          isDark ? styles.heroBorderDark : styles.heroBorderLight,
        ]}
      >
        <Text style={[styles.heroTitle, isDark ? styles.heroTitleDark : styles.heroTitleLight]}>
          Mənzilim
        </Text>
        <Text style={[styles.heroSubtitle, isDark ? styles.heroSubtitleDark : styles.heroSubtitleLight]}>
          Dashboard panel üslubunda seçilmiş mənzil məlumatları
        </Text>

        <View style={styles.heroBottom}>
          <View style={styles.heroStatMain}>
            <Text
              style={[
                styles.heroStatMainLabel,
                isDark ? styles.heroStatMainLabelDark : styles.heroStatMainLabelLight,
              ]}
            >
              Aktiv mənzil
            </Text>
            <Text
              style={[
                styles.heroStatMainValue,
                isDark ? styles.heroStatMainValueDark : styles.heroStatMainValueLight,
              ]}
            >
              {pageTitle}
            </Text>
          </View>

          <View style={styles.heroMetaRow}>
            <Text style={[styles.metaText, isDark ? styles.metaTextDark : styles.metaTextLight]}>
              Son yenilənmə: {updatedAt || '-'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => runLoad(true)}
          style={[
            styles.refreshButton,
            isDark ? styles.refreshButtonDark : styles.refreshButtonLight,
          ]}
          disabled={refreshing || loading}
        >
          <Text
            style={[
              styles.refreshButtonText,
              isDark ? styles.refreshButtonTextDark : styles.refreshButtonTextLight,
            ]}
          >
            {refreshing ? 'Yenilənir...' : 'Yenilə'}
          </Text>
        </Pressable>
      </LinearGradient>

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

      {!loading && !error && !selectedProperty ? (
        <View style={styles.centerWrap}>
          <Text style={[styles.emptyText, isDark ? styles.emptyTextDark : styles.emptyTextLight]}>
            Mənzil məlumatı tapılmadı
          </Text>
        </View>
      ) : null}

      {!loading && !error && selectedProperty ? (
        <View style={styles.contentWrap}>
          <View style={styles.metricGrid}>
            {topMetrics.map(metric => (
              <MetricCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                note={metric.note}
                icon={metric.icon}
                isDark={isDark}
              />
            ))}
          </View>

          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <SectionTitle
              title="Mənzil məlumatları"
              subtitle="Kompleks, bina və blok məlumatları"
              icon={Building2}
              isDark={isDark}
            />

            <View style={styles.detailsGrid}>
              {detailRows.map(row => (
                <View
                  key={row.label}
                  style={[styles.detailRow, isDark ? styles.detailRowDark : styles.detailRowLight]}
                >
                  <Text style={[styles.detailLabel, isDark ? styles.detailLabelDark : styles.detailLabelLight]}>
                    {row.label}
                  </Text>
                  <Text style={[styles.detailValue, isDark ? styles.detailValueDark : styles.detailValueLight]}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <SectionTitle
              title="Faktura xülasəsi"
              subtitle="Ödəniş göstəricilərinin ümumi icmalı"
              icon={CircleDollarSign}
              isDark={isDark}
            />

            <View
              style={[
                styles.summaryRow,
                isDark ? styles.summaryRowDark : styles.summaryRowLight,
              ]}
            >
              <Text style={[styles.summaryLabel, isDark ? styles.summaryLabelDark : styles.summaryLabelLight]}>
                Cəmi faktura
              </Text>
              <Text style={[styles.summaryValue, isDark ? styles.summaryValueDark : styles.summaryValueLight]}>
                {invoices.length}
              </Text>
            </View>

            <View
              style={[
                styles.summaryRow,
                isDark ? styles.summaryRowDark : styles.summaryRowLight,
              ]}
            >
              <Text style={[styles.summaryLabel, isDark ? styles.summaryLabelDark : styles.summaryLabelLight]}>
                Ödənilməmiş
              </Text>
              <Text style={[styles.summaryValue, isDark ? styles.summaryValueDark : styles.summaryValueLight]}>
                {unpaidInvoices.length}
              </Text>
            </View>

            <View
              style={[
                styles.summaryRow,
                isDark ? styles.summaryRowDark : styles.summaryRowLight,
              ]}
            >
              <Text style={[styles.summaryLabel, isDark ? styles.summaryLabelDark : styles.summaryLabelLight]}>
                Borc
              </Text>
              <Text style={[styles.summaryValue, isDark ? styles.summaryValueDark : styles.summaryValueLight]}>
                {formatCurrency(totalDebt)}
              </Text>
            </View>
          </View>

          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <SectionTitle
              title="Son fakturalar"
              subtitle="Ən son əməliyyatların qısa siyahısı"
              icon={FileText}
              isDark={isDark}
            />

            {invoices.length === 0 ? (
              <Text style={[styles.emptyText, isDark ? styles.emptyTextDark : styles.emptyTextLight]}>
                Bu mənzil üçün faktura tapılmadı
              </Text>
            ) : (
              <View style={styles.invoiceList}>
                {invoices.slice(0, 6).map((invoice, index) => {
                  const invoiceId = pickText(invoice.id, `invoice-${index + 1}`);
                  const serviceName = pickText(
                    toRecord(invoice.service).name,
                    invoice.title,
                    'Xidmət',
                  );
                  const status = normalizeInvoiceStatus(invoice.status);

                  return (
                    <View
                      key={invoiceId}
                      style={[styles.invoiceRow, isDark ? styles.invoiceRowDark : styles.invoiceRowLight]}
                    >
                      <View style={styles.invoiceLeft}>
                        <Text style={[styles.invoiceTitle, isDark ? styles.invoiceTitleDark : styles.invoiceTitleLight]}>
                          {serviceName}
                        </Text>
                        <Text style={[styles.invoiceMeta, isDark ? styles.invoiceMetaDark : styles.invoiceMetaLight]}>
                          #{invoiceId} • {formatDate(invoice.due_date)}
                        </Text>
                      </View>
                      <View style={styles.invoiceRight}>
                        <Text style={[styles.invoiceAmount, isDark ? styles.invoiceAmountDark : styles.invoiceAmountLight]}>
                          {formatCurrency(invoice.amount)}
                        </Text>
                        <Text style={[styles.invoiceStatus, isDark ? styles.invoiceStatusDark : styles.invoiceStatusLight]}>
                          {invoiceStatusLabel(status)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
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
  heroBorderLight: {
    borderColor: '#bfdbfe',
  },
  heroBorderDark: {
    borderColor: 'rgba(59,130,246,0.22)',
  },
  heroTitle: {
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
  },
  heroSubtitleLight: {
    color: '#334155',
  },
  heroSubtitleDark: {
    color: '#cbd5e1',
  },
  heroBottom: {
    marginTop: 20,
    gap: 12,
  },
  heroStatMain: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.10)',
    padding: 16,
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
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'WorkSans-Bold',
  },
  heroStatMainValueLight: {
    color: '#0f172a',
  },
  heroStatMainValueDark: {
    color: '#ffffff',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Regular',
  },
  metaTextLight: {
    color: '#64748b',
  },
  metaTextDark: {
    color: '#94a3b8',
  },
  refreshButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  refreshButtonLight: {
    borderColor: '#dbeafe',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  refreshButtonDark: {
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  refreshButtonText: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  refreshButtonTextLight: {
    color: '#1e3a8a',
  },
  refreshButtonTextDark: {
    color: '#dbeafe',
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
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
  contentWrap: {
    gap: 10,
    paddingBottom: 12,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricCard: {
    width: '48.5%',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
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
    marginTop: 14,
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
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  cardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
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
    fontSize: 16,
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
    width: 34,
    height: 34,
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
  detailsGrid: {
    gap: 8,
  },
  detailRow: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  detailRowLight: {
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  detailRowDark: {
    borderColor: '#334155',
    backgroundColor: '#111827',
  },
  detailLabel: {
    fontSize: 12,
  },
  detailLabelLight: {
    color: '#64748b',
  },
  detailLabelDark: {
    color: '#94a3b8',
  },
  detailValue: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '600',
  },
  detailValueLight: {
    color: '#0f172a',
  },
  detailValueDark: {
    color: '#f8fafc',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  summaryRowLight: {
    borderBottomColor: '#dbeafe',
  },
  summaryRowDark: {
    borderBottomColor: '#1e3a8a',
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: 'WorkSans-Regular',
  },
  summaryLabelLight: {
    color: '#475569',
  },
  summaryLabelDark: {
    color: '#cbd5e1',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'WorkSans-Bold',
  },
  summaryValueLight: {
    color: '#0f172a',
  },
  summaryValueDark: {
    color: '#f8fafc',
  },
  invoiceList: {
    gap: 8,
  },
  invoiceRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  invoiceRowLight: {
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  invoiceRowDark: {
    borderColor: '#334155',
    backgroundColor: '#111827',
  },
  invoiceLeft: {
    flex: 1,
  },
  invoiceRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: 'WorkSans-SemiBold',
  },
  invoiceTitleLight: {
    color: '#0f172a',
  },
  invoiceTitleDark: {
    color: '#f8fafc',
  },
  invoiceMeta: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'WorkSans-Regular',
  },
  invoiceMetaLight: {
    color: '#64748b',
  },
  invoiceMetaDark: {
    color: '#94a3b8',
  },
  invoiceAmount: {
    fontSize: 14,
    fontFamily: 'WorkSans-Bold',
  },
  invoiceAmountLight: {
    color: '#14532d',
  },
  invoiceAmountDark: {
    color: '#86efac',
  },
  invoiceStatus: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  invoiceStatusLight: {
    color: '#475569',
  },
  invoiceStatusDark: {
    color: '#cbd5e1',
  },
});
