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
import { ArrowLeft, CalendarDays, ListChecks, PencilLine, Plus, Search, Trash2 } from 'lucide-react-native';

import {
  extractItems,
  getEntityId,
  getValueByPath,
  toErrorMessage,
} from '../../../../components/management/management-utils';
import { useThemeMode } from '../../../../hooks/use-theme';
import { propertyServiceFeeAPI, servicesAPI } from '../../../../services/management';
import { propertyStyles as baseStyles } from './styles';
import { EntityItem } from './types';
import { asText, getPropertyName } from './utils';

type RouteParams = {
  item?: EntityItem;
};

type Option = {
  id: string | number;
  name: string;
};

type FormMode = 'create' | 'edit';

type FeeType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

type FeeStatus = 'active' | 'inactive';

type FormState = {
  serviceId: string;
  status: FeeStatus;
  price: string;
  startDate: string;
  type: FeeType;
};

type DateFieldKey = 'startDate';

const TYPE_OPTIONS: Array<{ value: FeeType; label: string }> = [
  { value: 'daily', label: 'Gunluk' },
  { value: 'weekly', label: 'Heftelik' },
  { value: 'monthly', label: 'Ayliq' },
  { value: 'quarterly', label: 'Rubluk' },
  { value: 'yearly', label: 'Illik' },
];

const STATUS_OPTIONS: Array<{ value: FeeStatus; label: string }> = [
  { value: 'active', label: 'Aktiv' },
  { value: 'inactive', label: 'Qeyri-aktiv' },
];

const EMPTY_FORM: FormState = {
  serviceId: '',
  status: 'active',
  price: '',
  startDate: '',
  type: 'monthly',
};

const normalizeAmountInput = (value: string): string => {
  const normalized = String(value || '')
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '');

  const [intPart = '', ...decimalParts] = normalized.split('.');
  const decimalPart = decimalParts.join('').slice(0, 2);
  return decimalPart.length > 0 ? `${intPart}.${decimalPart}` : intPart;
};

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isValidIsoDate = (value: string): boolean => {
  const raw = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return false;
  }

  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return toIsoDate(date) === raw;
};

const plusDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
};

const endOfCurrentMonth = (): string => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return toIsoDate(end);
};

const formatMoney = (value: unknown): string => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `${parsed.toFixed(2)} AZN` : '-';
};

const formatTypeLabel = (typeRaw: unknown): string => {
  const normalized = asText(typeRaw).trim().toLowerCase() as FeeType;
  const found = TYPE_OPTIONS.find(option => option.value === normalized);
  return found?.label || asText(typeRaw) || '-';
};

