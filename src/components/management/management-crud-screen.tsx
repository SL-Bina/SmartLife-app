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

import AppPageLayout from '../common/app-page-layout';
import { useThemeMode } from '../../hooks/use-theme';
import { mtkAPI } from '../../services/management';
import { APP_LAYOUT_COLORS } from '../../theme/layout-colors';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedManagementMtkId } from '../../store/management-filter-slice';

type QueryParams = Record<string, unknown>;
type EntityItem = Record<string, unknown>;
type MtkOption = { id: string | number; name: string };

type CrudApi = {
  getAll: (params?: QueryParams) => Promise<unknown>;
  search?: (params?: QueryParams) => Promise<unknown>;
  add?: (payload: Record<string, unknown>) => Promise<unknown>;
  update?: (id: string | number, payload: Record<string, unknown>) => Promise<unknown>;
  delete?: (id: string | number) => Promise<unknown>;
  getById?: (id: string | number) => Promise<unknown>;
  bindProperty?: (residentId: string | number, payload: Record<string, unknown>) => Promise<unknown>;
  unbindProperty?: (residentId: string | number, payload: Record<string, unknown>) => Promise<unknown>;
};

type CrudField = {
  key: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'number' | 'email';
  multiline?: boolean;
};

type DetailRow = {
  key: string;
  path: string;
  label: string;
  value: string;
  depth: number;
};

type ManagementCrudScreenProps = {
  title: string;
  entityLabel: string;
  api: CrudApi;
  fields: CrudField[];
  searchKey?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  enablePropertyBinding?: boolean;
};

const toRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const extractItems = (payload: unknown): EntityItem[] => {
  if (Array.isArray(payload)) {
    return payload.filter(item => item && typeof item === 'object') as EntityItem[];
  }

  const root = toRecord(payload);
  const rootData = toRecord(root.data);
  const nestedData = rootData.data;

  if (Array.isArray(nestedData)) {
    return nestedData.filter(item => item && typeof item === 'object') as EntityItem[];
  }

  const deeplyNested = toRecord(nestedData).data;
  if (Array.isArray(deeplyNested)) {
    return deeplyNested.filter(item => item && typeof item === 'object') as EntityItem[];
  }

  if (Array.isArray(rootData)) {
    return (rootData as unknown[]).filter(item => item && typeof item === 'object') as EntityItem[];
  }

  return [];
};

const extractItem = (payload: unknown): EntityItem => {
  const root = toRecord(payload);
  const rootData = root.data;

  if (rootData && typeof rootData === 'object' && !Array.isArray(rootData)) {
    const nested = toRecord(rootData).data;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as EntityItem;
    }

    return rootData as EntityItem;
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as EntityItem;
  }

  return {};
};

const toErrorMessage = (error: unknown, fallback = 'Əməliyyat zamanı xəta baş verdi'): string => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || fallback;

  const record = toRecord(error);

  if (typeof record.message === 'string' && record.message.length > 0) {
    return record.message;
  }

  const errors = toRecord(record.errors);
  const first = Object.values(errors)[0];

  if (Array.isArray(first) && first[0]) return String(first[0]);
  if (first) return String(first);

  return fallback;
};

const getEntityId = (item: EntityItem): string | number | null => {
  const id = item.id;
  if (typeof id === 'string' || typeof id === 'number') return id;
  return null;
};

const getPrimaryText = (item: EntityItem): string => {
  const candidates = [item.name, item.title, item.fullName, item.username, item.email];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }

  const id = getEntityId(item);
  return id ? `#${id}` : 'Qeyd';
};

const getSecondaryText = (item: EntityItem): string => {
  const candidates = [item.description, item.address, item.phone, item.status, item.email];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }

    if (typeof candidate === 'number') {
      return String(candidate);
    }
  }

  return 'Əlavə məlumat yoxdur';
};

const toPreviewValue = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return null;
};

