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
import { ArrowLeft } from 'lucide-react-native';

import {
  extractItem,
  extractItems,
  extractPaginationMeta,
  getEntityId,
  getValueByPath,
  toErrorMessage,
} from '../../../../components/management/management-utils';
import { useThemeMode } from '../../../../hooks/use-theme';
import { blocksAPI, buildingsAPI, complexesAPI, propertiesAPI, residentsAPI } from '../../../../services/management';
import { selectSelectedGlobalMtkId } from '../../../../store/global-mtk-slice';
import { useAppSelector } from '../../../../store/hooks';
import {
  selectSelectedManagementBlockId,
  selectSelectedManagementBuildingId,
  selectSelectedManagementComplexId,
  selectSelectedManagementMtkId,
} from '../../../../store/management-filter-slice';
import { residentStyles as styles } from './styles';
import { EntityItem } from './types';
import { asText, getResidentName } from './utils';

type RouteParams = {
  item: EntityItem;
};

type SelectOption = {
  id: string | number;
  name: string;
};

const OPTIONS_PAGE_SIZE = 40;

const mergeUniqueOptions = (base: SelectOption[], incoming: SelectOption[]) => {
  const byId = new Map<string, SelectOption>();
  [...base, ...incoming].forEach(option => byId.set(String(option.id), option));
  return Array.from(byId.values());
};

const toOptionName = (entry: EntityItem, fallbackPrefix: string): string => {
  const name = asText(entry.name).trim();
  if (name.length > 0) {
    return name;
  }

  const apartmentNumber = asText(entry.apartment_number).trim();
  if (apartmentNumber.length > 0) {
    return `${fallbackPrefix} ${apartmentNumber}`;
  }

  const id = getEntityId(entry);
  return id === null ? fallbackPrefix : `${fallbackPrefix} #${String(id)}`;
};

