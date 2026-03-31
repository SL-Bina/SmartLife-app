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
  Bell,
  CircleDollarSign,
  FileText,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import AppPageLayout from '../../../components/common/app-page-layout';
import LinearGradient from '../../../components/common/safe-linear-gradient';
import { useThemeMode } from '../../../hooks/use-theme';
import {
  residentInvoicesAPI,
  residentNotificationsAPI,
  residentServicesAPI,
  residentTicketsAPI,
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

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  status: string;
  tone: 'info' | 'warning' | 'success';
};

const normalizeStatus = (value: unknown): string => asString(value).trim().toLowerCase();

const isOpenTicket = (status: string): boolean => {
  return !['closed', 'resolved', 'done'].includes(status);
};

const isUnpaidInvoice = (status: string): boolean => {
  return ['unpaid', 'not_paid', 'overdue'].includes(status);
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
    <View
      style={[
        styles.metricCard,
        isDark ? styles.metricCardDark : styles.metricCardLight,
      ]}
    >
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

function QuickAction({
  label,
  onPress,
  isDark,
}: {
  label: string;
  onPress: () => void;
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.quickAction,
        isDark ? styles.quickActionDark : styles.quickActionLight,
      ]}
    >
      <Text
        style={[
          styles.quickActionText,
          isDark ? styles.quickActionTextDark : styles.quickActionTextLight,
        ]}
      >
        {label}
      </Text>
      <ArrowRight
        size={14}
        color={isDark ? '#cbd5e1' : '#334155'}
        strokeWidth={2.4}
      />
    </Pressable>
  );
}

function ActivityRow({
  item,
  isDark,
}: {
  item: ActivityItem;
  isDark: boolean;
}) {
  const toneStyle =
    item.tone === 'warning'
      ? styles.activityToneWarning
      : item.tone === 'success'
        ? styles.activityToneSuccess
        : styles.activityToneInfo;

  return (
    <View
      style={[
        styles.activityRow,
        isDark ? styles.activityRowDark : styles.activityRowLight,
      ]}
    >
      <View style={styles.activityContent}>
        <Text
          style={[
            styles.activityTitle,
            isDark ? styles.activityTitleDark : styles.activityTitleLight,
          ]}
        >
          {item.title}
        </Text>
        <Text
          numberOfLines={2}
          style={[
            styles.activitySubtitle,
            isDark ? styles.activitySubtitleDark : styles.activitySubtitleLight,
          ]}
        >
          {item.subtitle}
        </Text>
        <Text
          style={[
            styles.activityDate,
            isDark ? styles.activityDateDark : styles.activityDateLight,
          ]}
        >
          {item.date}
        </Text>
      </View>

      <View style={[styles.activityStatusPill, toneStyle]}>
        <Text style={styles.activityStatusText}>{item.status || '-'}</Text>
      </View>
    </View>
  );
}