const getCardPreviewData = (
  item: EntityItem,
  fields: CrudField[],
): Array<{ label: string; value: string }> => {
  const result: Array<{ label: string; value: string }> = [];

  fields.forEach(field => {
    const loweredKey = field.key.toLowerCase();
    if (['name', 'title', 'full_name', 'fullname', 'username'].includes(loweredKey)) {
      return;
    }

    const value = toPreviewValue(item[field.key]);
    if (!value) {
      return;
    }

    result.push({ label: field.label, value });
  });

  if (result.length === 0) {
    const fallbackKeys = [
      { key: 'status', label: 'Status' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Telefon' },
      { key: 'address', label: 'Ünvan' },
    ];

    fallbackKeys.forEach(itemKey => {
      const value = toPreviewValue(item[itemKey.key]);
      if (!value) {
        return;
      }

      result.push({ label: itemKey.label, value });
    });
  }

  return result.slice(0, 4);
};

const toDetailLabel = (path: string): string =>
  path
    .replace(/\[(\d+)\]/g, ' [$1]')
    .split('.')
    .map(part => part.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()))
    .join(' / ');

const toDetailValue = (value: unknown): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  if (typeof value === 'string') {
    return value.length > 0 ? value : '(boş mətn)';
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const pushDetailRow = (
  rows: DetailRow[],
  path: string,
  value: string,
  depth: number,
) => {
  const safePath = path.length > 0 ? path : 'root';
  rows.push({
    key: `${safePath}::${rows.length}`,
    path: safePath,
    label: toDetailLabel(safePath),
    value,
    depth,
  });
};

const appendDetailRows = (
  rows: DetailRow[],
  value: unknown,
  path: string,
  depth: number,
) => {
  if (Array.isArray(value)) {
    pushDetailRow(rows, path, `Array (${value.length})`, depth);

    value.forEach((entry, index) => {
      appendDetailRows(rows, entry, `${path}[${index}]`, depth + 1);
    });
    return;
  }

  if (value && typeof value === 'object') {
    const record = toRecord(value);
    const keys = Object.keys(record);
    pushDetailRow(rows, path, `Obyekt (${keys.length})`, depth);

    keys.forEach(key => {
      const nextPath = path.length > 0 ? `${path}.${key}` : key;
      appendDetailRows(rows, record[key], nextPath, depth + 1);
    });
    return;
  }

  pushDetailRow(rows, path, toDetailValue(value), depth);
};

const toDetailRows = (
  item: EntityItem | null,
  fields: CrudField[],
): DetailRow[] => {
  if (!item) {
    return [];
  }

  const rows: DetailRow[] = [];

  const preferredKeys = fields
    .map(field => field.key)
    .filter(key => Object.prototype.hasOwnProperty.call(item, key));

  const remainingKeys = Object.keys(item).filter(key => !preferredKeys.includes(key));
  const orderedKeys = [...preferredKeys, ...remainingKeys];

  orderedKeys.forEach(key => {
    appendDetailRows(rows, item[key], key, 0);
  });

  return rows;
};

const toInputValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const keyboardTypeForField = (fieldType: CrudField['type']) => {
  if (fieldType === 'number') return 'numeric' as const;
  if (fieldType === 'email') return 'email-address' as const;
  return 'default' as const;
};

export default function ManagementCrudScreen({
  title,
  entityLabel,
  api,
  fields,
  searchKey = 'name',
  searchPlaceholder = 'Axtar...',
  emptyMessage = 'Məlumat yoxdur',
  enablePropertyBinding = false,
}: ManagementCrudScreenProps) {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const dispatch = useAppDispatch();
  const selectedMtkId = useAppSelector(state => state.managementFilter.selectedMtkId);

  const [items, setItems] = React.useState<EntityItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const [formVisible, setFormVisible] = React.useState(false);
  const [detailsVisible, setDetailsVisible] = React.useState(false);
  const [detailsItem, setDetailsItem] = React.useState<EntityItem | null>(null);
  const [editingItem, setEditingItem] = React.useState<EntityItem | null>(null);
  const [formState, setFormState] = React.useState<Record<string, string>>({});
  const [extraJson, setExtraJson] = React.useState('{}');
  const [propertyIdInput, setPropertyIdInput] = React.useState('');
  const [mtkOptions, setMtkOptions] = React.useState<MtkOption[]>([]);
  const isMountedRef = React.useRef(true);
  const requiresMtkFilter = React.useMemo(
    () => entityLabel.trim().toLowerCase() !== 'mtk',
    [entityLabel],
  );

  const effectiveSelectedMtkId = React.useMemo(() => {
    const hasSelected =
      selectedMtkId !== null &&
      mtkOptions.some(option => String(option.id) === String(selectedMtkId));

    if (hasSelected) {
      return selectedMtkId;
    }

    return mtkOptions[0]?.id ?? null;
  }, [mtkOptions, selectedMtkId]);

  const detailsRows = React.useMemo(
    () => toDetailRows(detailsItem, fields),
    [detailsItem, fields],
  );

  const selectedMtkName = React.useMemo(() => {
    const active = mtkOptions.find(
      option =>
        effectiveSelectedMtkId !== null &&
        String(option.id) === String(effectiveSelectedMtkId),
    );
    if (active) return active.name;
    return mtkOptions[0]?.name || undefined;
  }, [effectiveSelectedMtkId, mtkOptions]);

  React.useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );

  const loadMtkOptions = React.useCallback(async () => {
    try {
      const response = await mtkAPI.getLookupList({ per_page: 1000 });
      const source: unknown[] = Array.isArray(response) ? response : extractItems(response);

      const normalized = source
        .map(item => {
          const record = toRecord(item);
          const id = record.id;
          const name = typeof record.name === 'string' ? record.name.trim() : '';

          if ((typeof id === 'string' || typeof id === 'number') && name.length > 0) {
            return { id, name };
          }

          return null;
        })
        .filter((item): item is MtkOption => Boolean(item));

      if (!isMountedRef.current || normalized.length === 0) return;

      setMtkOptions(normalized);

      const hasSelected =
        selectedMtkId !== null &&
        normalized.some(option => String(option.id) === String(selectedMtkId));

      if (!hasSelected) {
        dispatch(setSelectedManagementMtkId(normalized[0].id));
      }
    } catch {}
  }, [dispatch, selectedMtkId]);

  React.useEffect(() => {
    void loadMtkOptions();
  }, [loadMtkOptions]);

  const openCreateModal = React.useCallback(() => {
    const initialState: Record<string, string> = {};
    fields.forEach(field => {
      initialState[field.key] = '';
    });

    setEditingItem(null);
    setFormState(initialState);
    setExtraJson('{}');
    setPropertyIdInput('');
    setFormVisible(true);
  }, [fields]);

  const openEditModal = React.useCallback((item: EntityItem) => {
    const nextState: Record<string, string> = {};
    fields.forEach(field => {
      nextState[field.key] = toInputValue(item[field.key]);
    });

    setEditingItem(item);
    setFormState(nextState);
    setExtraJson('{}');
    setPropertyIdInput('');
    setFormVisible(true);
  }, [fields]);

  const closeFormModal = React.useCallback(() => {
    if (submitting) return;
    setFormVisible(false);
  }, [submitting]);

  const loadItems = React.useCallback(
    async (useSearch: boolean) => {
      try {
        setLoading(true);
        setError(null);

        if (requiresMtkFilter && effectiveSelectedMtkId === null) {
          setItems([]);
          return;
        }

        const params: QueryParams = { page: 1, per_page: 50 };

        if (requiresMtkFilter && effectiveSelectedMtkId !== null) {
          params.mtk_ids = [effectiveSelectedMtkId];
        }

        if (useSearch && search.trim().length > 0) {
          params[searchKey] = search.trim();
        }

        const response = useSearch && api.search ? await api.search(params) : await api.getAll(params);

        setItems(extractItems(response));
      } catch (loadError) {
        setError(toErrorMessage(loadError, `${entityLabel} məlumatları yüklənmədi`));
      } finally {
        setLoading(false);
      }
    },
    [api, effectiveSelectedMtkId, requiresMtkFilter, search, searchKey],
  );

  React.useEffect(() => {
    void loadItems(false);
  }, [loadItems]);

  const onSearchPress = React.useCallback(() => {
    void loadItems(search.trim().length > 0);
  }, [loadItems, search]);

  const parsePayload = React.useCallback((): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};

    fields.forEach(field => {
      const rawValue = formState[field.key] ?? '';
      const trimmed = rawValue.trim();

      if (!trimmed) return;

      if (field.type === 'number') {
        const numericValue = Number(trimmed);
        if (!Number.isNaN(numericValue)) {
          payload[field.key] = numericValue;
        }
        return;
      }

      payload[field.key] = trimmed;
    });

    const parsedExtra = extraJson.trim();
    if (parsedExtra.length > 0 && parsedExtra !== '{}') {
      const json = JSON.parse(parsedExtra);
      if (json && typeof json === 'object' && !Array.isArray(json)) {
        Object.assign(payload, json as Record<string, unknown>);
      }
    }

    return payload;
  }, [extraJson, fields, formState]);

  const validateRequired = React.useCallback((): string | null => {
    for (const field of fields) {
      if (!field.required) continue;

      const rawValue = formState[field.key] ?? '';
      if (rawValue.trim().length === 0) {
        return `${field.label} boş ola bilməz`;
      }
    }

    return null;
  }, [fields, formState]);

  const onSubmit = React.useCallback(async () => {
    try {
      const requiredError = validateRequired();
      if (requiredError) {
        Alert.alert('Xəta', requiredError);
        return;
      }

      const payload = parsePayload();
      const itemId = editingItem ? getEntityId(editingItem) : null;

      setSubmitting(true);
      setError(null);

      if (editingItem && itemId !== null && api.update) {
        await api.update(itemId, payload);
      } else if (!editingItem && api.add) {
        await api.add(payload);
      } else {
        Alert.alert('Məlumat', 'Bu əməliyyat bu modul üçün aktiv deyil');
        return;
      }

      setFormVisible(false);
      await loadItems(search.trim().length > 0);
    } catch (submitError) {
      setError(toErrorMessage(submitError, 'Saxlama əməliyyatı alınmadı'));
    } finally {
      setSubmitting(false);
    }
  }, [api, editingItem, loadItems, parsePayload, search, validateRequired]);

  const onDelete = React.useCallback(
    (item: EntityItem) => {
      const itemId = getEntityId(item);
      if (!api.delete || itemId === null) {
        Alert.alert('Məlumat', 'Bu qeyd silinə bilmədi');
        return;
      }

      Alert.alert('Silmə təsdiqi', `${entityLabel} silinsin?`, [
        { text: 'Xeyr', style: 'cancel' },
        {
          text: 'Bəli',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setSubmitting(true);
                setError(null);
                await api.delete?.(itemId);
                await loadItems(search.trim().length > 0);
              } catch (deleteError) {
                setError(toErrorMessage(deleteError, 'Silmə əməliyyatı alınmadı'));
              } finally {
                setSubmitting(false);
              }
            })();
          },
        },
      ]);
    },
    [api, entityLabel, loadItems, search],
  );

  const onView = React.useCallback(
    async (item: EntityItem) => {
      const itemId = getEntityId(item);

      try {
        setSubmitting(true);
        const response = api.getById && itemId !== null ? await api.getById(itemId) : item;

        const detailObject = extractItem(response);
        const mergedDetail = {
          ...item,
          ...detailObject,
        };
        setDetailsItem(mergedDetail);
        setDetailsVisible(true);
      } catch (viewError) {
        setError(toErrorMessage(viewError, 'Detallar yüklənmədi'));
      } finally {
        setSubmitting(false);
      }
    },
    [api],
  );

  const closeDetailsModal = React.useCallback(() => {
    setDetailsVisible(false);
    setDetailsItem(null);
  }, []);

  const onEditFromDetails = React.useCallback(() => {
    if (!detailsItem) {
      return;
    }

    closeDetailsModal();
    openEditModal(detailsItem);
  }, [closeDetailsModal, detailsItem, openEditModal]);

  const onDeleteFromDetails = React.useCallback(() => {
    if (!detailsItem) {
      return;
    }

    closeDetailsModal();
    onDelete(detailsItem);
  }, [closeDetailsModal, detailsItem, onDelete]);

  const withResidentPropertyAction = React.useCallback(
    async (mode: 'bind' | 'unbind') => {
      if (!editingItem) return;

      const residentId = getEntityId(editingItem);
      if (residentId === null) {
        Alert.alert('Xəta', 'Resident ID tapılmadı');
        return;
      }

      const propertyId = Number(propertyIdInput.trim());
      if (!Number.isFinite(propertyId) || propertyId <= 0) {
        Alert.alert('Xəta', 'Property ID düzgün daxil edilməlidir');
        return;
      }

      try {
        setSubmitting(true);
        if (mode === 'bind' && api.bindProperty) {
          await api.bindProperty(residentId, { property_id: propertyId });
        }

        if (mode === 'unbind' && api.unbindProperty) {
          await api.unbindProperty(residentId, { property_id: propertyId });
        }

        await loadItems(search.trim().length > 0);
        Alert.alert('Uğurlu', mode === 'bind' ? 'Property bağlandı' : 'Property ayrıldı');
      } catch (bindingError) {
        setError(toErrorMessage(bindingError, 'Property əməliyyatı alınmadı'));
      } finally {
        setSubmitting(false);
      }
    },
    [api, editingItem, loadItems, propertyIdInput, search],
  );

  return (
    <AppPageLayout
      title={title}
      isDark={isDark}
      settingsRouteKey="settings"
      profileRouteKey="profile"
      contentStyle={styles.layoutContent}
      mtkOptions={mtkOptions.map(option => option.name)}
      initialMtk={selectedMtkName}
      onMtkChange={mtkName => {
        const matched = mtkOptions.find(option => option.name === mtkName);
        const nextMtkId = matched?.id ?? null;
        const isSameSelection =
          (effectiveSelectedMtkId === null && nextMtkId === null)
          || (effectiveSelectedMtkId !== null
            && nextMtkId !== null
            && String(effectiveSelectedMtkId) === String(nextMtkId));

        if (isSameSelection) {
          void loadItems(search.trim().length > 0);
          return;
        }

        dispatch(setSelectedManagementMtkId(nextMtkId));
      }}
      onMtkDropdownOpen={() => {
        void loadMtkOptions();
      }}
      scrollable
    >
      <View style={[styles.screen, isDark ? styles.screenDark : styles.screenLight]}>
        <View style={[styles.heroCard, isDark ? styles.heroCardDark : styles.heroCardLight]}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroHeader}>
            <View style={styles.heroTextWrap}>
              <Text style={[styles.heroEyebrow, isDark ? styles.textAccentDark : styles.textAccentLight]}>
                Management Panel
              </Text>
              <Text style={[styles.heroTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                {entityLabel}
              </Text>
              <Text style={[styles.heroDescription, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Məlumatları daha rahat idarə et, axtar, əlavə et və yenilə.
              </Text>
            </View>

            <View style={[styles.statsCard, isDark ? styles.statsCardDark : styles.statsCardLight]}>
              <Text style={[styles.statsLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Cəmi qeyd
              </Text>
              <Text style={[styles.statsValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                {items.length}
              </Text>
            </View>
          </View>

          {selectedMtkName ? (
            <View style={[styles.activeMtkBadge, isDark ? styles.activeMtkBadgeDark : styles.activeMtkBadgeLight]}>
              <Text style={[styles.activeMtkText, isDark ? styles.activeMtkTextDark : styles.activeMtkTextLight]}>
                Aktiv MTK: {selectedMtkName}
              </Text>
            </View>
          ) : null}

          <View style={styles.toolbarCard}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={searchPlaceholder}
              placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
              style={[styles.searchInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
            />

            <View style={styles.actionsRow}>
              <Pressable onPress={onSearchPress} style={[styles.actionButton, styles.ghostButton]}>
                <Text style={styles.ghostButtonText}>Axtar</Text>
              </Pressable>

              <Pressable onPress={() => void loadItems(false)} style={[styles.actionButton, styles.ghostButton]}>
                <Text style={styles.ghostButtonText}>Yenilə</Text>
              </Pressable>

              <Pressable onPress={openCreateModal} style={[styles.actionButton, styles.primaryButton]}>
                <Text style={styles.primaryButtonText}>+ Yeni qeyd</Text>
              </Pressable>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : items.length === 0 ? (
          <View style={[styles.emptyStateCard, isDark ? styles.panelDark : styles.panelLight]}>
            <Text style={[styles.emptyStateTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
              Boş görünür
            </Text>
            <Text style={[styles.emptyStateText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              {emptyMessage}
            </Text>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {items.map((item, index) => {
              const id = getEntityId(item);
              const previewData = getCardPreviewData(item, fields);

              return (
                <Pressable
                  onPress={() => void onView(item)}
                  key={id === null ? `${index}` : String(id)}
                  style={[styles.entityCard, isDark ? styles.panelDark : styles.panelLight]}
                >
                  <View style={styles.entityCardTop}>
                    <View style={styles.avatarBubble}>
                      <Text style={styles.avatarText}>
                        {getPrimaryText(item).charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.entityMainContent}>
                      <Text style={[styles.entityTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                        {getPrimaryText(item)}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={[styles.entitySubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}
                      >
                        {getSecondaryText(item)}
                      </Text>
                    </View>

                    <View style={[styles.idPill, isDark ? styles.idPillDark : styles.idPillLight]}>
                      <Text style={[styles.idPillText, isDark ? styles.idPillTextDark : styles.idPillTextLight]}>
                        {id ? `#${id}` : 'Qeyd'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.entityDivider} />

                  {previewData.length > 0 ? (
                    <View style={styles.previewGrid}>
                      {previewData.map(meta => (
                        <View key={`${meta.label}-${meta.value}`} style={[styles.previewItem, isDark ? styles.previewItemDark : styles.previewItemLight]}>
                          <Text style={[styles.previewLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                            {meta.label}
                          </Text>
                          <Text numberOfLines={1} style={[styles.previewValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                            {meta.value}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <View style={styles.cardHintRow}>
                    <Text style={[styles.cardHintText, isDark ? styles.textAccentDark : styles.textAccentLight]}>
                      Detalları aç
                    </Text>
                    <Text style={[styles.cardHintArrow, isDark ? styles.textAccentDark : styles.textAccentLight]}>›</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <Modal visible={formVisible} transparent animationType="slide" onRequestClose={closeFormModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalPanel, isDark ? styles.modalPanelDark : styles.modalPanelLight]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalEyebrow, isDark ? styles.textAccentDark : styles.textAccentLight]}>
                  {editingItem ? 'Update record' : 'Create record'}
                </Text>
                <Text style={[styles.modalTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                  {editingItem ? `${entityLabel} yenilə` : `${entityLabel} əlavə et`}
                </Text>
              </View>

              <Pressable onPress={closeFormModal} style={[styles.closeIconButton, isDark ? styles.closeIconButtonDark : styles.closeIconButtonLight]}>
                <Text style={[styles.closeIconText, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                  ✕
                </Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formGrid}>
                {fields.map(field => (
                  <View key={field.key} style={styles.formBlock}>
                    <Text style={[styles.formLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                      {field.label}
                      {field.required ? ' *' : ''}
                    </Text>

                    <TextInput
                      value={formState[field.key] ?? ''}
                      onChangeText={value => setFormState(prev => ({ ...prev, [field.key]: value }))}
                      keyboardType={keyboardTypeForField(field.type)}
                      multiline={Boolean(field.multiline)}
                      placeholder={`${field.label} daxil et`}
                      placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                      style={[
                        styles.formInput,
                        field.multiline ? styles.formInputMultiline : null,
                        isDark ? styles.formInputDark : styles.formInputLight,
                      ]}
                    />
                  </View>
                ))}
              </View>

              <View style={[styles.sectionCard, isDark ? styles.sectionCardDark : styles.sectionCardLight]}>
                <Text style={[styles.sectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                  Əlavə JSON
                </Text>
                <Text style={[styles.sectionSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  Opsional custom field-lər üçün istifadə edə bilərsən.
                </Text>

                <TextInput
                  value={extraJson}
                  onChangeText={setExtraJson}
                  multiline
                  placeholder='{"custom_key":"value"}'
                  placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                  style={[
                    styles.formInput,
                    styles.formInputMultiline,
                    styles.jsonInput,
                    isDark ? styles.formInputDark : styles.formInputLight,
                  ]}
                />
              </View>

              {enablePropertyBinding && editingItem && api.bindProperty && api.unbindProperty ? (
                <View style={[styles.sectionCard, isDark ? styles.bindSectionDark : styles.bindSectionLight]}>
                  <Text style={[styles.sectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                    Resident Property əməliyyatı
                  </Text>

                  <TextInput
                    value={propertyIdInput}
                    onChangeText={setPropertyIdInput}
                    keyboardType="numeric"
                    placeholder="Property ID"
                    placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                    style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                  />

                  <View style={styles.inlineButtons}>
                    <Pressable onPress={() => void withResidentPropertyAction('bind')} style={[styles.actionButton, styles.primaryButton]}>
                      <Text style={styles.primaryButtonText}>Bind</Text>
                    </Pressable>

                    <Pressable onPress={() => void withResidentPropertyAction('unbind')} style={[styles.actionButton, styles.dangerButton]}>
                      <Text style={styles.dangerButtonText}>Unbind</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable onPress={closeFormModal} style={[styles.footerButton, styles.footerGhostButton]}>
                <Text style={styles.footerGhostText}>Bağla</Text>
              </Pressable>

              <Pressable onPress={() => void onSubmit()} style={[styles.footerButton, styles.footerPrimaryButton]}>
                <Text style={styles.footerPrimaryText}>{submitting ? 'Gözlə...' : 'Yadda saxla'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={detailsVisible} transparent animationType="slide" onRequestClose={closeDetailsModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.detailsPanel, isDark ? styles.modalPanelDark : styles.modalPanelLight]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalEyebrow, isDark ? styles.textAccentDark : styles.textAccentLight]}>
                  Detailed View
                </Text>
                <Text style={[styles.modalTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                  {entityLabel} detalları
                </Text>
              </View>

              <Pressable onPress={closeDetailsModal} style={[styles.closeIconButton, isDark ? styles.closeIconButtonDark : styles.closeIconButtonLight]}>
                <Text style={[styles.closeIconText, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                  ✕
                </Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {detailsRows.length === 0 ? (
                <View style={[styles.emptyDetailsCard, isDark ? styles.emptyDetailsCardDark : styles.emptyDetailsCardLight]}>
                  <Text style={[styles.emptyDetailsText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    Detal məlumat tapılmadı.
                  </Text>
                </View>
              ) : (
                <View style={styles.detailsGrid}>
                  {detailsRows.map(row => (
                    <View
                      key={row.key}
                      style={[
                        styles.detailRowCard,
                        isDark ? styles.detailRowCardDark : styles.detailRowCardLight,
                        row.depth > 0 ? { marginLeft: Math.min(row.depth * 10, 30) } : null,
                      ]}
                    >
                      <Text style={[styles.detailRowPath, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                        {row.path}
                      </Text>
                      <Text style={[styles.detailRowLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                        {row.label}
                      </Text>
                      <Text style={[styles.detailRowValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                        {row.value}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.detailsActionRow}>
                <Pressable onPress={onEditFromDetails} style={[styles.actionButton, styles.primaryButton]}>
                  <Text style={styles.primaryButtonText}>Düzəliş et</Text>
                </Pressable>

                <Pressable onPress={onDeleteFromDetails} style={[styles.actionButton, styles.dangerButton]}>
                  <Text style={styles.dangerButtonText}>Sil</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {submitting ? (
        <View style={styles.submittingOverlay} pointerEvents="none">
          <View style={styles.submittingLoader}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        </View>
      ) : null}
    </AppPageLayout>
  );
}

const styles = StyleSheet.create({
  layoutContent: {
    paddingHorizontal: 14,
  },

  screen: {
    flex: 1,
    paddingBottom: 24,
  },
  screenLight: {
    backgroundColor: APP_LAYOUT_COLORS.backgroundLight,
  },
  screenDark: {
    backgroundColor: APP_LAYOUT_COLORS.backgroundDark,
  },

  heroCard: {
    overflow: 'hidden',
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  heroCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  heroCardDark: {
    backgroundColor: '#111114',
    borderColor: '#27272a',
  },
  heroGlowOne: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(37,99,235,0.18)',
  },
  heroGlowTwo: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroEyebrow: {
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'WorkSans-Bold',
  },
  heroDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'WorkSans-Medium',
    maxWidth: 280,
  },

  statsCard: {
    minWidth: 96,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCardLight: {
    backgroundColor: '#f8fbff',
    borderColor: '#dbeafe',
  },
  statsCardDark: {
    backgroundColor: '#151a22',
    borderColor: '#1f3b68',
  },
  statsLabel: {
    fontSize: 11,
    fontFamily: 'WorkSans-Medium',
  },
  statsValue: {
    marginTop: 4,
    fontSize: 24,
    fontFamily: 'WorkSans-Bold',
  },

  activeMtkBadge: {
    alignSelf: 'flex-start',
    marginTop: 16,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  activeMtkBadgeLight: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  activeMtkBadgeDark: {
    backgroundColor: '#172554',
    borderColor: '#1d4ed8',
  },
  activeMtkText: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  activeMtkTextLight: {
    color: '#1d4ed8',
  },
  activeMtkTextDark: {
    color: '#bfdbfe',
  },

  toolbarCard: {
    marginTop: 16,
    gap: 12,
  },
  searchInput: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'WorkSans-Medium',
  },
  searchInputLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
    color: '#0f172a',
  },
  searchInputDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
    color: '#f4f4f5',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionButton: {
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButton: {
    backgroundColor: '#334155',
  },
  ghostButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'WorkSans-SemiBold',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },

  loadingBox: {
    minHeight: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardsList: {
    gap: 12,
  },
  entityCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  panelLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  panelDark: {
    backgroundColor: '#111114',
    borderColor: '#27272a',
  },
  entityCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarBubble: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'WorkSans-Bold',
  },
  entityMainContent: {
    flex: 1,
  },
  entityTitle: {
    fontSize: 17,
    fontFamily: 'WorkSans-Bold',
  },
  entitySubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'WorkSans-Regular',
  },
  idPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  idPillLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  idPillDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  idPillText: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  idPillTextLight: {
    color: '#475569',
  },
  idPillTextDark: {
    color: '#d4d4d8',
  },
  entityDivider: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.16)',
    marginVertical: 14,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewItem: {
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  previewItemLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  previewItemDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  previewLabel: {
    fontSize: 10,
    fontFamily: 'WorkSans-SemiBold',
    marginBottom: 2,
  },
  previewValue: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  cardHintRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHintText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
  cardHintArrow: {
    fontSize: 18,
    fontFamily: 'WorkSans-Bold',
  },
  smallAction: {
    minWidth: 84,
    minHeight: 40,
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtleAction: {
    backgroundColor: '#334155',
  },
  subtleActionText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  primaryMiniAction: {
    backgroundColor: '#2563eb',
  },
  primaryMiniActionText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  dangerMiniAction: {
    backgroundColor: '#dc2626',
  },
  dangerMiniActionText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },

  emptyStateCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'WorkSans-Bold',
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
    textAlign: 'center',
  },

  textPrimaryLight: {
    color: '#0f172a',
  },
  textPrimaryDark: {
    color: '#f5f5f5',
  },
  textMutedLight: {
    color: '#64748b',
  },
  textMutedDark: {
    color: '#a1a1aa',
  },
  textAccentLight: {
    color: '#2563eb',
  },
  textAccentDark: {
    color: '#60a5fa',
  },

  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.62)',
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 0,
  },
  modalPanel: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    padding: 18,
    maxHeight: '92%',
    width: '100%',
    alignSelf: 'stretch',
  },
  detailsPanel: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    padding: 18,
    maxHeight: '90%',
    width: '100%',
    alignSelf: 'stretch',
  },
  modalPanelLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  modalPanelDark: {
    backgroundColor: '#101012',
    borderColor: '#27272a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalEyebrow: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'WorkSans-Bold',
  },
  closeIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  closeIconButtonLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  closeIconButtonDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  closeIconText: {
    fontSize: 16,
    fontFamily: 'WorkSans-Bold',
  },

  modalScroll: {
    maxHeight: 500,
  },
  modalScrollContent: {
    paddingBottom: 12,
  },
  formGrid: {
    gap: 12,
  },
  formBlock: {
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  formInput: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'WorkSans-Medium',
  },
  formInputLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
    color: '#0f172a',
  },
  formInputDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
    color: '#f4f4f5',
  },
  formInputMultiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },

  sectionCard: {
    marginTop: 16,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
  },
  sectionCardLight: {
    backgroundColor: '#f8fbff',
    borderColor: '#dbeafe',
  },
  sectionCardDark: {
    backgroundColor: '#141923',
    borderColor: '#1f3b68',
  },
  bindSectionLight: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  bindSectionDark: {
    backgroundColor: '#221214',
    borderColor: '#7f1d1d',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'WorkSans-Bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
    marginBottom: 12,
  },

  inlineButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    flexWrap: 'wrap',
  },

  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  footerButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerGhostButton: {
    backgroundColor: '#334155',
  },
  footerPrimaryButton: {
    backgroundColor: '#2563eb',
  },
  footerGhostText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'WorkSans-Bold',
  },
  footerPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'WorkSans-Bold',
  },
  detailsActionRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  detailsGrid: {
    gap: 10,
  },
  detailRowCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  detailRowCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  detailRowCardDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  detailRowLabel: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
    marginBottom: 4,
  },
  detailRowPath: {
    fontSize: 10,
    fontFamily: 'WorkSans-Regular',
    marginBottom: 2,
  },
  detailRowValue: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'WorkSans-SemiBold',
  },
  emptyDetailsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  emptyDetailsCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  emptyDetailsCardDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  emptyDetailsText: {
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
  },
  jsonInput: {
    fontFamily: 'Courier',
  },

  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submittingLoader: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});