export default function ManagementResidentPropertiesRouteScreen() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const selectedGlobalMtkId = useAppSelector(selectSelectedGlobalMtkId);
  const selectedManagementMtkId = useAppSelector(selectSelectedManagementMtkId);
  const selectedFilterComplexId = useAppSelector(selectSelectedManagementComplexId);
  const selectedFilterBuildingId = useAppSelector(selectSelectedManagementBuildingId);
  const selectedFilterBlockId = useAppSelector(selectSelectedManagementBlockId);
  const selectedMtkId = selectedGlobalMtkId ?? selectedManagementMtkId;

  const initialItem = (route.params as RouteParams | undefined)?.item ?? null;
  const residentId = React.useMemo(() => (initialItem ? getEntityId(initialItem) : null), [initialItem]);

  const [item, setItem] = React.useState<EntityItem | null>(initialItem);
  const [loading, setLoading] = React.useState(Boolean(initialItem));
  const [binding, setBinding] = React.useState(false);

  const [bindModalVisible, setBindModalVisible] = React.useState(false);

  const [complexId, setComplexId] = React.useState<string>(selectedFilterComplexId !== null ? String(selectedFilterComplexId) : '');
  const [buildingId, setBuildingId] = React.useState<string>(selectedFilterBuildingId !== null ? String(selectedFilterBuildingId) : '');
  const [blockId, setBlockId] = React.useState<string>(selectedFilterBlockId !== null ? String(selectedFilterBlockId) : '');
  const [propertyId, setPropertyId] = React.useState<string>('');

  const [complexOptions, setComplexOptions] = React.useState<SelectOption[]>([]);
  const [buildingOptions, setBuildingOptions] = React.useState<SelectOption[]>([]);
  const [blockOptions, setBlockOptions] = React.useState<SelectOption[]>([]);
  const [propertyOptions, setPropertyOptions] = React.useState<SelectOption[]>([]);

  const [complexQuery, setComplexQuery] = React.useState('');
  const [buildingQuery, setBuildingQuery] = React.useState('');
  const [blockQuery, setBlockQuery] = React.useState('');
  const [propertyQuery, setPropertyQuery] = React.useState('');

  const [debouncedComplexQuery, setDebouncedComplexQuery] = React.useState('');
  const [debouncedBuildingQuery, setDebouncedBuildingQuery] = React.useState('');
  const [debouncedBlockQuery, setDebouncedBlockQuery] = React.useState('');
  const [debouncedPropertyQuery, setDebouncedPropertyQuery] = React.useState('');

  const [complexPage, setComplexPage] = React.useState(1);
  const [buildingPage, setBuildingPage] = React.useState(1);
  const [blockPage, setBlockPage] = React.useState(1);
  const [propertyPage, setPropertyPage] = React.useState(1);

  const [complexHasMore, setComplexHasMore] = React.useState(false);
  const [buildingHasMore, setBuildingHasMore] = React.useState(false);
  const [blockHasMore, setBlockHasMore] = React.useState(false);
  const [propertyHasMore, setPropertyHasMore] = React.useState(false);

  const [complexLoading, setComplexLoading] = React.useState(false);
  const [buildingLoading, setBuildingLoading] = React.useState(false);
  const [blockLoading, setBlockLoading] = React.useState(false);
  const [propertyLoading, setPropertyLoading] = React.useState(false);

  const [complexLoadingMore, setComplexLoadingMore] = React.useState(false);
  const [buildingLoadingMore, setBuildingLoadingMore] = React.useState(false);
  const [blockLoadingMore, setBlockLoadingMore] = React.useState(false);
  const [propertyLoadingMore, setPropertyLoadingMore] = React.useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedComplexQuery(complexQuery.trim()), 280);
    return () => clearTimeout(timeout);
  }, [complexQuery]);

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedBuildingQuery(buildingQuery.trim()), 280);
    return () => clearTimeout(timeout);
  }, [buildingQuery]);

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedBlockQuery(blockQuery.trim()), 280);
    return () => clearTimeout(timeout);
  }, [blockQuery]);

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedPropertyQuery(propertyQuery.trim()), 280);
    return () => clearTimeout(timeout);
  }, [propertyQuery]);

  const loadResidentDetail = React.useCallback(async (): Promise<boolean> => {
    if (residentId === null) {
      return false;
    }

    try {
      const response = await residentsAPI.getById(residentId);
      const detail = extractItem(response);
      setItem(prev => (prev ? { ...prev, ...detail } : { ...(initialItem ?? {}), ...detail }));
      return true;
    } catch (loadError) {
      Alert.alert('Xeta', toErrorMessage(loadError, 'Sakin detallari yuklenmedi'));
      return false;
    }
  }, [initialItem, residentId]);

  const loadComplexesPage = React.useCallback(
    async (page: number, append: boolean) => {
      if (!bindModalVisible) {
        return;
      }

      if (append) {
        setComplexLoadingMore(true);
      } else {
        setComplexLoading(true);
      }

      try {
        const params: Record<string, unknown> = {
          page,
          per_page: OPTIONS_PAGE_SIZE,
        };

        if (selectedMtkId !== null) {
          params.mtk_ids = [selectedMtkId];
          params.mtk_id = selectedMtkId;
          params.mth_ids = selectedMtkId;
        }

        if (debouncedComplexQuery.length > 0) {
          params.name = debouncedComplexQuery;
        }

        const response = await complexesAPI.search(params);
        const options = extractItems(response)
          .map(entry => {
            const id = getEntityId(entry);
            if (id === null) return null;
            return { id, name: toOptionName(entry, 'Complex') } as SelectOption;
          })
          .filter((option): option is SelectOption => option !== null);

        const pagination = extractPaginationMeta(response, {
          requestedPage: page,
          requestedPerPage: OPTIONS_PAGE_SIZE,
          receivedCount: options.length,
        });

        setComplexPage(page);
        setComplexHasMore(pagination.hasMore);
        setComplexOptions(prev => (append ? mergeUniqueOptions(prev, options) : options));
      } catch {
        if (!append) {
          setComplexOptions([]);
          setComplexPage(1);
          setComplexHasMore(false);
        }
      } finally {
        if (append) {
          setComplexLoadingMore(false);
        } else {
          setComplexLoading(false);
        }
      }
    },
    [bindModalVisible, debouncedComplexQuery, selectedMtkId],
  );

  const loadBuildingsPage = React.useCallback(
    async (page: number, append: boolean) => {
      if (!bindModalVisible || complexId.trim().length === 0) {
        if (!append) {
          setBuildingOptions([]);
          setBuildingPage(1);
          setBuildingHasMore(false);
        }
        return;
      }

      if (append) {
        setBuildingLoadingMore(true);
      } else {
        setBuildingLoading(true);
      }

      try {
        const params: Record<string, unknown> = {
          page,
          per_page: OPTIONS_PAGE_SIZE,
          complex_ids: [complexId],
          complex_id: complexId,
        };

        if (selectedMtkId !== null) {
          params.mtk_ids = [selectedMtkId];
          params.mtk_id = selectedMtkId;
          params.mth_ids = selectedMtkId;
        }

        if (debouncedBuildingQuery.length > 0) {
          params.name = debouncedBuildingQuery;
        }

        const response = await buildingsAPI.search(params);
        const options = extractItems(response)
          .map(entry => {
            const id = getEntityId(entry);
            if (id === null) return null;
            return { id, name: toOptionName(entry, 'Bina') } as SelectOption;
          })
          .filter((option): option is SelectOption => option !== null);

        const pagination = extractPaginationMeta(response, {
          requestedPage: page,
          requestedPerPage: OPTIONS_PAGE_SIZE,
          receivedCount: options.length,
        });

        setBuildingPage(page);
        setBuildingHasMore(pagination.hasMore);
        setBuildingOptions(prev => (append ? mergeUniqueOptions(prev, options) : options));
      } catch {
        if (!append) {
          setBuildingOptions([]);
          setBuildingPage(1);
          setBuildingHasMore(false);
        }
      } finally {
        if (append) {
          setBuildingLoadingMore(false);
        } else {
          setBuildingLoading(false);
        }
      }
    },
    [bindModalVisible, complexId, debouncedBuildingQuery, selectedMtkId],
  );

  const loadBlocksPage = React.useCallback(
    async (page: number, append: boolean) => {
      if (!bindModalVisible || buildingId.trim().length === 0) {
        if (!append) {
          setBlockOptions([]);
          setBlockPage(1);
          setBlockHasMore(false);
        }
        return;
      }

      if (append) {
        setBlockLoadingMore(true);
      } else {
        setBlockLoading(true);
      }

      try {
        const params: Record<string, unknown> = {
          page,
          per_page: OPTIONS_PAGE_SIZE,
          building_ids: [buildingId],
          building_id: buildingId,
        };

        if (complexId.trim().length > 0) {
          params.complex_ids = [complexId];
          params.complex_id = complexId;
        }

        if (selectedMtkId !== null) {
          params.mtk_ids = [selectedMtkId];
          params.mtk_id = selectedMtkId;
          params.mth_ids = selectedMtkId;
        }

        if (debouncedBlockQuery.length > 0) {
          params.name = debouncedBlockQuery;
        }

        const response = await blocksAPI.search(params);
        const options = extractItems(response)
          .map(entry => {
            const id = getEntityId(entry);
            if (id === null) return null;
            return { id, name: toOptionName(entry, 'Blok') } as SelectOption;
          })
          .filter((option): option is SelectOption => option !== null);

        const pagination = extractPaginationMeta(response, {
          requestedPage: page,
          requestedPerPage: OPTIONS_PAGE_SIZE,
          receivedCount: options.length,
        });

        setBlockPage(page);
        setBlockHasMore(pagination.hasMore);
        setBlockOptions(prev => (append ? mergeUniqueOptions(prev, options) : options));
      } catch {
        if (!append) {
          setBlockOptions([]);
          setBlockPage(1);
          setBlockHasMore(false);
        }
      } finally {
        if (append) {
          setBlockLoadingMore(false);
        } else {
          setBlockLoading(false);
        }
      }
    },
    [bindModalVisible, buildingId, complexId, debouncedBlockQuery, selectedMtkId],
  );

  const loadPropertiesPage = React.useCallback(
    async (page: number, append: boolean) => {
      if (!bindModalVisible || complexId.trim().length === 0) {
        if (!append) {
          setPropertyOptions([]);
          setPropertyPage(1);
          setPropertyHasMore(false);
        }
        return;
      }

      if (append) {
        setPropertyLoadingMore(true);
      } else {
        setPropertyLoading(true);
      }

      try {
        const params: Record<string, unknown> = {
          page,
          per_page: OPTIONS_PAGE_SIZE,
          complex_ids: [complexId],
          complex_id: complexId,
        };

        if (selectedMtkId !== null) {
          params.mtk_ids = [selectedMtkId];
          params.mtk_id = selectedMtkId;
          params.mth_ids = selectedMtkId;
        }

        if (buildingId.trim().length > 0) {
          params.building_ids = [buildingId];
          params.building_id = buildingId;
        }

        if (blockId.trim().length > 0) {
          params.block_ids = [blockId];
          params.block_id = blockId;
        }

        if (debouncedPropertyQuery.length > 0) {
          params.name = debouncedPropertyQuery;
        }

        const response = await propertiesAPI.search(params);
        const options = extractItems(response)
          .map(entry => {
            const id = getEntityId(entry);
            if (id === null) return null;
            return { id, name: toOptionName(entry, 'Menzil') } as SelectOption;
          })
          .filter((option): option is SelectOption => option !== null);

        const pagination = extractPaginationMeta(response, {
          requestedPage: page,
          requestedPerPage: OPTIONS_PAGE_SIZE,
          receivedCount: options.length,
        });

        setPropertyPage(page);
        setPropertyHasMore(pagination.hasMore);
        setPropertyOptions(prev => (append ? mergeUniqueOptions(prev, options) : options));
      } catch {
        if (!append) {
          setPropertyOptions([]);
          setPropertyPage(1);
          setPropertyHasMore(false);
        }
      } finally {
        if (append) {
          setPropertyLoadingMore(false);
        } else {
          setPropertyLoading(false);
        }
      }
    },
    [bindModalVisible, blockId, buildingId, complexId, debouncedPropertyQuery, selectedMtkId],
  );

  React.useEffect(() => {
    if (!bindModalVisible) {
      return;
    }

    void loadComplexesPage(1, false);
  }, [bindModalVisible, loadComplexesPage]);

  React.useEffect(() => {
    if (!bindModalVisible) {
      return;
    }

    void loadBuildingsPage(1, false);
  }, [bindModalVisible, complexId, loadBuildingsPage]);

  React.useEffect(() => {
    if (!bindModalVisible) {
      return;
    }

    void loadBlocksPage(1, false);
  }, [bindModalVisible, buildingId, loadBlocksPage]);

  React.useEffect(() => {
    if (!bindModalVisible) {
      return;
    }

    void loadPropertiesPage(1, false);
  }, [bindModalVisible, complexId, buildingId, blockId, loadPropertiesPage]);

  useFocusEffect(
    React.useCallback(() => {
      if (residentId === null) {
        setLoading(false);
        return undefined;
      }

      let isMounted = true;

      void (async () => {
        try {
          setLoading(true);
          await loadResidentDetail();
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      })();

      return () => {
        isMounted = false;
      };
    }, [loadResidentDetail, residentId]),
  );

  const onOpenBindModal = React.useCallback(() => {
    setComplexId(selectedFilterComplexId !== null ? String(selectedFilterComplexId) : '');
    setBuildingId(selectedFilterBuildingId !== null ? String(selectedFilterBuildingId) : '');
    setBlockId(selectedFilterBlockId !== null ? String(selectedFilterBlockId) : '');
    setPropertyId('');
    setComplexQuery('');
    setBuildingQuery('');
    setBlockQuery('');
    setPropertyQuery('');
    setBindModalVisible(true);
  }, [selectedFilterBlockId, selectedFilterBuildingId, selectedFilterComplexId]);

  const onLoadMoreComplexes = React.useCallback(() => {
    if (complexLoading || complexLoadingMore || !complexHasMore) {
      return;
    }

    void loadComplexesPage(complexPage + 1, true);
  }, [complexHasMore, complexLoading, complexLoadingMore, complexPage, loadComplexesPage]);

  const onLoadMoreBuildings = React.useCallback(() => {
    if (buildingLoading || buildingLoadingMore || !buildingHasMore) {
      return;
    }

    void loadBuildingsPage(buildingPage + 1, true);
  }, [buildingHasMore, buildingLoading, buildingLoadingMore, buildingPage, loadBuildingsPage]);

  const onLoadMoreBlocks = React.useCallback(() => {
    if (blockLoading || blockLoadingMore || !blockHasMore) {
      return;
    }

    void loadBlocksPage(blockPage + 1, true);
  }, [blockHasMore, blockLoading, blockLoadingMore, blockPage, loadBlocksPage]);

  const onLoadMoreProperties = React.useCallback(() => {
    if (propertyLoading || propertyLoadingMore || !propertyHasMore) {
      return;
    }

    void loadPropertiesPage(propertyPage + 1, true);
  }, [loadPropertiesPage, propertyHasMore, propertyLoading, propertyLoadingMore, propertyPage]);

  const withPropertyAction = React.useCallback(
    async (mode: 'bind' | 'unbind', propertyIdOverride?: number) => {
      if (residentId === null) {
        Alert.alert('Xeta', 'Sakin ID tapilmadi');
        return;
      }

      const parsedPropertyId = propertyIdOverride ?? Number(propertyId.trim());
      if (!Number.isFinite(parsedPropertyId) || parsedPropertyId <= 0) {
        Alert.alert('Xeta', 'Menzil secin');
        return;
      }

      try {
        setBinding(true);
        if (mode === 'bind') {
          const payload: Record<string, unknown> = { property_id: parsedPropertyId };
          if (selectedMtkId !== null) payload.mtk_id = selectedMtkId;
          if (complexId.trim().length > 0) payload.complex_id = complexId;
          await residentsAPI.bindProperty(residentId, payload);
        } else {
          await residentsAPI.unbindProperty(residentId, { property_id: parsedPropertyId });
        }

        await loadResidentDetail();

        if (mode === 'bind') {
          setPropertyId('');
          setBindModalVisible(false);
        }

        Alert.alert('Ugurlu', mode === 'bind' ? 'Menzil sakine baglandi' : 'Menzil sakinden ayrildi');
      } catch (actionError) {
        Alert.alert('Xeta', toErrorMessage(actionError, 'Menzil emeliyyati ugursuz oldu'));
      } finally {
        setBinding(false);
      }
    },
    [complexId, loadResidentDetail, propertyId, residentId, selectedMtkId],
  );

  const boundProperties = React.useMemo(() => {
    const raw = getValueByPath(item, 'property_residents');
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw.filter(entry => entry && typeof entry === 'object') as Array<Record<string, unknown>>;
  }, [item]);

  const resolvePropertyId = React.useCallback((entry: Record<string, unknown>): number | null => {
    const candidates = [
      entry.property_id,
      getValueByPath(entry, 'property_id'),
      getValueByPath(entry, 'property.id'),
      getValueByPath(entry, 'sub_data.property.id'),
      entry.id,
    ];

    for (const candidate of candidates) {
      const parsed = Number(asText(candidate).trim());
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return null;
  }, []);

  const resolvePropertyName = React.useCallback(
    (entry: Record<string, unknown>): string => {
      const candidates = [
        entry.property_name,
        getValueByPath(entry, 'name'),
        getValueByPath(entry, 'property.name'),
        getValueByPath(entry, 'sub_data.property.name'),
      ];

      for (const candidate of candidates) {
        const text = asText(candidate).trim();
        if (text.length > 0) {
          return text;
        }
      }

      const apartmentNumber =
        asText(entry.apartment_number).trim() || asText(getValueByPath(entry, 'property.apartment_number')).trim();
      if (apartmentNumber.length > 0) {
        return `Menzil ${apartmentNumber}`;
      }

      const propertyIdValue = resolvePropertyId(entry);
      return propertyIdValue === null ? 'Menzil' : `Menzil #${propertyIdValue}`;
    },
    [resolvePropertyId],
  );

  const selectedBuildingName = buildingOptions.find(option => String(option.id) === buildingId)?.name ?? 'Bina secin';
  const selectedBlockName = blockOptions.find(option => String(option.id) === blockId)?.name ?? 'Blok secin';
  const selectedPropertyName = propertyOptions.find(option => String(option.id) === propertyId)?.name ?? 'Menzil secin';

  return (
    <View
      style={[
        styles.detailRouteRoot,
        isDark ? styles.detailRouteRootDark : styles.detailRouteRootLight,
        {
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {loading ? (
        <View style={styles.centerStateWrap}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <View style={styles.formScreenContainer}>
          <View style={styles.formScreenHeader}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={10}
              style={[styles.detailBackButton, isDark ? styles.detailBackButtonDark : styles.detailBackButtonLight]}
            >
              <ArrowLeft size={16} color={isDark ? '#f5f5f5' : '#0f172a'} strokeWidth={2.4} />
              <Text style={[styles.detailBackButtonText, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>Geri</Text>
            </Pressable>
          </View>

          <View style={styles.formScreenBody}>
            <ScrollView style={styles.modalScroll} contentContainerStyle={[styles.modalScrollContent, styles.detailScreenScrollContent]}>
              <View style={[styles.viewSectionCard, isDark ? styles.viewSectionCardDark : styles.viewSectionCardLight]}>
                <Text style={[styles.viewSectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                  Sakinin menzilleri
                </Text>
                <Text style={[styles.emptyText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  {item ? getResidentName(item) : '-'}
                </Text>
              </View>

              <View style={[styles.viewSectionCard, isDark ? styles.viewSectionCardDark : styles.viewSectionCardLight]}>
                <Text style={[styles.viewSectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                  Emeliyyatlar
                </Text>

                <Pressable
                  onPress={onOpenBindModal}
                  style={[styles.screenActionButton, styles.screenActionPrimaryButton]}
                >
                  <Text style={styles.screenActionPrimaryText}>Menzil bagla</Text>
                </Pressable>
              </View>

              <View style={[styles.viewSectionCard, isDark ? styles.viewSectionCardDark : styles.viewSectionCardLight]}>
                <Text style={[styles.viewSectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                  Bagli menziller
                </Text>

                {boundProperties.length > 0 ? (
                  <View style={localStyles.boundListWrap}>
                    {boundProperties.map((entry, index) => {
                      const propertyIdValue = resolvePropertyId(entry);
                      const propertyName = resolvePropertyName(entry);
                      const key = propertyIdValue === null ? `bound-${index}` : `bound-${propertyIdValue}`;

                      return (
                        <View key={key} style={[localStyles.boundItem, isDark ? localStyles.boundItemDark : localStyles.boundItemLight]}>
                          <Pressable
                            onPress={() => {
                              if (propertyIdValue !== null) {
                                const nestedProperty = getValueByPath(entry, 'property');
                                const target: EntityItem =
                                  nestedProperty && typeof nestedProperty === 'object' && !Array.isArray(nestedProperty)
                                    ? ({ ...(nestedProperty as EntityItem), id: propertyIdValue } as EntityItem)
                                    : ({ id: propertyIdValue, name: propertyName } as EntityItem);
                                navigation.push('ManagementPropertyView', { item: target });
                              }
                            }}
                            style={localStyles.boundMeta}
                          >
                            <Text style={[localStyles.boundName, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]} numberOfLines={1}>
                              {propertyName}
                            </Text>
                            <Text style={[localStyles.boundSub, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                              ID: {propertyIdValue === null ? '-' : String(propertyIdValue)}
                            </Text>
                            <Text style={[localStyles.boundLink, isDark ? styles.textAccentDark : styles.textAccentLight]}>
                              Detala kec
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              if (propertyIdValue !== null) {
                                void withPropertyAction('unbind', propertyIdValue);
                              }
                            }}
                            disabled={binding || propertyIdValue === null}
                            style={[styles.screenActionButton, styles.screenActionDangerButton, binding ? styles.footerButtonDisabled : null]}
                          >
                            <Text style={styles.screenActionPrimaryText}>Ayir</Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={[localStyles.emptyBoundText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    Hazirda bagli menzil yoxdur
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      <Modal
        visible={bindModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!binding) {
            setBindModalVisible(false);
          }
        }}
      >
        <View style={localStyles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!binding) {
                setBindModalVisible(false);
              }
            }}
          />

          <View style={[localStyles.modalCard, isDark ? localStyles.modalCardDark : localStyles.modalCardLight]}>
            <Text style={[styles.viewSectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
              Menzil bagla
            </Text>

            <Text style={[styles.emptyText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              Kompleks {'>'} Bina {'>'} Blok {'>'} Menzil secin
            </Text>

            <View style={localStyles.selectorWrap}>
              <Text style={[localStyles.selectorLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Complex</Text>
              <TextInput
                value={complexQuery}
                onChangeText={setComplexQuery}
                placeholder="Complex axtar"
                placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
              />
              <ScrollView style={localStyles.selectorScroll} nestedScrollEnabled>
                {complexOptions.map(option => {
                  const selected = String(option.id) === complexId;
                  return (
                    <Pressable
                      key={String(option.id)}
                      onPress={() => {
                        setComplexId(String(option.id));
                        setBuildingId('');
                        setBlockId('');
                        setPropertyId('');
                      }}
                      style={[localStyles.selectorItem, selected ? localStyles.selectorItemSelected : null]}
                    >
                      <Text style={[localStyles.selectorItemText, selected ? localStyles.selectorItemTextSelected : null]}>{option.name}</Text>
                    </Pressable>
                  );
                })}
                {complexLoadingMore ? (
                  <View style={localStyles.inlineLoader}><ActivityIndicator size="small" color="#0ea5e9" /></View>
                ) : null}
                {complexHasMore ? (
                  <Pressable onPress={onLoadMoreComplexes} style={localStyles.moreButton}><Text style={localStyles.moreButtonText}>Daha cox</Text></Pressable>
                ) : null}
              </ScrollView>
            </View>

            <View style={localStyles.selectorWrap}>
              <Text style={[localStyles.selectorLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Bina</Text>
              <TextInput
                value={buildingQuery}
                onChangeText={setBuildingQuery}
                placeholder="Bina axtar"
                placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                editable={complexId.length > 0}
              />
              <Text style={[localStyles.selectorSelected, isDark ? styles.textMutedDark : styles.textMutedLight]}>Secilen: {selectedBuildingName}</Text>
              <ScrollView style={localStyles.selectorScroll} nestedScrollEnabled>
                {buildingOptions.map(option => {
                  const selected = String(option.id) === buildingId;
                  return (
                    <Pressable
                      key={String(option.id)}
                      onPress={() => {
                        setBuildingId(String(option.id));
                        setBlockId('');
                        setPropertyId('');
                      }}
                      style={[localStyles.selectorItem, selected ? localStyles.selectorItemSelected : null]}
                    >
                      <Text style={[localStyles.selectorItemText, selected ? localStyles.selectorItemTextSelected : null]}>{option.name}</Text>
                    </Pressable>
                  );
                })}
                {buildingLoadingMore ? (
                  <View style={localStyles.inlineLoader}><ActivityIndicator size="small" color="#0ea5e9" /></View>
                ) : null}
                {buildingHasMore ? (
                  <Pressable onPress={onLoadMoreBuildings} style={localStyles.moreButton}><Text style={localStyles.moreButtonText}>Daha cox</Text></Pressable>
                ) : null}
              </ScrollView>
            </View>

            <View style={localStyles.selectorWrap}>
              <Text style={[localStyles.selectorLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Blok</Text>
              <TextInput
                value={blockQuery}
                onChangeText={setBlockQuery}
                placeholder="Blok axtar"
                placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                editable={buildingId.length > 0}
              />
              <Text style={[localStyles.selectorSelected, isDark ? styles.textMutedDark : styles.textMutedLight]}>Secilen: {selectedBlockName}</Text>
              <ScrollView style={localStyles.selectorScroll} nestedScrollEnabled>
                {blockOptions.map(option => {
                  const selected = String(option.id) === blockId;
                  return (
                    <Pressable
                      key={String(option.id)}
                      onPress={() => {
                        setBlockId(String(option.id));
                        setPropertyId('');
                      }}
                      style={[localStyles.selectorItem, selected ? localStyles.selectorItemSelected : null]}
                    >
                      <Text style={[localStyles.selectorItemText, selected ? localStyles.selectorItemTextSelected : null]}>{option.name}</Text>
                    </Pressable>
                  );
                })}
                {blockLoadingMore ? (
                  <View style={localStyles.inlineLoader}><ActivityIndicator size="small" color="#0ea5e9" /></View>
                ) : null}
                {blockHasMore ? (
                  <Pressable onPress={onLoadMoreBlocks} style={localStyles.moreButton}><Text style={localStyles.moreButtonText}>Daha cox</Text></Pressable>
                ) : null}
              </ScrollView>
            </View>

            <View style={localStyles.selectorWrap}>
              <Text style={[localStyles.selectorLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Menzil</Text>
              <TextInput
                value={propertyQuery}
                onChangeText={setPropertyQuery}
                placeholder="Menzil axtar"
                placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                editable={complexId.length > 0}
              />
              <Text style={[localStyles.selectorSelected, isDark ? styles.textMutedDark : styles.textMutedLight]}>Secilen: {selectedPropertyName}</Text>
              <ScrollView style={localStyles.selectorScroll} nestedScrollEnabled>
                {propertyOptions.map(option => {
                  const selected = String(option.id) === propertyId;
                  return (
                    <Pressable
                      key={String(option.id)}
                      onPress={() => setPropertyId(String(option.id))}
                      style={[localStyles.selectorItem, selected ? localStyles.selectorItemSelected : null]}
                    >
                      <Text style={[localStyles.selectorItemText, selected ? localStyles.selectorItemTextSelected : null]}>{option.name}</Text>
                    </Pressable>
                  );
                })}
                {propertyLoadingMore ? (
                  <View style={localStyles.inlineLoader}><ActivityIndicator size="small" color="#0ea5e9" /></View>
                ) : null}
                {propertyHasMore ? (
                  <Pressable onPress={onLoadMoreProperties} style={localStyles.moreButton}><Text style={localStyles.moreButtonText}>Daha cox</Text></Pressable>
                ) : null}
              </ScrollView>
            </View>

            <View style={localStyles.modalActions}>
              <Pressable
                onPress={() => setBindModalVisible(false)}
                style={[styles.screenActionButton, isDark ? styles.screenActionButtonDarkGhost : styles.screenActionButtonLightGhost]}
                disabled={binding}
              >
                <Text style={[styles.screenActionGhostText, isDark ? styles.screenActionGhostTextDark : null]}>Legv et</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void withPropertyAction('bind');
                }}
                style={[styles.screenActionButton, styles.screenActionPrimaryButton, binding ? styles.footerButtonDisabled : null]}
                disabled={binding}
              >
                {binding ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.screenActionPrimaryText}>Bagla</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  boundListWrap: {
    marginTop: 8,
    gap: 8,
  },
  boundItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  boundItemLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  boundItemDark: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
  },
  boundMeta: {
    gap: 2,
  },
  boundName: {
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  boundSub: {
    fontSize: 11,
    fontFamily: 'WorkSans-Medium',
  },
  boundLink: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
  },
  emptyBoundText: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  modalCard: {
    width: '100%',
    maxWidth: 700,
    maxHeight: '90%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  modalCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  modalCardDark: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
  },
  selectorWrap: {
    gap: 6,
  },
  selectorLabel: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
    textTransform: 'uppercase',
  },
  selectorSelected: {
    fontSize: 11,
    fontFamily: 'WorkSans-Medium',
  },
  selectorScroll: {
    maxHeight: 96,
  },
  selectorItem: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbe4ef',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 6,
  },
  selectorItemSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#dbeafe',
  },
  selectorItemText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
    color: '#1f2937',
  },
  selectorItemTextSelected: {
    color: '#1d4ed8',
    fontFamily: 'WorkSans-Bold',
  },
  moreButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  moreButtonText: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
    color: '#1d4ed8',
  },
  inlineLoader: {
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
});
