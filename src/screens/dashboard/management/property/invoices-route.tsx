import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  ListChecks,
  ReceiptText,
  RefreshCcw,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react-native';

import {
  getEntityId,
  getValueByPath,
  toErrorMessage,
} from '../../../../components/management/management-utils';
import { useThemeMode } from '../../../../hooks/use-theme';
import { financeInvoicesAPI } from '../../../../services/management';
import { propertyStyles as baseStyles } from './styles';
import { EntityItem } from './types';
import { asText, getPropertyName } from './utils';

type RouteParams = {
  item?: EntityItem;
  openBalanceModal?: boolean;
};

type InvoiceStatus = 'paid' | 'unpaid' | 'not_paid' | 'overdue' | 'pending' | 'unknown';

type InvoiceEntry = {
  id: string | number;
  serviceId: string;
  serviceName: string;
  description: string;
  amount: number;
  amountPaid: number;
  remaining: number;
  status: InvoiceStatus;
  dueDate: string;
  paidDate: string;
  paidDateValue: number;
};

type PaymentMethodOption = {
  id: string | number;
  name: string;
};

const QUICK_TOPUP_AMOUNTS = [10, 20, 50, 100, 200];

const toRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toOptionalNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const pickFirstNumber = (values: unknown[]): number | null => {
  for (const value of values) {
    const parsed = toOptionalNumber(value);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
};

const normalizeStatus = (value: unknown): InvoiceStatus => {
  const normalized = asText(value).trim().toLowerCase();

  if (
    normalized === 'paid'
    || normalized === 'unpaid'
    || normalized === 'not_paid'
    || normalized === 'overdue'
    || normalized === 'pending'
  ) {
    return normalized;
  }

  return 'unknown';
};

const isUnpaidStatus = (status: InvoiceStatus): boolean => {
  return status === 'unpaid' || status === 'not_paid' || status === 'overdue';
};

const formatMoney = (value: number): string => {
  return `${value.toFixed(2)} AZN`;
};

const normalizeAmountInput = (value: string): string => {
  const normalized = String(value || '')
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '');

  const [intPart = '', ...decimalParts] = normalized.split('.');
  const decimalPart = decimalParts.join('').slice(0, 2);
  return decimalPart.length > 0 ? `${intPart}.${decimalPart}` : intPart;
};