export default function ManagementPropertyServiceFeesRouteScreen() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const item = (route.params as RouteParams | undefined)?.item ?? null;
  const propertyId = item ? getEntityId(item) : null;

  const [serviceFees, setServiceFees] = React.useState<EntityItem[]>([]);
  const [serviceOptions, setServiceOptions] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingServices, setLoadingServices] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [formVisible, setFormVisible] = React.useState(false);
  const [formMode, setFormMode] = React.useState<FormMode>('create');
  const [editingFeeId, setEditingFeeId] = React.useState<string | number | null>(null);
  const [formState, setFormState] = React.useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = React.useState(false);
  const [serviceSearch, setServiceSearch] = React.useState('');
  const [datePickerVisible, setDatePickerVisible] = React.useState(false);
  const [datePickerField, setDatePickerField] = React.useState<DateFieldKey | null>(null);
  const [datePickerValue, setDatePickerValue] = React.useState('');

  const serviceNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    serviceOptions.forEach(option => map.set(String(option.id), option.name));
    return map;
  }, [serviceOptions]);

  const filteredServiceOptions = React.useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();
    if (!query) {
      return serviceOptions;
    }

    return serviceOptions.filter(option => option.name.toLowerCase().includes(query));
  }, [serviceOptions, serviceSearch]);

  const propertyName = item ? getPropertyName(item) : '-';

  const loadServiceFees = React.useCallback(async () => {
    if (propertyId === null) {
      setServiceFees([]);
      setError('Menzil ID tapilmadi');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await propertyServiceFeeAPI.getList(propertyId);
      setServiceFees(extractItems(response));
    } catch (loadError) {
      setServiceFees([]);
      setError(toErrorMessage(loadError, 'Servis haqqilari yuklenmedi'));
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const loadServices = React.useCallback(async () => {
    try {
      setLoadingServices(true);
      const response = await servicesAPI.getAll({ per_page: 1000, page: 1 });
      const options = extractItems(response)
        .map(entry => {
          const id = getEntityId(entry);
          const name = asText(entry.name).trim();
          if (id === null || name.length === 0) {
            return null;
          }

          return { id, name } as Option;
        })
        .filter((option): option is Option => option !== null);

      setServiceOptions(options);
    } catch {
      setServiceOptions([]);
    } finally {
      setLoadingServices(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadServiceFees();
      void loadServices();
      return undefined;
    }, [loadServiceFees, loadServices]),
  );

  const openCreate = React.useCallback(() => {
    setFormMode('create');
    setEditingFeeId(null);
    setFormState(EMPTY_FORM);
    setServiceSearch('');
    setFormVisible(true);
  }, []);

  const openEdit = React.useCallback((entry: EntityItem) => {
    const feeId = getEntityId(entry);
    if (feeId === null) {
      return;
    }

    setFormMode('edit');
    setEditingFeeId(feeId);
    setFormState({
      serviceId: asText(entry.service_id),
      status: asText(entry.status).trim().toLowerCase() === 'inactive' ? 'inactive' : 'active',
      price: asText(entry.price),
      startDate: asText(entry.start_date),
      type: (asText(entry.type).trim().toLowerCase() as FeeType) || 'monthly',
    });
    setServiceSearch('');
    setFormVisible(true);
  }, []);

  const closeForm = React.useCallback(() => {
    if (submitting) {
      return;
    }

    setFormVisible(false);
    setEditingFeeId(null);
    setFormMode('create');
    setFormState(EMPTY_FORM);
    setServiceSearch('');
    setDatePickerVisible(false);
    setDatePickerField(null);
    setDatePickerValue('');
  }, [submitting]);

  const openDatePicker = React.useCallback((field: DateFieldKey) => {
    setDatePickerField(field);
    setDatePickerValue(formState[field] || '');
    setDatePickerVisible(true);
  }, [formState]);

  const closeDatePicker = React.useCallback(() => {
    setDatePickerVisible(false);
    setDatePickerField(null);
    setDatePickerValue('');
  }, []);

  const applyDatePicker = React.useCallback(() => {
    if (!datePickerField) {
      return;
    }

    const normalized = datePickerValue.trim();
    if (normalized.length > 0 && !isValidIsoDate(normalized)) {
      Alert.alert('Xeta', 'Tarix formatı YYYY-MM-DD olmalidir');
      return;
    }

    setFormState(prev => ({ ...prev, [datePickerField]: normalized }));
    closeDatePicker();
  }, [closeDatePicker, datePickerField, datePickerValue]);

  const submitForm = React.useCallback(async () => {
    if (propertyId === null) {
      Alert.alert('Xeta', 'Menzil ID tapilmadi');
      return;
    }

    if (formState.serviceId.trim().length === 0) {
      Alert.alert('Xeta', 'Servis secilmelidir');
      return;
    }

    const price = Number(formState.price.replace(',', '.').trim());
    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert('Xeta', 'Qiymet duzgun daxil edilmelidir');
      return;
    }

    if (formState.startDate && !isValidIsoDate(formState.startDate)) {
      Alert.alert('Xeta', 'Baslangic tarix YYYY-MM-DD formatinda olmalidir');
      return;
    }

    const serviceIdNum = Number(formState.serviceId);
    const submitData: Record<string, unknown> = {
      property_id: propertyId,
      service_id: Number.isFinite(serviceIdNum) ? serviceIdNum : formState.serviceId,
      status: formState.status,
      price,
      type: formState.type,
      ...(formState.startDate.trim().length > 0 ? { start_date: formState.startDate.trim() } : {}),
    };

    try {
      setSubmitting(true);

      if (formMode === 'edit' && editingFeeId !== null) {
        await propertyServiceFeeAPI.update(propertyId, editingFeeId, submitData);
      } else {
        await propertyServiceFeeAPI.add(propertyId, submitData);
      }

      closeForm();
      await loadServiceFees();
    } catch (submitError) {
      Alert.alert('Xeta', toErrorMessage(submitError, 'Servis haqqi yadda saxlanmadi'));
    } finally {
      setSubmitting(false);
    }
  }, [closeForm, editingFeeId, formMode, formState, loadServiceFees, propertyId]);

  const onDelete = React.useCallback((entry: EntityItem) => {
    const feeId = getEntityId(entry);
    if (propertyId === null || feeId === null) {
      Alert.alert('Xeta', 'Servis haqqi ID tapilmadi');
      return;
    }

    Alert.alert('Silme tesdiqi', 'Bu servis haqqi silinsin?', [
      { text: 'Xeyr', style: 'cancel' },
      {
        text: 'Beli',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await propertyServiceFeeAPI.delete(propertyId, feeId);
              await loadServiceFees();
            } catch (deleteError) {
              Alert.alert('Xeta', toErrorMessage(deleteError, 'Servis haqqi silinmedi'));
            }
          })();
        },
      },
    ]);
  }, [loadServiceFees, propertyId]);

  const resolveServiceName = React.useCallback((entry: EntityItem): string => {
    const nested = asText(getValueByPath(entry, 'service.name')).trim();
    if (nested.length > 0) {
      return nested;
    }

    const serviceId = asText(entry.service_id).trim();
    if (serviceId.length > 0 && serviceNameById.has(serviceId)) {
      return serviceNameById.get(serviceId) || `Servis #${serviceId}`;
    }

    return serviceId.length > 0 ? `Servis #${serviceId}` : 'Servis';
  }, [serviceNameById]);

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
            onPress={openCreate}
            style={[localStyles.addButton, isDark ? localStyles.addButtonDark : localStyles.addButtonLight]}
          >
            <Plus size={14} color={isDark ? '#dbeafe' : '#1d4ed8'} strokeWidth={2.4} />
            <Text style={[localStyles.addButtonText, isDark ? localStyles.addButtonTextDark : localStyles.addButtonTextLight]}>
              Elave et
            </Text>
          </Pressable>
        </View>

        <ScrollView style={baseStyles.modalScroll} contentContainerStyle={[baseStyles.modalScrollContent, localStyles.scrollContent]}>
          <View style={[localStyles.heroCard, isDark ? localStyles.heroCardDark : localStyles.heroCardLight]}>
            <View style={localStyles.heroRow}>
              <View style={[localStyles.heroIconWrap, isDark ? localStyles.heroIconWrapDark : localStyles.heroIconWrapLight]}>
                <ListChecks size={16} color={isDark ? '#bfdbfe' : '#1d4ed8'} strokeWidth={2.2} />
              </View>

              <View style={localStyles.heroTextWrap}>
                <Text style={[localStyles.heroTitle, isDark ? localStyles.heroTitleDark : localStyles.heroTitleLight]}>
                  Servis haqqilari
                </Text>
                <Text style={[localStyles.heroSubtitle, isDark ? localStyles.heroSubtitleDark : localStyles.heroSubtitleLight]}>
                  {propertyName}
                </Text>
              </View>
            </View>

            <Text style={[localStyles.heroMeta, isDark ? localStyles.heroMetaDark : localStyles.heroMetaLight]}>
              Cemi servis haqqi: {serviceFees.length}
            </Text>
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

          {!loading && !error && serviceFees.length === 0 ? (
            <View style={baseStyles.centerStateWrap}>
              <Text style={[baseStyles.emptyText, isDark ? baseStyles.textMutedDark : baseStyles.textMutedLight]}>
                Servis haqqi tapilmadi
              </Text>
            </View>
          ) : null}

          {!loading && !error && serviceFees.length > 0 ? (
            <View style={localStyles.listWrap}>
              {serviceFees.map(entry => {
                const feeId = getEntityId(entry);
                const statusRaw = asText(entry.status).trim().toLowerCase();
                const isActive = statusRaw !== 'inactive';

                return (
                  <View key={String(feeId ?? Math.random())} style={[localStyles.feeCard, isDark ? localStyles.feeCardDark : localStyles.feeCardLight]}>
                    <View style={localStyles.feeHeaderRow}>
                      <View style={localStyles.feeTitleWrap}>
                        <Text style={[localStyles.feeTitle, isDark ? localStyles.feeTitleDark : localStyles.feeTitleLight]}>
                          {resolveServiceName(entry)}
                        </Text>
                        <Text style={[localStyles.feeSubtitle, isDark ? localStyles.feeSubtitleDark : localStyles.feeSubtitleLight]}>
                          ID: {feeId === null ? '-' : String(feeId)}
                        </Text>
                      </View>

                      <View style={[localStyles.statusChip, isActive ? localStyles.statusChipActive : localStyles.statusChipInactive]}>
                        <Text style={[localStyles.statusChipText, isActive ? localStyles.statusChipTextActive : localStyles.statusChipTextInactive]}>
                          {isActive ? 'Aktiv' : 'Qeyri-aktiv'}
                        </Text>
                      </View>
                    </View>

                    <View style={localStyles.infoGrid}>
                      <Text style={[localStyles.infoText, isDark ? localStyles.infoTextDark : localStyles.infoTextLight]}>
                        Qiymet: {formatMoney(entry.price)}
                      </Text>
                      <Text style={[localStyles.infoText, isDark ? localStyles.infoTextDark : localStyles.infoTextLight]}>
                        Tip: {formatTypeLabel(entry.type)}
                      </Text>
                      <Text style={[localStyles.infoText, isDark ? localStyles.infoTextDark : localStyles.infoTextLight]}>
                        Baslangic: {asText(entry.start_date) || '-'}
                      </Text>
                    </View>

                    <View style={localStyles.actionsRow}>
                      <Pressable
                        onPress={() => openEdit(entry)}
                        style={[localStyles.rowActionButton, localStyles.rowActionEdit]}
                      >
                        <PencilLine size={14} color="#ffffff" strokeWidth={2.2} />
                        <Text style={localStyles.rowActionText}>Redakte</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => onDelete(entry)}
                        style={[localStyles.rowActionButton, localStyles.rowActionDelete]}
                      >
                        <Trash2 size={14} color="#ffffff" strokeWidth={2.2} />
                        <Text style={localStyles.rowActionText}>Sil</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
        </ScrollView>
      </View>

      <Modal
        visible={formVisible}
        transparent
        animationType="fade"
        onRequestClose={closeForm}
      >
        <View style={localStyles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeForm} />

          <View style={[localStyles.modalCard, isDark ? localStyles.modalCardDark : localStyles.modalCardLight]}>
            <Text style={[localStyles.modalTitle, isDark ? localStyles.modalTitleDark : localStyles.modalTitleLight]}>
              {formMode === 'edit' ? 'Servis haqqini redakte et' : 'Yeni servis haqqi elave et'}
            </Text>

            <Text style={[localStyles.fieldLabel, isDark ? localStyles.fieldLabelDark : localStyles.fieldLabelLight]}>
              Servis
            </Text>
            {loadingServices ? (
              <View style={localStyles.loadingInlineWrap}>
                <ActivityIndicator size="small" color="#0ea5e9" />
              </View>
            ) : (
              <View>
                <View style={[localStyles.searchInputWrap, isDark ? localStyles.searchInputWrapDark : localStyles.searchInputWrapLight]}>
                  <Search size={14} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                  <TextInput
                    value={serviceSearch}
                    onChangeText={setServiceSearch}
                    placeholder="Servis axtar..."
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    style={[localStyles.searchInput, isDark ? localStyles.searchInputDark : localStyles.searchInputLight]}
                  />
                </View>

                <ScrollView style={localStyles.serviceOptionList} nestedScrollEnabled>
                  <View style={localStyles.optionWrap}>
                    {filteredServiceOptions.map(option => {
                      const active = formState.serviceId === String(option.id);
                      return (
                        <Pressable
                          key={String(option.id)}
                          onPress={() => setFormState(prev => ({ ...prev, serviceId: String(option.id) }))}
                          style={[
                            localStyles.optionChip,
                            isDark ? localStyles.optionChipDark : localStyles.optionChipLight,
                            active ? localStyles.optionChipActive : null,
                          ]}
                        >
                          <Text
                            style={[
                              localStyles.optionChipText,
                              isDark ? localStyles.optionChipTextDark : localStyles.optionChipTextLight,
                              active ? localStyles.optionChipTextActive : null,
                            ]}
                          >
                            {option.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>

                {filteredServiceOptions.length === 0 ? (
                  <Text style={[localStyles.inlineHintText, isDark ? localStyles.inlineHintTextDark : localStyles.inlineHintTextLight]}>
                    Servis tapilmadi
                  </Text>
                ) : null}
              </View>
            )}

            <Text style={[localStyles.fieldLabel, isDark ? localStyles.fieldLabelDark : localStyles.fieldLabelLight]}>Qiymet</Text>
            <TextInput
              value={formState.price}
              onChangeText={value => setFormState(prev => ({ ...prev, price: normalizeAmountInput(value) }))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              style={[localStyles.input, isDark ? localStyles.inputDark : localStyles.inputLight]}
            />

            <View style={localStyles.rowGap8}>
              <View style={localStyles.halfCol}>
                <Text style={[localStyles.fieldLabel, isDark ? localStyles.fieldLabelDark : localStyles.fieldLabelLight]}>Tip</Text>
                <View style={localStyles.optionWrap}>
                  {TYPE_OPTIONS.map(option => {
                    const active = formState.type === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setFormState(prev => ({ ...prev, type: option.value }))}
                        style={[
                          localStyles.optionChip,
                          isDark ? localStyles.optionChipDark : localStyles.optionChipLight,
                          active ? localStyles.optionChipActive : null,
                        ]}
                      >
                        <Text
                          style={[
                            localStyles.optionChipText,
                            isDark ? localStyles.optionChipTextDark : localStyles.optionChipTextLight,
                            active ? localStyles.optionChipTextActive : null,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={localStyles.halfCol}>
                <Text style={[localStyles.fieldLabel, isDark ? localStyles.fieldLabelDark : localStyles.fieldLabelLight]}>Status</Text>
                <View style={localStyles.optionWrap}>
                  {STATUS_OPTIONS.map(option => {
                    const active = formState.status === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setFormState(prev => ({ ...prev, status: option.value }))}
                        style={[
                          localStyles.optionChip,
                          isDark ? localStyles.optionChipDark : localStyles.optionChipLight,
                          active ? localStyles.optionChipActive : null,
                        ]}
                      >
                        <Text
                          style={[
                            localStyles.optionChipText,
                            isDark ? localStyles.optionChipTextDark : localStyles.optionChipTextLight,
                            active ? localStyles.optionChipTextActive : null,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={localStyles.rowGap8}>
              <View style={localStyles.thirdCol}>
                <Text style={[localStyles.fieldLabel, isDark ? localStyles.fieldLabelDark : localStyles.fieldLabelLight]}>Baslangic</Text>
                <Pressable
                  onPress={() => openDatePicker('startDate')}
                  style={[localStyles.dateFieldButton, isDark ? localStyles.dateFieldButtonDark : localStyles.dateFieldButtonLight]}
                >
                  <CalendarDays size={14} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                  <Text style={[localStyles.dateFieldValue, isDark ? localStyles.dateFieldValueDark : localStyles.dateFieldValueLight]}>
                    {formState.startDate || 'YYYY-MM-DD'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={localStyles.modalActionsRow}>
              <Pressable
                onPress={closeForm}
                style={[localStyles.modalActionButton, localStyles.modalCancelButton]}
                disabled={submitting}
              >
                <Text style={localStyles.modalActionText}>Legv et</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void submitForm();
                }}
                style={[localStyles.modalActionButton, localStyles.modalSaveButton, submitting ? localStyles.disabledButton : null]}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={localStyles.modalActionText}>{formMode === 'edit' ? 'Yenile' : 'Elave et'}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={datePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDatePicker}
      >
        <View style={localStyles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDatePicker} />

          <View style={[localStyles.datePickerCard, isDark ? localStyles.modalCardDark : localStyles.modalCardLight]}>
            <Text style={[localStyles.modalTitle, isDark ? localStyles.modalTitleDark : localStyles.modalTitleLight]}>
              Tarix sec
            </Text>

            <Text style={[localStyles.fieldLabel, isDark ? localStyles.fieldLabelDark : localStyles.fieldLabelLight]}>
              Format: YYYY-MM-DD
            </Text>
            <TextInput
              value={datePickerValue}
              onChangeText={setDatePickerValue}
              placeholder="2026-04-13"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              style={[localStyles.input, isDark ? localStyles.inputDark : localStyles.inputLight]}
            />

            <View style={localStyles.quickDateRow}>
              {[{ label: 'Bugun', value: toIsoDate(new Date()) }, { label: '+7', value: plusDays(7) }, { label: '+30', value: plusDays(30) }, { label: 'Ay sonu', value: endOfCurrentMonth() }].map(option => (
                <Pressable
                  key={option.label}
                  onPress={() => setDatePickerValue(option.value)}
                  style={[localStyles.quickDateChip, isDark ? localStyles.quickDateChipDark : localStyles.quickDateChipLight]}
                >
                  <Text style={[localStyles.quickDateChipText, isDark ? localStyles.quickDateChipTextDark : localStyles.quickDateChipTextLight]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={localStyles.modalActionsRow}>
              <Pressable
                onPress={() => {
                  setDatePickerValue('');
                }}
                style={[localStyles.modalActionButton, localStyles.modalCancelButton]}
              >
                <Text style={localStyles.modalActionText}>Temizle</Text>
              </Pressable>

              <Pressable
                onPress={closeDatePicker}
                style={[localStyles.modalActionButton, localStyles.modalCancelButton]}
              >
                <Text style={localStyles.modalActionText}>Legv et</Text>
              </Pressable>

              <Pressable
                onPress={applyDatePicker}
                style={[localStyles.modalActionButton, localStyles.modalSaveButton]}
              >
                <Text style={localStyles.modalActionText}>Sec</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addButton: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonLight: {
    backgroundColor: '#dbeafe',
    borderColor: '#bfdbfe',
  },
  addButtonDark: {
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  addButtonText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
  addButtonTextLight: {
    color: '#1e3a8a',
  },
  addButtonTextDark: {
    color: '#bfdbfe',
  },
  scrollContent: {
    paddingBottom: 24,
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
  heroRow: {
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
  heroMeta: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  heroMetaLight: {
    color: '#334155',
  },
  heroMetaDark: {
    color: '#cbd5e1',
  },
  listWrap: {
    gap: 10,
  },
  feeCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  feeCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  feeCardDark: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
  },
  feeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  feeTitleWrap: {
    flex: 1,
  },
  feeTitle: {
    fontSize: 14,
    fontFamily: 'WorkSans-Bold',
  },
  feeTitleLight: {
    color: '#0f172a',
  },
  feeTitleDark: {
    color: '#f8fafc',
  },
  feeSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'WorkSans-Medium',
  },
  feeSubtitleLight: {
    color: '#64748b',
  },
  feeSubtitleDark: {
    color: '#94a3b8',
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusChipActive: {
    backgroundColor: '#dcfce7',
  },
  statusChipInactive: {
    backgroundColor: '#fee2e2',
  },
  statusChipText: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
  },
  statusChipTextActive: {
    color: '#15803d',
  },
  statusChipTextInactive: {
    color: '#b91c1c',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoText: {
    minWidth: '47%',
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  infoTextLight: {
    color: '#334155',
  },
  infoTextDark: {
    color: '#cbd5e1',
  },
  actionsRow: {
    marginTop: 2,
    flexDirection: 'row',
    gap: 8,
  },
  rowActionButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  rowActionEdit: {
    backgroundColor: '#0369a1',
  },
  rowActionDelete: {
    backgroundColor: '#dc2626',
  },
  rowActionText: {
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
    maxWidth: 680,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    maxHeight: '88%',
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
  fieldLabel: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  fieldLabelLight: {
    color: '#334155',
  },
  fieldLabelDark: {
    color: '#cbd5e1',
  },
  loadingInlineWrap: {
    minHeight: 32,
    justifyContent: 'center',
  },
  searchInputWrap: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchInputWrapLight: {
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  searchInputWrapDark: {
    borderColor: '#3f3f46',
    backgroundColor: '#0b1220',
  },
  searchInput: {
    flex: 1,
    minHeight: 36,
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
  },
  searchInputLight: {
    color: '#0f172a',
  },
  searchInputDark: {
    color: '#f8fafc',
  },
  serviceOptionList: {
    maxHeight: 140,
    marginTop: 8,
  },
  inlineHintText: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: 'WorkSans-Medium',
  },
  inlineHintTextLight: {
    color: '#64748b',
  },
  inlineHintTextDark: {
    color: '#94a3b8',
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  optionChipLight: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  optionChipDark: {
    borderColor: '#3f3f46',
    backgroundColor: '#18181b',
  },
  optionChipActive: {
    borderColor: '#0ea5e9',
    backgroundColor: '#0ea5e9',
  },
  optionChipText: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
  },
  optionChipTextLight: {
    color: '#334155',
  },
  optionChipTextDark: {
    color: '#cbd5e1',
  },
  optionChipTextActive: {
    color: '#ffffff',
  },
  input: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
  },
  inputLight: {
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  inputDark: {
    borderColor: '#3f3f46',
    backgroundColor: '#0b1220',
    color: '#f8fafc',
  },
  dateFieldButton: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateFieldButtonLight: {
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  dateFieldButtonDark: {
    borderColor: '#3f3f46',
    backgroundColor: '#0b1220',
  },
  dateFieldValue: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  dateFieldValueLight: {
    color: '#334155',
  },
  dateFieldValueDark: {
    color: '#cbd5e1',
  },
  rowGap8: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  halfCol: {
    flex: 1,
  },
  thirdCol: {
    flex: 1,
  },
  datePickerCard: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  quickDateRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickDateChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickDateChipLight: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  quickDateChipDark: {
    borderColor: '#1d4ed8',
    backgroundColor: '#1e293b',
  },
  quickDateChipText: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
  },
  quickDateChipTextLight: {
    color: '#1d4ed8',
  },
  quickDateChipTextDark: {
    color: '#bfdbfe',
  },
  modalActionsRow: {
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
  modalSaveButton: {
    backgroundColor: '#0f766e',
  },
  disabledButton: {
    opacity: 0.7,
  },
  modalActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
});
