import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
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

type QuickAction = {
  key: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  routeKey: string;
  accent: string;
};

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  amountText: string;
  positive: boolean;
};

const invoiceStatusLabel = (status: string): string => {
  if (status === 'paid') return 'Odenilib';
  if (status === 'overdue') return 'Vaxti kecib';
  if (status === 'unpaid' || status === 'not_paid') return 'Odenilmeyib';
  return 'Namelum';
};

const normalizeInvoiceStatus = (value: unknown): string =>
  asString(value).trim().toLowerCase();

const normalizeHexColor = (value: unknown): string | null => {
  const raw = asString(value).trim();
  if (!raw) return null;

  const match = raw.match(/^#?([\da-f]{3}|[\da-f]{6})$/i);
  if (!match) return null;

  const hex = match[1];
  if (hex.length === 3) {
    const [r, g, b] = hex.split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return `#${hex}`.toLowerCase();
};

const blendHex = (base: string, mixWith: string, mixRatio: number): string => {
  const safeRatio = Math.max(0, Math.min(1, mixRatio));
  const from = base.replace('#', '');
  const to = mixWith.replace('#', '');

  const mixChannel = (start: number, end: number): number =>
    Math.round(start + (end - start) * safeRatio);

  const r = mixChannel(parseInt(from.slice(0, 2), 16), parseInt(to.slice(0, 2), 16));
  const g = mixChannel(parseInt(from.slice(2, 4), 16), parseInt(to.slice(2, 4), 16));
  const b = mixChannel(parseInt(from.slice(4, 6), 16), parseInt(to.slice(4, 6), 16));

  const toHex = (value: number): string => value.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const buildCardGradient = (baseHex: string, isDark: boolean): string[] => {
  if (isDark) {
    return [
      blendHex(baseHex, '#070707', 0.54),
      blendHex(baseHex, '#070707', 0.32),
      blendHex(baseHex, '#ffffff', 0.08),
    ];
  }

  return [
    blendHex(baseHex, '#ffffff', 0.16),
    blendHex(baseHex, '#000000', 0.14),
    blendHex(baseHex, '#000000', 0.28),
  ];
};

export default function MyPropertiesSection() {
  const navigation = useNavigation<any>();
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

        setProperties(extractList(propertiesResponse).map(item => toRecord(item)));
        setInvoices(extractList(invoicesResponse).map(item => toRecord(item)));
      } catch (loadError) {
        setProperties([]);
        setInvoices([]);

        if (loadError instanceof Error && loadError.message) {
          setError(loadError.message);
        } else {
          setError('Menzil melumatlari yuklenmedi');
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
    if (!properties.length) return null;

    if (propertyId !== null) {
      const matched = properties.find(item => asString(item.id) === asString(propertyId));
      if (matched) return matched;
    }

    return properties[0];
  }, [properties, propertyId]);

  const unpaidInvoices = React.useMemo(
    () =>
      invoices.filter(item => {
        const normalized = normalizeInvoiceStatus(item.status);
        return normalized === 'unpaid' || normalized === 'not_paid' || normalized === 'overdue';
      }),
    [invoices],
  );

  const totalDebt = React.useMemo(
    () =>
      unpaidInvoices.reduce((sum, item) => {
        const amount = asNumber(item.amount);
        const amountPaid = asNumber(item.amount_paid);
        return sum + Math.max(0, amount - amountPaid);
      }, 0),
    [unpaidInvoices],
  );

  const totalAmount = React.useMemo(
    () => invoices.reduce((sum, item) => sum + asNumber(item.amount), 0),
    [invoices],
  );

  const totalPaid = React.useMemo(
    () => invoices.reduce((sum, item) => sum + asNumber(item.amount_paid), 0),
    [invoices],
  );

  const totalBalance = Math.max(0, totalAmount - totalDebt);
  const paidPercent = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  const propertyTitle = pickText(
    selectedPropertyName,
    selectedProperty?.name,
    selectedProperty?.title,
    selectedProperty?.meta,
    'Menzil secilmeyib',
  );

  const latestDueDate = React.useMemo(() => {
    if (!invoices.length) return '';

    const sorted = [...invoices].sort((a, b) => {
      const aTime = new Date(asString(a.due_date)).getTime();
      const bTime = new Date(asString(b.due_date)).getTime();
      return Number.isFinite(bTime) ? bTime - (Number.isFinite(aTime) ? aTime : 0) : 0;
    });

    return asString(sorted[0]?.due_date);
  }, [invoices]);

  const propertyMeta = React.useMemo(() => toRecord(selectedProperty?.meta), [selectedProperty]);
  const propertySubData = React.useMemo(() => toRecord(selectedProperty?.sub_data), [selectedProperty]);
  const propertyComplex = React.useMemo(() => toRecord(propertySubData.complex), [propertySubData]);
  const propertyComplexMeta = React.useMemo(() => toRecord(propertyComplex.meta), [propertyComplex]);
  const propertyMtk = React.useMemo(() => toRecord(propertySubData.mtk), [propertySubData]);
  const propertyMtkMeta = React.useMemo(() => toRecord(propertyMtk.meta), [propertyMtk]);

  const complexName = pickText(
    toRecord(propertySubData.complex).name,
    toRecord(propertySubData.mtk).name,
  );
  const buildingName = pickText(toRecord(propertySubData.building).name);
  const blockName = pickText(toRecord(propertySubData.block).name);
  const floorText = pickText(propertyMeta.floor, selectedProperty?.floor, '-');
  const areaRaw = pickText(propertyMeta.area, selectedProperty?.area, '-');
  const areaText = areaRaw && areaRaw !== '-' ? `${areaRaw} m²` : '-';

  const propertyStatus = normalizeInvoiceStatus(selectedProperty?.status);
  const propertyStatusLabel = propertyStatus === 'active' ? 'Aktiv' : 'Qeyri-aktiv';

  const complexColor = React.useMemo(
    () =>
      normalizeHexColor(
        pickText(
          propertyComplexMeta.color_code,
          propertyComplexMeta.colorCode,
          propertyComplex.color_code,
          propertyComplex.colorCode,
          propertyMtkMeta.color_code,
          propertyMtkMeta.colorCode,
          propertyMtk.color_code,
          propertyMtk.colorCode,
          propertyMeta.color_code,
          propertyMeta.colorCode,
          selectedProperty?.color_code,
          selectedProperty?.colorCode,
        ),
      ),
    [
      propertyComplexMeta,
      propertyComplex,
      propertyMtkMeta,
      propertyMtk,
      propertyMeta,
      selectedProperty,
    ],
  );

  const cardGradient = React.useMemo(
    () =>
      complexColor
        ? buildCardGradient(complexColor, isDark)
        : isDark
          ? ['#7f1d1d', '#b91c1c', '#ef4444']
          : ['#fda4af', '#fb7185', '#ef4444'],
    [complexColor, isDark],
  );

  const quickActions: QuickAction[] = [
    {
      key: 'invoices',
      title: 'Fakturalar',
      subtitle: 'Odenis tarixcesi',
      icon: FileText,
      routeKey: 'resident_invoices',
      accent: '#ef4444',
    },
    {
      key: 'services',
      title: 'Xidmetler',
      subtitle: 'Gosterilen servisler',
      icon: Building2,
      routeKey: 'resident_my_services',
      accent: '#f97316',
    },
    {
      key: 'notifications',
      title: 'Bildirisler',
      subtitle: 'Son yenilikler',
      icon: Layers3,
      routeKey: 'resident_notifications',
      accent: '#3b82f6',
    },
    {
      key: 'profile',
      title: 'Profil',
      subtitle: 'Hesab melumatlari',
      icon: Home,
      routeKey: 'resident_profile',
      accent: '#22c55e',
    },
  ];

  const recentActivity: ActivityItem[] = React.useMemo(() => {
    return invoices.slice(0, 6).map((invoice, index) => {
      const invoiceId = pickText(invoice.id, `invoice-${index + 1}`);
      const serviceName = pickText(
        toRecord(invoice.service).name,
        invoice.title,
        'Service payment',
      );
      const status = normalizeInvoiceStatus(invoice.status);
      const amount = asNumber(invoice.amount);
      const amountPaid = asNumber(invoice.amount_paid);

      const positive = status === 'paid';
      const unsignedValue = positive
        ? Math.max(amountPaid, amount)
        : Math.max(0, amount - amountPaid) || amount;

      const amountText = `${positive ? '+' : '-'}${formatCurrency(unsignedValue)}`;

      return {
        id: invoiceId,
        title: serviceName,
        subtitle: `${invoiceStatusLabel(status)}, ${formatDate(
          pickText(invoice.created_at, invoice.due_date),
        )}`,
        amountText,
        positive,
      };
    });
  }, [invoices]);

  const palette = isDark
    ? {
      bg: '#060607',
      balanceLabel: '#8f9098',
      balanceValue: '#f3f4f6',
      deltaBg: 'rgba(239, 68, 68, 0.22)',
      deltaText: '#fca5a5',
      sectionLabel: '#8f9098',
      sectionAction: '#f87171',
      cardGradient,
      cardBrand: '#ffe4e6',
      cardNumber: '#ffffff',
      cardMeta: '#fecaca',
      cardMetaStrong: '#ffffff',
      actionCardBg: '#131317',
      actionCardBorder: '#25252c',
      actionTitle: '#f3f4f6',
      activityCardBg: '#141419',
      activityCardBorder: '#272730',
      activityTitle: '#f4f4f5',
      activityMeta: '#9697a8',
      amountPositive: '#fb7185',
      amountNegative: '#fda4af',
      empty: '#a1a1aa',
    }
    : {
      bg: '#fff6f6',
      balanceLabel: '#7f1d1d',
      balanceValue: '#2a0a0a',
      deltaBg: '#fee2e2',
      deltaText: '#b91c1c',
      sectionLabel: '#9f1239',
      sectionAction: '#be123c',
      cardGradient,
      cardBrand: '#fff1f2',
      cardNumber: '#ffffff',
      cardMeta: '#ffe4e6',
      cardMetaStrong: '#ffffff',
      actionCardBg: '#ffffff',
      actionCardBorder: '#fecaca',
      actionTitle: '#3f0a0a',
      activityCardBg: '#ffffff',
      activityCardBorder: '#fecaca',
      activityTitle: '#3f0a0a',
      activityMeta: '#881337',
      amountPositive: '#be123c',
      amountNegative: '#e11d48',
      empty: '#9f1239',
    };

  return (
    <AppPageLayout
      title="Menzilim"
      isDark={isDark}
      scrollable
      settingsRouteKey="resident_settings"
      profileRouteKey="resident_profile"
      devicesRouteKey="resident_my_devices"
      notificationsRouteKey="resident_notifications"
      mtkOptions={propertyOptions.map(option => option.name)}
      initialMtk={selectedPropertyName}
      onMtkChange={onPropertyChange}
      contentStyle={{ backgroundColor: palette.bg }}
      contentContainerStyle={styles.pageContent}
    >
      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={isDark ? '#f87171' : '#be123c'} />
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.centerWrap}>
          <Text style={[styles.errorText, { color: '#dc2626' }]}>{error}</Text>
        </View>
      ) : null}

      {!loading && !error && !selectedProperty ? (
        <View style={styles.centerWrap}>
          <Text style={[styles.emptyText, { color: palette.empty }]}>Menzil melumati tapilmadi</Text>
        </View>
      ) : null}

      {!loading && !error && selectedProperty ? (
        <View style={styles.screenStack}>
          <View style={styles.balanceBlock}>
            <Text style={[styles.balanceLabel, { color: palette.balanceLabel }]}>UMUMI BALANS</Text>
            <View style={styles.balanceRow}>
              <CircleDollarSign size={20} color={palette.balanceValue} strokeWidth={2.2} />
              <Text style={[styles.balanceValue, { color: palette.balanceValue }]}>{formatCurrency(totalBalance)}</Text>
              <View style={[styles.deltaPill, { backgroundColor: palette.deltaBg }]}>
                <Text style={[styles.deltaText, { color: palette.deltaText }]}>+{paidPercent}%</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: palette.sectionLabel }]}>MENZILIM</Text>
            <Pressable onPress={() => navigation.navigate('resident_invoices')}>
              <Text style={[styles.sectionAction, { color: palette.sectionAction }]}>Etrafli</Text>
            </Pressable>
          </View>

          <LinearGradient
            colors={palette.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.propertyCard}
          >
            <View style={styles.propertyTopRow}>
              <View style={styles.propertyHeaderLeft}>
                <View style={styles.propertyIconBubble}>
                  <Home size={18} color="#fff" strokeWidth={2.5} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.propertyHeaderLabel, { color: palette.cardMeta }]}>Menzil karti</Text>
                  <Text numberOfLines={1} style={[styles.propertyName, { color: palette.cardMetaStrong }]}>
                    {propertyTitle}
                  </Text>
                </View>
              </View>

              <View style={styles.propertyStatusPill}>
                <Text style={[styles.propertyStatusPillText, { color: palette.cardMetaStrong }]}>
                  {propertyStatusLabel}
                </Text>
              </View>
            </View>

            <Text numberOfLines={1} style={[styles.propertyHint, { color: palette.cardBrand }]}>
              {pickText(complexName, buildingName, blockName, 'Secilmis menzil')}
            </Text>

            <View style={styles.propertyComplexRow}>
              <View
                style={[
                  styles.propertyComplexDot,
                  { backgroundColor: complexColor ?? 'rgba(255,255,255,0.75)' },
                ]}
              />
              <Text numberOfLines={1} style={[styles.propertyComplexText, { color: palette.cardMeta }]}> 
                {pickText(complexName, 'Kompleks melum deyil')}
              </Text>
            </View>

            <View style={styles.propertyBadgeRow}>
              <View style={styles.propertyBadge}>
                <Text style={[styles.propertyBadgeText, { color: palette.cardMetaStrong }]}>Mertebe: {floorText}</Text>
              </View>

              <View style={styles.propertyBadge}>
                <Text style={[styles.propertyBadgeText, { color: palette.cardMetaStrong }]}>Sahe: {areaText}</Text>
              </View>
            </View>

            <View style={styles.propertyStatsRow}>
              <View style={styles.propertyStatItem}>
                <Text style={[styles.propertyStatLabel, { color: palette.cardMeta }]}>Odenilmemis</Text>
                <Text style={[styles.propertyStatValue, { color: palette.cardMetaStrong }]}>{unpaidInvoices.length}</Text>
              </View>

              <View style={styles.propertyStatItem}>
                <Text style={[styles.propertyStatLabel, { color: palette.cardMeta }]}>Novbeti odenis</Text>
                <Text style={[styles.propertyStatValue, { color: palette.cardMetaStrong }]}>
                  {latestDueDate ? formatDate(latestDueDate) : '-'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.quickGrid}>
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <Pressable
                  key={action.key}
                  onPress={() => navigation.navigate(action.routeKey)}
                  style={({ pressed }) => [
                    styles.quickCard,
                    {
                      backgroundColor: palette.actionCardBg,
                      borderColor: palette.actionCardBorder,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View style={[styles.quickCardAccent, { backgroundColor: action.accent }]} />

                  <View style={styles.quickCardBody}>
                    <View style={styles.quickCardTop}>
                      <View style={[styles.quickIconCircle, { backgroundColor: action.accent }]}>
                        <Icon size={17} color="#fff" strokeWidth={2.3} />
                      </View>

                    </View>

                    <Text numberOfLines={1} style={[styles.quickTitle, { color: palette.actionTitle }]}>{action.title}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sectionRowWithSpacing}>
            <Text style={[styles.sectionLabel, { color: palette.sectionLabel }]}>SON EMEKLIYYATLAR</Text>
            <Pressable onPress={() => navigation.navigate('resident_invoices')}>
              <Text style={[styles.sectionAction, { color: palette.sectionAction }]}>Hamisi</Text>
            </Pressable>
          </View>

          <View style={styles.activityList}>
            {recentActivity.length === 0 ? (
              <View style={[styles.activityCard, { backgroundColor: palette.activityCardBg, borderColor: palette.activityCardBorder }]}>
                <Text style={[styles.activityTitle, { color: palette.activityTitle }]}>Son emeliyyat yoxdur</Text>
              </View>
            ) : (
              recentActivity.map(item => (
                <View
                  key={item.id}
                  style={[
                    styles.activityCard,
                    { backgroundColor: palette.activityCardBg, borderColor: palette.activityCardBorder },
                  ]}
                >
                  <View style={styles.activityIconWrap}>
                    <View
                      style={[
                        styles.activityIcon,
                        { backgroundColor: item.positive ? '#ef4444' : '#fb7185' },
                      ]}
                    >
                      <Text style={styles.activityIconText}>{item.positive ? '+' : '-'}</Text>
                    </View>
                  </View>

                  <View style={styles.activityCenter}>
                    <Text numberOfLines={1} style={[styles.activityTitle, { color: palette.activityTitle }]}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={1} style={[styles.activityMeta, { color: palette.activityMeta }]}>
                      {item.subtitle}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.activityAmount,
                      { color: item.positive ? palette.amountPositive : palette.amountNegative },
                    ]}
                  >
                    {item.amountText}
                  </Text>
                </View>
              ))
            )}
          </View>

          <Pressable
            onPress={() => runLoad(true)}
            style={({ pressed }) => [
              styles.refreshButton,
              {
                borderColor: palette.actionCardBorder,
                backgroundColor: palette.actionCardBg,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
            disabled={refreshing || loading}
          >
            <Text style={[styles.refreshButtonText, { color: palette.actionTitle }]}>
              {refreshing ? 'Yenilenir...' : 'Yenile'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </AppPageLayout>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    paddingBottom: 18,
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  screenStack: {
    gap: 14,
  },
  balanceBlock: {
    paddingTop: 4,
  },
  balanceLabel: {
    fontSize: 12,
    letterSpacing: 1.4,
    fontFamily: 'WorkSans-SemiBold',
  },
  balanceRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceValue: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: 'WorkSans-Bold',
  },
  deltaPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deltaText: {
    fontSize: 14,
    fontFamily: 'WorkSans-Bold',
  },
  sectionRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionRowWithSpacing: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1.6,
    fontFamily: 'WorkSans-SemiBold',
  },
  sectionAction: {
    fontSize: 14,
    fontFamily: 'WorkSans-SemiBold',
  },
  propertyCard: {
    borderRadius: 28,
    padding: 18,
    gap: 18,
  },
  propertyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  propertyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  propertyIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  propertyStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  propertyStatusPillText: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  propertyHeaderLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: 'WorkSans-SemiBold',
  },
  propertyName: {
    marginTop: 2,
    fontSize: 18,
    fontFamily: 'WorkSans-Bold',
  },
  propertyHint: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'WorkSans-Regular',
  },
  propertyComplexRow: {
    marginTop: -4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  propertyComplexDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  propertyComplexText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  propertyBadgeRow: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  propertyBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  propertyBadgeText: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  propertyStatsRow: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 10,
  },
  propertyStatItem: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  propertyStatLabel: {
    fontSize: 11,
    fontFamily: 'WorkSans-Regular',
  },
  propertyStatValue: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickCard: {
    width: '24%',
    minHeight: 94,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  quickCardAccent: {
    height: 4,
    width: '100%',
  },
  quickCardBody: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'WorkSans-SemiBold',
    textAlign: 'center',
  },
  quickSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'WorkSans-Regular',
  },
  activityList: {
    gap: 10,
  },
  activityCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIconWrap: {
    width: 42,
    alignItems: 'center',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconText: {
    color: '#fff',
    fontSize: 19,
    fontFamily: 'WorkSans-Bold',
  },
  activityCenter: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'WorkSans-SemiBold',
  },
  activityMeta: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: 'WorkSans-Regular',
  },
  activityAmount: {
    fontSize: 18,
    fontFamily: 'WorkSans-Bold',
  },
  refreshButton: {
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  refreshButtonText: {
    fontSize: 14,
    fontFamily: 'WorkSans-SemiBold',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'WorkSans-SemiBold',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'WorkSans-Medium',
  },
});