const formatDate = (value: unknown): string => {
  const raw = asText(value).trim();
  if (!raw) return '-';

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat('az-AZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
};

const toTimestamp = (value: unknown): number => {
  const raw = asText(value).trim();
  if (!raw) return 0;

  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const statusMeta = (
  status: InvoiceStatus,
): {
  label: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
  icon: LucideIcon;
} => {
  if (status === 'paid') {
    return { label: 'Odenilib', tone: 'good', icon: CheckCircle2 };
  }

  if (status === 'overdue') {
    return { label: 'Muddet kecib', tone: 'bad', icon: TriangleAlert };
  }

  if (status === 'unpaid' || status === 'not_paid') {
    return { label: 'Odenilmeyib', tone: 'bad', icon: TriangleAlert };
  }

  if (status === 'pending') {
    return { label: 'Gozleyir', tone: 'warn', icon: Clock3 };
  }

  return { label: 'Namelum', tone: 'neutral', icon: ReceiptText };
};

const toneStyles = (
  tone: 'good' | 'warn' | 'bad' | 'neutral',
  isDark: boolean,
): { bg: string; text: string } => {
  if (tone === 'good') {
    return {
      bg: isDark ? 'rgba(16, 185, 129, 0.18)' : '#dcfce7',
      text: isDark ? '#6ee7b7' : '#15803d',
    };
  }

  if (tone === 'warn') {
    return {
      bg: isDark ? 'rgba(251, 191, 36, 0.16)' : '#fef3c7',
      text: isDark ? '#fcd34d' : '#b45309',
    };
  }

  if (tone === 'bad') {
    return {
      bg: isDark ? 'rgba(248, 113, 113, 0.16)' : '#fee2e2',
      text: isDark ? '#fca5a5' : '#b91c1c',
    };
  }

  return {
    bg: isDark ? 'rgba(148, 163, 184, 0.16)' : '#e2e8f0',
    text: isDark ? '#cbd5e1' : '#475569',
  };
};

const mapInvoice = (value: unknown, index: number): InvoiceEntry => {
  const item = toRecord(value);
  const rawId = item.id ?? item.invoice_id;
  const id =
    typeof rawId === 'string' || typeof rawId === 'number'
      ? rawId
      : `invoice-${index + 1}`;
  const amount = toNumber(item.amount);
  const amountPaid = toNumber(item.amount_paid);
  const remaining = Math.max(amount - amountPaid, 0);
  const status = normalizeStatus(item.status);

  const serviceName =
    asText(getValueByPath(item, 'service.name')).trim()
    || asText(item.service_name).trim()
    || asText(item.title).trim()
    || asText(item.name).trim()
    || `Faktura #${id}`;
  const serviceRawId = getValueByPath(item, 'service.id') ?? item.service_id ?? serviceName;
  const serviceId = asText(serviceRawId).trim() || serviceName;

  const paidAtRaw = item.paid_at ?? item.updated_at ?? item.created_at;

  return {
    id,
    serviceId,
    serviceName,
    description: asText(item.desc).trim() || asText(item.description).trim() || asText(item.note).trim(),
    amount,
    amountPaid,
    remaining,
    status,
    dueDate: formatDate(item.due_date),
    paidDate: formatDate(paidAtRaw),
    paidDateValue: toTimestamp(paidAtRaw),
  };
};

const mapPaymentMethod = (value: unknown, index: number): PaymentMethodOption | null => {
  const item = toRecord(value);
  const id = item.id ?? item.payment_method_id;
  if (id === undefined || id === null || id === '') {
    return null;
  }

  const name =
    asText(item.name).trim()
    || asText(item.title).trim()
    || asText(item.label).trim()
    || `Method ${index + 1}`;

  return { id: id as string | number, name };
};

export default function ManagementPropertyInvoicesRouteScreen() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const routeParams = (route.params as RouteParams | undefined) ?? undefined;
  const item = routeParams?.item ?? null;
  const openBalanceModalParam = Boolean(routeParams?.openBalanceModal);
  const propertyId = item ? getEntityId(item) : null;
  const autoOpenHandledRef = React.useRef(false);

  const initialBalance = React.useMemo(() => {
    return pickFirstNumber([
      getValueByPath(item, 'balance'),
      getValueByPath(item, 'meta.balance'),
      getValueByPath(item, 'meta.current_balance'),
      getValueByPath(item, 'sub_data.balance'),
      getValueByPath(item, 'sub_data.property.balance'),
    ]);
  }, [item]);

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [section, setSection] = React.useState<'unpaid' | 'paid'>('unpaid');
  const [invoices, setInvoices] = React.useState<InvoiceEntry[]>([]);
  const [updatedAt, setUpdatedAt] = React.useState('');
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethodOption[]>([]);
  const [payingId, setPayingId] = React.useState<string | number | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceEntry | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = React.useState<string | number | null>(null);
  const [paymentAmount, setPaymentAmount] = React.useState('');
  const [paymentDesc, setPaymentDesc] = React.useState('');
  const [balanceModalVisible, setBalanceModalVisible] = React.useState(false);
  const [balanceAmount, setBalanceAmount] = React.useState('');
  const [addingBalance, setAddingBalance] = React.useState(false);
  const [currentBalance, setCurrentBalance] = React.useState<number | null>(initialBalance);

  React.useEffect(() => {
    setCurrentBalance(initialBalance);
  }, [initialBalance, propertyId]);

  const loadPaymentMethods = React.useCallback(async () => {
    try {
      const response = await financeInvoicesAPI.fetchPaymentMethods(1, 100);
      const normalized = response
        .map(mapPaymentMethod)
        .filter((entry): entry is PaymentMethodOption => entry !== null);
      setPaymentMethods(normalized);
    } catch {
      setPaymentMethods([]);
    }
  }, []);

  const loadInvoices = React.useCallback(async (isRefresh: boolean) => {
    if (propertyId === null) {
      setLoading(false);
      setRefreshing(false);
      setInvoices([]);
      setError('Menzil ID tapilmadi');
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setError(null);
      const response = await financeInvoicesAPI.fetchInvoices({ property_ids: [propertyId] }, 1, 200);
      const normalized = response.data.map(mapInvoice);
      setInvoices(normalized);
      setUpdatedAt(formatDate(new Date().toISOString()));
    } catch (loadError) {
      setInvoices([]);
      setError(toErrorMessage(loadError, 'Fakturalar yuklenmedi'));
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [propertyId]);

  useFocusEffect(
    React.useCallback(() => {
      void loadInvoices(false);
      return undefined;
    }, [loadInvoices]),
  );

  React.useEffect(() => {
    void loadPaymentMethods();
  }, [loadPaymentMethods]);

  const unpaidInvoices = React.useMemo(() => {
    return invoices.filter(entry => isUnpaidStatus(entry.status) || entry.remaining > 0);
  }, [invoices]);

  const paidInvoices = React.useMemo(() => {
    return invoices
      .filter(entry => entry.status === 'paid' || entry.amountPaid > 0)
      .sort((left, right) => right.paidDateValue - left.paidDateValue);
  }, [invoices]);

  const visibleInvoices = section === 'unpaid' ? unpaidInvoices : paidInvoices;

  const totals = React.useMemo(() => {
    const totalDebt = unpaidInvoices.reduce((sum, entry) => sum + entry.remaining, 0);
    const totalAmount = invoices.reduce((sum, entry) => sum + entry.amount, 0);

    return {
      all: invoices.length,
      unpaid: unpaidInvoices.length,
      paid: paidInvoices.length,
      debt: totalDebt,
      totalAmount,
    };
  }, [invoices, paidInvoices.length, unpaidInvoices]);

  const propertyName = item ? getPropertyName(item) : '-';
  const mtkName = asText(getValueByPath(item, 'sub_data.mtk.name')).trim() || asText(getValueByPath(item, 'meta.mtk_name')).trim() || '-';
  const complexName = asText(getValueByPath(item, 'sub_data.complex.name')).trim() || asText(getValueByPath(item, 'meta.complex_name')).trim() || '-';
  const buildingName = asText(getValueByPath(item, 'sub_data.building.name')).trim() || asText(getValueByPath(item, 'meta.building_name')).trim() || '-';
  const blockName = asText(getValueByPath(item, 'sub_data.block.name')).trim() || asText(getValueByPath(item, 'meta.block_name')).trim() || '-';

  const closePaymentModal = React.useCallback(() => {
    setPaymentModalVisible(false);
    setSelectedInvoice(null);
    setPaymentAmount('');
    setPaymentDesc('');
  }, []);

  const closeBalanceModal = React.useCallback(() => {
    if (addingBalance) {
      return;
    }

    setBalanceModalVisible(false);
    setBalanceAmount('');
  }, [addingBalance]);

  const openPaymentModal = React.useCallback((entry: InvoiceEntry) => {
    if (entry.remaining <= 0) {
      return;
    }

    if (paymentMethods.length === 0) {
      Alert.alert('Xeta', 'Odenis usulu tapilmadi');
      return;
    }

    setSelectedInvoice(entry);
    setSelectedPaymentMethodId(paymentMethods[0]?.id ?? null);
    setPaymentAmount(String(entry.remaining.toFixed(2)));
    setPaymentDesc('');
    setPaymentModalVisible(true);
  }, [paymentMethods]);

  const submitPayment = React.useCallback(async () => {
    if (!selectedInvoice) {
      return;
    }

    if (selectedPaymentMethodId === null) {
      Alert.alert('Xeta', 'Odenis usulunu secin');
      return;
    }

    const parsedAmount = Number(paymentAmount.replace(',', '.').trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Xeta', 'Duzgun mebleg daxil edin');
      return;
    }

    if (parsedAmount > selectedInvoice.remaining) {
      Alert.alert('Xeta', 'Mebleg qaliq borcdan cox ola bilmez');
      return;
    }

    try {
      setPayingId(selectedInvoice.id);
      await financeInvoicesAPI.payInvoices([
        {
          id: selectedInvoice.id,
          amount_paid: parsedAmount,
          payment_method_id: selectedPaymentMethodId,
          desc: paymentDesc.trim().length > 0 ? paymentDesc.trim() : 'Property invoice payment',
        },
      ]);

      closePaymentModal();
      await loadInvoices(true);
    } catch (payError) {
      Alert.alert('Xeta', toErrorMessage(payError, 'Odenis ugursuz oldu'));
    } finally {
      setPayingId(null);
    }
  }, [closePaymentModal, loadInvoices, paymentAmount, paymentDesc, selectedInvoice, selectedPaymentMethodId]);

  const submitBalanceTopUp = React.useCallback(async () => {
    if (propertyId === null) {
      Alert.alert('Xeta', 'Menzil ID tapilmadi');
      return;
    }

    const parsedAmount = Number(balanceAmount.replace(',', '.').trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Xeta', 'Duzgun mebleg daxil edin');
      return;
    }

    try {
      setAddingBalance(true);
      await financeInvoicesAPI.addBalanceInCash(propertyId, parsedAmount, 'cash');
      setBalanceModalVisible(false);
      setBalanceAmount('');
      setCurrentBalance(prev => Number(((prev ?? 0) + parsedAmount).toFixed(2)));
      Alert.alert('Ugurlu', 'Balans ugurla artirildi');
      await loadInvoices(true);
    } catch (topupError) {
      Alert.alert('Xeta', toErrorMessage(topupError, 'Balans artirma ugursuz oldu'));
    } finally {
      setAddingBalance(false);
    }
  }, [balanceAmount, loadInvoices, propertyId]);

  React.useEffect(() => {
    if (section === 'unpaid' && unpaidInvoices.length === 0 && paidInvoices.length > 0) {
      setSection('paid');
    }
  }, [paidInvoices.length, section, unpaidInvoices.length]);

  React.useEffect(() => {
    if (!openBalanceModalParam || autoOpenHandledRef.current) {
      return;
    }

    autoOpenHandledRef.current = true;
    setBalanceModalVisible(true);
  }, [openBalanceModalParam]);

  return (
    <View
      style={[
        baseStyles.detailRouteRoot,
        isDark ? baseStyles.detailRouteRootDark : baseStyles.detailRouteRootLight,
        {
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View style={localStyles.screenWrap}>
        <View style={localStyles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={[
              baseStyles.detailBackButton,
              isDark ? baseStyles.detailBackButtonDark : baseStyles.detailBackButtonLight,
            ]}
          >
            <ArrowLeft size={16} color={isDark ? '#f5f5f5' : '#0f172a'} strokeWidth={2.4} />
            <Text style={[baseStyles.detailBackButtonText, isDark ? baseStyles.textPrimaryDark : baseStyles.textPrimaryLight]}>
              Geri
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              void loadInvoices(true);
            }}
            disabled={loading || refreshing}
            style={[
              localStyles.refreshButton,
              isDark ? localStyles.refreshButtonDark : localStyles.refreshButtonLight,
            ]}
          >
            <RefreshCcw size={14} color={isDark ? '#dbeafe' : '#1d4ed8'} strokeWidth={2.3} />
            <Text style={[localStyles.refreshText, isDark ? localStyles.refreshTextDark : localStyles.refreshTextLight]}>
              {refreshing ? 'Yenilenir...' : 'Yenile'}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={baseStyles.modalScroll} contentContainerStyle={[baseStyles.modalScrollContent, localStyles.scrollContent]}>
          <View style={[localStyles.heroCard, isDark ? localStyles.heroCardDark : localStyles.heroCardLight]}>
            <View style={localStyles.heroTopRow}>
              <View style={[localStyles.heroIconWrap, isDark ? localStyles.heroIconWrapDark : localStyles.heroIconWrapLight]}>
                <ReceiptText size={16} color={isDark ? '#bfdbfe' : '#1d4ed8'} strokeWidth={2.2} />
              </View>
              <View style={localStyles.heroTextWrap}>
                <Text style={[localStyles.heroTitle, isDark ? localStyles.heroTitleDark : localStyles.heroTitleLight]}>
                  Menzil fakturalari
                </Text>
                <Text style={[localStyles.heroSubtitle, isDark ? localStyles.heroSubtitleDark : localStyles.heroSubtitleLight]}>
                  {propertyName}
                </Text>
              </View>
            </View>

            <View style={localStyles.heroMetaWrap}>
              <View style={localStyles.metaRow}>
                <Building2 size={13} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                <Text style={[localStyles.metaText, isDark ? localStyles.metaTextDark : localStyles.metaTextLight]}>
                  MTK: {mtkName}
                </Text>
              </View>
              <View style={localStyles.metaRow}>
                <Building2 size={13} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                <Text style={[localStyles.metaText, isDark ? localStyles.metaTextDark : localStyles.metaTextLight]}>
                  {complexName} / {buildingName} / {blockName}
                </Text>
              </View>
              <View style={localStyles.metaRow}>
                <CalendarDays size={13} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                <Text style={[localStyles.metaText, isDark ? localStyles.metaTextDark : localStyles.metaTextLight]}>
                  Son yenilenme: {updatedAt || '-'}
                </Text>
              </View>
            </View>

            <View style={localStyles.heroTopupWrap}>
              <Pressable
                onPress={() => setBalanceModalVisible(true)}
                style={[localStyles.heroTopupButton, isDark ? localStyles.heroTopupButtonDark : localStyles.heroTopupButtonLight]}
              >
                <Banknote size={14} color={isDark ? '#86efac' : '#166534'} strokeWidth={2.3} />
                <Text style={[localStyles.heroTopupText, isDark ? localStyles.heroTopupTextDark : localStyles.heroTopupTextLight]}>
                  Balansi artir
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  navigation.push('ManagementPropertyServiceFees', { item });
                }}
                style={[localStyles.heroTopupButton, isDark ? localStyles.heroServiceButtonDark : localStyles.heroServiceButtonLight]}
              >
                <ListChecks size={14} color={isDark ? '#bfdbfe' : '#1e3a8a'} strokeWidth={2.3} />
                <Text style={[localStyles.heroTopupText, isDark ? localStyles.heroServiceTextDark : localStyles.heroServiceTextLight]}>
                  Servis haqqilari
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={localStyles.metricGrid}>
            <View style={[localStyles.metricCard, isDark ? localStyles.metricCardDark : localStyles.metricCardLight]}>
              <Text style={[localStyles.metricLabel, isDark ? localStyles.metricLabelDark : localStyles.metricLabelLight]}>Balans</Text>
              <Text style={[localStyles.metricValue, isDark ? localStyles.metricValueDark : localStyles.metricValueLight]}>
                {currentBalance === null ? '-' : formatMoney(currentBalance)}
              </Text>
            </View>
            <View style={[localStyles.metricCard, isDark ? localStyles.metricCardDark : localStyles.metricCardLight]}>
              <Text style={[localStyles.metricLabel, isDark ? localStyles.metricLabelDark : localStyles.metricLabelLight]}>Borc</Text>
              <Text style={[localStyles.metricValue, isDark ? localStyles.metricValueDark : localStyles.metricValueLight]}>
                {formatMoney(totals.debt)}
              </Text>
            </View>
            <View style={[localStyles.metricCard, isDark ? localStyles.metricCardDark : localStyles.metricCardLight]}>
              <Text style={[localStyles.metricLabel, isDark ? localStyles.metricLabelDark : localStyles.metricLabelLight]}>Odenilmeyib</Text>
              <Text style={[localStyles.metricValue, isDark ? localStyles.metricValueDark : localStyles.metricValueLight]}>
                {totals.unpaid}
              </Text>
            </View>
            <View style={[localStyles.metricCard, isDark ? localStyles.metricCardDark : localStyles.metricCardLight]}>
              <Text style={[localStyles.metricLabel, isDark ? localStyles.metricLabelDark : localStyles.metricLabelLight]}>Odenilib</Text>
              <Text style={[localStyles.metricValue, isDark ? localStyles.metricValueDark : localStyles.metricValueLight]}>
                {totals.paid}
              </Text>
            </View>
            <View style={[localStyles.metricCard, isDark ? localStyles.metricCardDark : localStyles.metricCardLight]}>
              <Text style={[localStyles.metricLabel, isDark ? localStyles.metricLabelDark : localStyles.metricLabelLight]}>Cemi</Text>
              <Text style={[localStyles.metricValue, isDark ? localStyles.metricValueDark : localStyles.metricValueLight]}>
                {formatMoney(totals.totalAmount)}
              </Text>
            </View>
          </View>

          <View style={[localStyles.segmentWrap, isDark ? localStyles.segmentWrapDark : localStyles.segmentWrapLight]}>
            <Pressable
              onPress={() => setSection('unpaid')}
              style={[
                localStyles.segmentButton,
                section === 'unpaid'
                  ? isDark
                    ? localStyles.segmentButtonActiveDark
                    : localStyles.segmentButtonActiveLight
                  : null,
              ]}
            >
              <Text
                style={[
                  localStyles.segmentText,
                  section === 'unpaid'
                    ? localStyles.segmentTextActive
                    : isDark
                      ? localStyles.segmentTextDark
                      : localStyles.segmentTextLight,
                ]}
              >
                Odenilmeyenler ({unpaidInvoices.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSection('paid')}
              style={[
                localStyles.segmentButton,
                section === 'paid'
                  ? isDark
                    ? localStyles.segmentButtonActiveDark
                    : localStyles.segmentButtonActiveLight
                  : null,
              ]}
            >
              <Text
                style={[
                  localStyles.segmentText,
                  section === 'paid'
                    ? localStyles.segmentTextActive
                    : isDark
                      ? localStyles.segmentTextDark
                      : localStyles.segmentTextLight,
                ]}
              >
                Odenis tarixcesi ({paidInvoices.length})
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={baseStyles.centerStateWrap}>
              <ActivityIndicator size="large" color="#0ea5e9" />
            </View>
          ) : null}

          {!loading && error ? (
            <View style={baseStyles.centerStateWrap}>
              <Text style={[baseStyles.emptyText, isDark ? baseStyles.textMutedDark : baseStyles.textMutedLight]}>{error}</Text>
            </View>
          ) : null}

          {!loading && !error && visibleInvoices.length === 0 ? (
            <View style={baseStyles.centerStateWrap}>
              <Text style={[baseStyles.emptyText, isDark ? baseStyles.textMutedDark : baseStyles.textMutedLight]}>
                Faktura tapilmadi
              </Text>
            </View>
          ) : null}

          {!loading && !error && visibleInvoices.length > 0 ? (
            <View style={localStyles.listWrap}>
              {visibleInvoices.map(entry => {
                const meta = statusMeta(entry.status);
                const tone = toneStyles(meta.tone, isDark);

                return (
                  <View
                    key={String(entry.id)}
                    style={[localStyles.invoiceCard, isDark ? localStyles.invoiceCardDark : localStyles.invoiceCardLight]}
                  >
                    <View style={localStyles.invoiceHeaderRow}>
                      <View style={localStyles.invoiceHeaderTextWrap}>
                        <Text style={[localStyles.invoiceTitle, isDark ? localStyles.invoiceTitleDark : localStyles.invoiceTitleLight]}>
                          {entry.serviceName}
                        </Text>
                        <Text style={[localStyles.invoiceSubtitle, isDark ? localStyles.invoiceSubtitleDark : localStyles.invoiceSubtitleLight]}>
                          Faktura #{entry.id}
                        </Text>
                      </View>

                      <View style={[localStyles.statusChip, { backgroundColor: tone.bg }]}> 
                        <meta.icon size={12} color={tone.text} strokeWidth={2.3} />
                        <Text style={[localStyles.statusChipText, { color: tone.text }]}>{meta.label}</Text>
                      </View>
                    </View>

                    {entry.description.length > 0 ? (
                      <Text style={[localStyles.descriptionText, isDark ? localStyles.descriptionTextDark : localStyles.descriptionTextLight]}>
                        {entry.description}
                      </Text>
                    ) : null}

                    <View style={localStyles.amountRow}>
                      <View style={localStyles.amountItem}>
                        <Text style={[localStyles.amountLabel, isDark ? localStyles.amountLabelDark : localStyles.amountLabelLight]}>Mebleg</Text>
                        <Text style={[localStyles.amountValue, isDark ? localStyles.amountValueDark : localStyles.amountValueLight]}>
                          {formatMoney(entry.amount)}
                        </Text>
                      </View>
                      <View style={localStyles.amountItem}>
                        <Text style={[localStyles.amountLabel, isDark ? localStyles.amountLabelDark : localStyles.amountLabelLight]}>Odenen</Text>
                        <Text style={[localStyles.amountValue, isDark ? localStyles.amountValueDark : localStyles.amountValueLight]}>
                          {formatMoney(entry.amountPaid)}
                        </Text>
                      </View>
                      <View style={localStyles.amountItem}>
                        <Text style={[localStyles.amountLabel, isDark ? localStyles.amountLabelDark : localStyles.amountLabelLight]}>Qaliq</Text>
                        <Text style={[localStyles.amountValue, isDark ? localStyles.amountValueDark : localStyles.amountValueLight]}>
                          {formatMoney(entry.remaining)}
                        </Text>
                      </View>
                    </View>

                    <View style={localStyles.bottomRow}>
                      <Text style={[localStyles.dateText, isDark ? localStyles.dateTextDark : localStyles.dateTextLight]}>
                        Son tarix: {entry.dueDate}
                      </Text>
                      <Text style={[localStyles.dateText, isDark ? localStyles.dateTextDark : localStyles.dateTextLight]}>
                        Odenis: {entry.paidDate}
                      </Text>
                    </View>

                    {(isUnpaidStatus(entry.status) || entry.remaining > 0) && (
                      <Pressable
                        onPress={() => openPaymentModal(entry)}
                        disabled={payingId === entry.id}
                        style={[localStyles.payButton, payingId === entry.id ? localStyles.payButtonDisabled : null]}
                      >
                        {payingId === entry.id ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <>
                            <CreditCard size={14} color="#ffffff" strokeWidth={2.3} />
                            <Text style={localStyles.payButtonText}>Tam odenis et</Text>
                          </>
                        )}
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          ) : null}
        </ScrollView>
      </View>

      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closePaymentModal}
      >
        <View style={localStyles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePaymentModal} />

          <View style={[localStyles.modalCard, isDark ? localStyles.modalCardDark : localStyles.modalCardLight]}>
            <Text style={[localStyles.modalTitle, isDark ? localStyles.modalTitleDark : localStyles.modalTitleLight]}>
              Odenis et
            </Text>

            <Text style={[localStyles.modalSubtitle, isDark ? localStyles.modalSubtitleDark : localStyles.modalSubtitleLight]}>
              {selectedInvoice ? `${selectedInvoice.serviceName} - Faktura #${selectedInvoice.id}` : '-'}
            </Text>

            <Text style={[localStyles.modalDebtText, isDark ? localStyles.modalDebtTextDark : localStyles.modalDebtTextLight]}>
              Qaliq borc: {selectedInvoice ? formatMoney(selectedInvoice.remaining) : '-'}
            </Text>

            <Text style={[localStyles.modalFieldLabel, isDark ? localStyles.modalFieldLabelDark : localStyles.modalFieldLabelLight]}>
              Odenis usulu
            </Text>
            <View style={localStyles.methodList}>
              {paymentMethods.map(method => {
                const active = selectedPaymentMethodId !== null && String(selectedPaymentMethodId) === String(method.id);
                return (
                  <Pressable
                    key={String(method.id)}
                    onPress={() => setSelectedPaymentMethodId(method.id)}
                    style={[
                      localStyles.methodChip,
                      isDark ? localStyles.methodChipDark : localStyles.methodChipLight,
                      active ? localStyles.methodChipActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        localStyles.methodChipText,
                        isDark ? localStyles.methodChipTextDark : localStyles.methodChipTextLight,
                        active ? localStyles.methodChipTextActive : null,
                      ]}
                    >
                      {method.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[localStyles.modalFieldLabel, isDark ? localStyles.modalFieldLabelDark : localStyles.modalFieldLabelLight]}>
              Mebleg
            </Text>
            <TextInput
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              style={[localStyles.modalInput, isDark ? localStyles.modalInputDark : localStyles.modalInputLight]}
            />

            <Text style={[localStyles.modalFieldLabel, isDark ? localStyles.modalFieldLabelDark : localStyles.modalFieldLabelLight]}>
              Qeyd (opsional)
            </Text>
            <TextInput
              value={paymentDesc}
              onChangeText={setPaymentDesc}
              placeholder="Qeyd yazin"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              style={[localStyles.modalInput, isDark ? localStyles.modalInputDark : localStyles.modalInputLight]}
            />

            <View style={localStyles.modalActions}>
              <Pressable
                onPress={closePaymentModal}
                style={[localStyles.modalActionButton, localStyles.modalCancelButton]}
                disabled={payingId !== null}
              >
                <Text style={localStyles.modalCancelText}>Legv et</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void submitPayment();
                }}
                style={[
                  localStyles.modalActionButton,
                  localStyles.modalSubmitButton,
                  payingId !== null ? localStyles.modalSubmitButtonDisabled : null,
                ]}
                disabled={payingId !== null}
              >
                {payingId !== null ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={localStyles.modalSubmitText}>Ode</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={balanceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeBalanceModal}
      >
        <View style={localStyles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeBalanceModal} />

          <View style={[localStyles.modalCard, isDark ? localStyles.modalCardDark : localStyles.modalCardLight]}>
            <Text style={[localStyles.modalTitle, isDark ? localStyles.modalTitleDark : localStyles.modalTitleLight]}>
              Balans artir
            </Text>

            <Text style={[localStyles.modalSubtitle, isDark ? localStyles.modalSubtitleDark : localStyles.modalSubtitleLight]}>
              {propertyName}
            </Text>

            <Text style={[localStyles.modalFieldLabel, isDark ? localStyles.modalFieldLabelDark : localStyles.modalFieldLabelLight]}>
              Mebleg
            </Text>
            <TextInput
              value={balanceAmount}
              onChangeText={value => setBalanceAmount(normalizeAmountInput(value))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              style={[localStyles.modalInput, isDark ? localStyles.modalInputDark : localStyles.modalInputLight]}
            />

            <View style={localStyles.quickAmountRow}>
              {QUICK_TOPUP_AMOUNTS.map(amount => (
                <Pressable
                  key={String(amount)}
                  onPress={() => setBalanceAmount(String(amount))}
                  style={[localStyles.quickAmountChip, isDark ? localStyles.quickAmountChipDark : localStyles.quickAmountChipLight]}
                >
                  <Text style={[localStyles.quickAmountChipText, isDark ? localStyles.quickAmountChipTextDark : localStyles.quickAmountChipTextLight]}>
                    +{amount}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={[localStyles.balancePreview, isDark ? localStyles.balancePreviewDark : localStyles.balancePreviewLight]}>
              <Text style={[localStyles.balancePreviewLabel, isDark ? localStyles.balancePreviewLabelDark : localStyles.balancePreviewLabelLight]}>
                Elave olunacaq mebleg
              </Text>
              <Text style={[localStyles.balancePreviewValue, isDark ? localStyles.balancePreviewValueDark : localStyles.balancePreviewValueLight]}>
                {(() => {
                  const parsed = Number(balanceAmount || 0);
                  return Number.isFinite(parsed) && parsed > 0 ? `${parsed.toFixed(2)} AZN` : '0.00 AZN';
                })()}
              </Text>
            </View>

            <View style={localStyles.modalActions}>
              <Pressable
                onPress={closeBalanceModal}
                style={[localStyles.modalActionButton, localStyles.modalCancelButton]}
                disabled={addingBalance}
              >
                <Text style={localStyles.modalCancelText}>Legv et</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void submitBalanceTopUp();
                }}
                style={[
                  localStyles.modalActionButton,
                  localStyles.modalSubmitButton,
                  addingBalance ? localStyles.modalSubmitButtonDisabled : null,
                ]}
                disabled={addingBalance}
              >
                {addingBalance ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={localStyles.modalSubmitText}>Balansi artir</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  screenWrap: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refreshButton: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshButtonLight: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  refreshButtonDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e3a8a',
  },
  refreshText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
  refreshTextLight: {
    color: '#1d4ed8',
  },
  refreshTextDark: {
    color: '#dbeafe',
  },
  scrollContent: {
    paddingBottom: 28,
  },
  heroCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  heroCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  heroCardDark: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconWrapLight: {
    backgroundColor: '#dbeafe',
  },
  heroIconWrapDark: {
    backgroundColor: '#172554',
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 16,
    fontFamily: 'WorkSans-Bold',
  },
  heroTitleLight: {
    color: '#0f172a',
  },
  heroTitleDark: {
    color: '#f8fafc',
  },
  heroSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  heroSubtitleLight: {
    color: '#475569',
  },
  heroSubtitleDark: {
    color: '#94a3b8',
  },
  heroMetaWrap: {
    marginTop: 10,
    gap: 6,
  },
  heroTopupWrap: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  heroTopupButton: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroTopupButtonLight: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  heroTopupButtonDark: {
    backgroundColor: 'rgba(20, 83, 45, 0.3)',
    borderColor: 'rgba(22, 163, 74, 0.5)',
  },
  heroTopupText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
  heroTopupTextLight: {
    color: '#166534',
  },
  heroTopupTextDark: {
    color: '#86efac',
  },
  heroServiceButtonLight: {
    backgroundColor: '#dbeafe',
    borderColor: '#bfdbfe',
  },
  heroServiceButtonDark: {
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  heroServiceTextLight: {
    color: '#1e3a8a',
  },
  heroServiceTextDark: {
    color: '#bfdbfe',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
    flex: 1,
  },
  metaTextLight: {
    color: '#475569',
  },
  metaTextDark: {
    color: '#94a3b8',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  metricCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    minWidth: '48%',
    flex: 1,
  },
  metricCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  metricCardDark: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  metricLabelLight: {
    color: '#64748b',
  },
  metricLabelDark: {
    color: '#94a3b8',
  },
  metricValue: {
    marginTop: 3,
    fontSize: 15,
    fontFamily: 'WorkSans-Bold',
  },
  metricValueLight: {
    color: '#0f172a',
  },
  metricValueDark: {
    color: '#f8fafc',
  },
  servicesCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  servicesCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  servicesCardDark: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
  },
  servicesTitle: {
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  servicesTitleLight: {
    color: '#0f172a',
  },
  servicesTitleDark: {
    color: '#f8fafc',
  },
  servicesList: {
    marginTop: 8,
    gap: 8,
  },
  serviceRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  serviceRowLight: {
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  serviceRowDark: {
    borderColor: '#3f3f46',
    backgroundColor: '#18181b',
  },
  serviceNameWrap: {
    flex: 1,
  },
  serviceName: {
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
  serviceNameLight: {
    color: '#0f172a',
  },
  serviceNameDark: {
    color: '#f8fafc',
  },
  serviceMeta: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'WorkSans-Medium',
  },
  serviceMetaLight: {
    color: '#64748b',
  },
  serviceMetaDark: {
    color: '#94a3b8',
  },
  serviceTotalsWrap: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  serviceDebt: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
  },
  serviceDebtLight: {
    color: '#b91c1c',
  },
  serviceDebtDark: {
    color: '#fca5a5',
  },
  servicePaid: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'WorkSans-Medium',
  },
  servicePaidLight: {
    color: '#0369a1',
  },
  servicePaidDark: {
    color: '#7dd3fc',
  },
  segmentWrap: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  segmentWrapLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  segmentWrapDark: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentButtonActiveLight: {
    backgroundColor: '#0ea5e9',
  },
  segmentButtonActiveDark: {
    backgroundColor: '#0369a1',
  },
  segmentText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
    textAlign: 'center',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  segmentTextLight: {
    color: '#334155',
  },
  segmentTextDark: {
    color: '#cbd5e1',
  },
  listWrap: {
    gap: 10,
  },
  invoiceCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  invoiceCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  invoiceCardDark: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  invoiceHeaderTextWrap: {
    flex: 1,
  },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: 'WorkSans-Bold',
  },
  invoiceTitleLight: {
    color: '#0f172a',
  },
  invoiceTitleDark: {
    color: '#f8fafc',
  },
  invoiceSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'WorkSans-Medium',
  },
  invoiceSubtitleLight: {
    color: '#64748b',
  },
  invoiceSubtitleDark: {
    color: '#94a3b8',
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusChipText: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
  },
  descriptionText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  descriptionTextLight: {
    color: '#334155',
  },
  descriptionTextDark: {
    color: '#cbd5e1',
  },
  amountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  amountItem: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  amountLabelLight: {
    color: '#64748b',
  },
  amountLabelDark: {
    color: '#94a3b8',
  },
  amountValue: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  amountValueLight: {
    color: '#0f172a',
  },
  amountValueDark: {
    color: '#f8fafc',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'WorkSans-Medium',
  },
  dateTextLight: {
    color: '#64748b',
  },
  dateTextDark: {
    color: '#94a3b8',
  },
  payButton: {
    marginTop: 2,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#0f766e',
  },
  payButtonDisabled: {
    opacity: 0.72,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  modalCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  modalCardDark: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'WorkSans-Bold',
  },
  modalTitleLight: {
    color: '#0f172a',
  },
  modalTitleDark: {
    color: '#f8fafc',
  },
  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  modalSubtitleLight: {
    color: '#334155',
  },
  modalSubtitleDark: {
    color: '#cbd5e1',
  },
  modalDebtText: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
  modalDebtTextLight: {
    color: '#b91c1c',
  },
  modalDebtTextDark: {
    color: '#fca5a5',
  },
  modalFieldLabel: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  modalFieldLabelLight: {
    color: '#334155',
  },
  modalFieldLabelDark: {
    color: '#cbd5e1',
  },
  methodList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  methodChipLight: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  methodChipDark: {
    borderColor: '#3f3f46',
    backgroundColor: '#18181b',
  },
  methodChipActive: {
    borderColor: '#0ea5e9',
    backgroundColor: '#0ea5e9',
  },
  methodChipText: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
  },
  methodChipTextLight: {
    color: '#334155',
  },
  methodChipTextDark: {
    color: '#cbd5e1',
  },
  methodChipTextActive: {
    color: '#ffffff',
  },
  modalInput: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
  },
  modalInputLight: {
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  modalInputDark: {
    borderColor: '#3f3f46',
    backgroundColor: '#0b1220',
    color: '#f8fafc',
  },
  quickAmountRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickAmountChipLight: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  quickAmountChipDark: {
    borderColor: '#3f3f46',
    backgroundColor: '#18181b',
  },
  quickAmountChipText: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
  },
  quickAmountChipTextLight: {
    color: '#334155',
  },
  quickAmountChipTextDark: {
    color: '#cbd5e1',
  },
  balancePreview: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  balancePreviewLight: {
    borderColor: '#dbe4ef',
    backgroundColor: '#f8fafc',
  },
  balancePreviewDark: {
    borderColor: '#3f3f46',
    backgroundColor: '#18181b',
  },
  balancePreviewLabel: {
    fontSize: 11,
    fontFamily: 'WorkSans-Medium',
  },
  balancePreviewLabelLight: {
    color: '#64748b',
  },
  balancePreviewLabelDark: {
    color: '#94a3b8',
  },
  balancePreviewValue: {
    marginTop: 2,
    fontSize: 14,
    fontFamily: 'WorkSans-Bold',
  },
  balancePreviewValueLight: {
    color: '#0f172a',
  },
  balancePreviewValueDark: {
    color: '#f8fafc',
  },
  modalActions: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  modalActionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#334155',
  },
  modalSubmitButton: {
    backgroundColor: '#0f766e',
  },
  modalSubmitButtonDisabled: {
    opacity: 0.7,
  },
  modalCancelText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
});