export default function ResidentHomeScreen() {
  const { resolvedTheme } = useThemeMode();
  const {
    propertyId,
    propertyOptions,
    selectedPropertyName,
    onPropertyChange,
  } = useResidentPropertySelector();
  const navigation = useNavigation<any>();
  const isDark = resolvedTheme === 'dark';

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = React.useState('');

  const [invoices, setInvoices] = React.useState<Record<string, unknown>[]>([]);
  const [notifications, setNotifications] = React.useState<Record<string, unknown>[]>([]);
  const [tickets, setTickets] = React.useState<Record<string, unknown>[]>([]);
  const [services, setServices] = React.useState<Record<string, unknown>[]>([]);

  const runLoad = React.useCallback(
    async (isRefresh: boolean) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        setError(null);
        const params = propertyId ? { property_id: propertyId } : {};

        const [invoicesResult, notificationsResult, ticketsResult, servicesResult] =
          await Promise.allSettled([
            propertyId
              ? residentInvoicesAPI.getByProperty(propertyId)
              : residentInvoicesAPI.getAll(),
            residentNotificationsAPI.getAll(params),
            residentTicketsAPI.getAll(params),
            residentServicesAPI.getAll(params),
          ]);

        const nextInvoices =
          invoicesResult.status === 'fulfilled'
            ? extractList(invoicesResult.value).map(value => toRecord(value))
            : [];
        const nextNotifications =
          notificationsResult.status === 'fulfilled'
            ? extractList(notificationsResult.value).map(value => toRecord(value))
            : [];
        const nextTickets =
          ticketsResult.status === 'fulfilled'
            ? extractList(ticketsResult.value).map(value => toRecord(value))
            : [];
        const nextServices =
          servicesResult.status === 'fulfilled'
            ? extractList(servicesResult.value).map(value => toRecord(value))
            : [];

        setInvoices(nextInvoices);
        setNotifications(nextNotifications);
        setTickets(nextTickets);
        setServices(nextServices);
        setUpdatedAt(formatDate(new Date().toISOString()));
      } catch (loadError) {
        setInvoices([]);
        setNotifications([]);
        setTickets([]);
        setServices([]);

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
    [propertyId],
  );

  React.useEffect(() => {
    runLoad(false);
  }, [runLoad]);

  const unpaidInvoices = React.useMemo(
    () => invoices.filter(item => isUnpaidInvoice(normalizeStatus(item.status))),
    [invoices],
  );

  const totalDebt = React.useMemo(
    () => unpaidInvoices.reduce((sum, item) => {
      const amount = asNumber(item.amount);
      const paid = asNumber(item.amount_paid);
      return sum + Math.max(0, amount - paid);
    }, 0),
    [unpaidInvoices],
  );

  const unreadNotifications = React.useMemo(
    () => notifications.filter(item => {
      const status = normalizeStatus(item.status);
      return status === 'unread' || status === 'new' || status === 'pending';
    }),
    [notifications],
  );

  const openTickets = React.useMemo(
    () => tickets.filter(item => isOpenTicket(normalizeStatus(item.status))),
    [tickets],
  );

  const activeServices = React.useMemo(
    () => services.filter(item => {
      const status = normalizeStatus(item.status);
      return status === 'active' || status === 'in_progress' || status === 'processing';
    }),
    [services],
  );

  const activityItems = React.useMemo<ActivityItem[]>(() => {
    const invoiceFeed: ActivityItem[] = invoices.slice(0, 3).map((item, index) => {
      const status = normalizeStatus(item.status);
      return {
        id: pickText(item.id, `feed-invoice-${index + 1}`),
        title: `Faktura: ${pickText(item.service_name, item.name, `#${index + 1}`)}`,
        subtitle: pickText(item.description, item.note, 'Faktura yenilənib'),
        date: formatDate(item.created_at),
        status: status || '-',
        tone: isUnpaidInvoice(status) ? 'warning' : 'success',
      };
    });

    const notificationFeed: ActivityItem[] = notifications.slice(0, 2).map((item, index) => {
      const status = normalizeStatus(item.status);
      return {
        id: pickText(item.id, `feed-notification-${index + 1}`),
        title: `Bildiriş: ${pickText(item.title, `#${index + 1}`)}`,
        subtitle: pickText(item.message, item.body, 'Yeni bildiriş'),
        date: formatDate(item.created_at),
        status: status || '-',
        tone: 'info',
      };
    });

    const ticketFeed: ActivityItem[] = tickets.slice(0, 2).map((item, index) => {
      const status = normalizeStatus(item.status);
      return {
        id: pickText(item.id, `feed-ticket-${index + 1}`),
        title: `Müraciət: ${pickText(item.title, item.ticket_number, `#${index + 1}`)}`,
        subtitle: pickText(item.description, item.category, 'Müraciət yenilənib'),
        date: formatDate(item.created_at),
        status: status || '-',
        tone: isOpenTicket(status) ? 'warning' : 'success',
      };
    });

    return [...invoiceFeed, ...notificationFeed, ...ticketFeed];
  }, [invoices, notifications, tickets]);

  const metrics = [
    {
      title: 'Borc',
      value: formatCurrency(totalDebt),
      note: `${unpaidInvoices.length} ödənilməmiş faktura`,
      icon: CircleDollarSign,
    },
    {
      title: 'Bildirişlər',
      value: String(unreadNotifications.length),
      note: 'Oxunmamış bildiriş',
      icon: Bell,
    },
    {
      title: 'Müraciətlər',
      value: String(openTickets.length),
      note: 'Açıq ticket sayı',
      icon: Ticket,
    },
    {
      title: 'Xidmətlər',
      value: String(activeServices.length),
      note: 'Aktiv xidmətlər',
      icon: Wrench,
    },
  ];

  return (
    <AppPageLayout
      title="Ana səhifə"
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
              Resident Home
            </Text>
          </View>

          <Pressable
            onPress={() => navigation.navigate('resident_complex_dashboard')}
            style={[styles.heroLink, isDark ? styles.heroLinkDark : styles.heroLinkLight]}
          >
            <ShieldCheck size={14} color={isDark ? '#cbd5e1' : '#1e3a8a'} strokeWidth={2.4} />
            <Text style={[styles.heroLinkText, isDark ? styles.heroLinkTextDark : styles.heroLinkTextLight]}>
              Kompleks
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.heroTitle, isDark ? styles.heroTitleDark : styles.heroTitleLight]}>
          Xoş gəldin
        </Text>

        <Text style={[styles.heroSubtitle, isDark ? styles.heroSubtitleDark : styles.heroSubtitleLight]}>
          Aktiv mənzil: {selectedPropertyName ?? '-'}
        </Text>

        <View style={styles.heroMainStatWrap}>
          <Text style={[styles.heroMainStatLabel, isDark ? styles.heroMainStatLabelDark : styles.heroMainStatLabelLight]}>
            Cari borc
          </Text>
          <Text style={[styles.heroMainStatValue, isDark ? styles.heroMainStatValueDark : styles.heroMainStatValueLight]}>
            {formatCurrency(totalDebt)}
          </Text>
        </View>

        <View style={styles.heroMetaRow}>
          <Text style={[styles.heroMetaText, isDark ? styles.heroMetaTextDark : styles.heroMetaTextLight]}>
            Son yenilənmə: {updatedAt || '-'}
          </Text>

          <Pressable
            onPress={() => runLoad(true)}
            disabled={loading || refreshing}
            style={[styles.refreshButton, isDark ? styles.refreshButtonDark : styles.refreshButtonLight]}
          >
            <Text style={[styles.refreshButtonText, isDark ? styles.refreshButtonTextDark : styles.refreshButtonTextLight]}>
              {refreshing ? 'Yenilənir...' : 'Yenilə'}
            </Text>
          </Pressable>
        </View>
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

      {!loading && !error ? (
        <View style={styles.contentWrap}>
          <View style={styles.metricGrid}>
            {metrics.map(metric => (
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
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : styles.cardTitleLight]}>
                Sürətli keçidlər
              </Text>
              <ArrowRight size={16} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.4} />
            </View>

            <View style={styles.quickActionWrap}>
              <QuickAction
                label="Fakturalarım"
                onPress={() => navigation.navigate('resident_invoices')}
                isDark={isDark}
              />
              <QuickAction
                label="Mənzilim"
                onPress={() => navigation.navigate('resident_my_properties')}
                isDark={isDark}
              />
              <QuickAction
                label="Xidmətlərim"
                onPress={() => navigation.navigate('resident_my_services')}
                isDark={isDark}
              />
              <QuickAction
                label="Müraciətlər"
                onPress={() => navigation.navigate('resident_tickets')}
                isDark={isDark}
              />
              <QuickAction
                label="Bildirişlər"
                onPress={() => navigation.navigate('resident_notifications')}
                isDark={isDark}
              />
            </View>
          </View>

          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : styles.cardTitleLight]}>
                Son aktivlik
              </Text>
              <FileText size={16} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.3} />
            </View>

            {activityItems.length === 0 ? (
              <Text style={[styles.emptyText, isDark ? styles.emptyTextDark : styles.emptyTextLight]}>
                Hazırda göstəriləcək aktivlik yoxdur
              </Text>
            ) : (
              <View style={styles.activityWrap}>
                {activityItems.slice(0, 8).map(item => (
                  <ActivityRow key={item.id} item={item} isDark={isDark} />
                ))}
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
  heroLink: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroLinkLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
  },
  heroLinkDark: {
    backgroundColor: '#111827',
    borderColor: '#1e3a8a',
  },
  heroLinkText: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  heroLinkTextLight: {
    color: '#1e3a8a',
  },
  heroLinkTextDark: {
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
  heroMetaRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  heroMetaText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'WorkSans-Regular',
  },
  heroMetaTextLight: {
    color: '#64748b',
  },
  heroMetaTextDark: {
    color: '#94a3b8',
  },
  refreshButton: {
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
    fontFamily: 'WorkSans-SemiBold',
  },
  errorTextLight: {
    color: '#b91c1c',
  },
  errorTextDark: {
    color: '#fecaca',
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'WorkSans-Bold',
  },
  cardTitleLight: {
    color: '#0f172a',
  },
  cardTitleDark: {
    color: '#f8fafc',
  },
  quickActionWrap: {
    gap: 8,
  },
  quickAction: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActionLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  quickActionDark: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  quickActionText: {
    fontSize: 13,
    fontFamily: 'WorkSans-SemiBold',
  },
  quickActionTextLight: {
    color: '#1e293b',
  },
  quickActionTextDark: {
    color: '#e2e8f0',
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
  activityWrap: {
    gap: 8,
  },
  activityRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  activityRowLight: {
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  activityRowDark: {
    borderColor: '#334155',
    backgroundColor: '#111827',
  },
  activityContent: {
    flex: 1,
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
    fontSize: 12,
    fontFamily: 'WorkSans-Regular',
  },
  activitySubtitleLight: {
    color: '#475569',
  },
  activitySubtitleDark: {
    color: '#cbd5e1',
  },
  activityDate: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: 'WorkSans-Regular',
  },
  activityDateLight: {
    color: '#64748b',
  },
  activityDateDark: {
    color: '#94a3b8',
  },
  activityStatusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 1,
  },
  activityToneInfo: {
    backgroundColor: 'rgba(59,130,246,0.16)',
  },
  activityToneWarning: {
    backgroundColor: 'rgba(245,158,11,0.18)',
  },
  activityToneSuccess: {
    backgroundColor: 'rgba(16,185,129,0.18)',
  },
  activityStatusText: {
    fontSize: 10,
    color: '#e2e8f0',
    fontFamily: 'WorkSans-SemiBold',
    textTransform: 'capitalize',
  },
});
