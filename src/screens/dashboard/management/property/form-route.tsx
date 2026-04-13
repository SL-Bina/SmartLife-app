import React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  extractItems,
  extractPaginationMeta,
  getEntityId,
  toErrorMessage,
} from '../../../../components/management/management-utils';
import { useThemeMode } from '../../../../hooks/use-theme';
import { blocksAPI, propertiesAPI } from '../../../../services/management';
import { selectSelectedGlobalMtkId } from '../../../../store/global-mtk-slice';
import { useAppSelector } from '../../../../store/hooks';
import {
  selectSelectedManagementBlockId,
  selectSelectedManagementBuildingId,
  selectSelectedManagementComplexId,
  selectSelectedManagementMtkId,
} from '../../../../store/management-filter-slice';
import { PropertyFormScreen } from './components/PropertyFormScreen';
import { propertyStyles as styles } from './styles';
import { EMPTY_FORM, EntityItem, PropertyFormState } from './types';
import { buildPayload } from './utils';

type FormRouteParams = {
  editingItem?: EntityItem;
};

type SelectOption = {
  id: string | number;
  name: string;
};

const BLOCK_OPTIONS_PAGE_SIZE = 40;

const mergeUniqueOptions = (base: SelectOption[], incoming: SelectOption[]) => {
  const byId = new Map<string, SelectOption>();
  [...base, ...incoming].forEach(option => byId.set(String(option.id), option));
  return Array.from(byId.values());
};

const mapItemToForm = (item: EntityItem): PropertyFormState => {
  const statusRaw = String(item.status).trim().toLowerCase();
  const normalizedStatus = statusRaw === 'inactive' || statusRaw === '0' ? 'inactive' : 'active';

  return {
    name: typeof item.name === 'string' ? item.name : '',
    blockId:
      typeof item.block_id === 'string' || typeof item.block_id === 'number'
        ? String(item.block_id)
        : '',
    apartmentNumber:
      typeof item.apartment_number === 'string' || typeof item.apartment_number === 'number'
        ? String(item.apartment_number)
        : '',
    area:
      typeof item.area === 'string' || typeof item.area === 'number'
        ? String(item.area)
        : '',
    status: normalizedStatus,
  };
};

export default function ManagementPropertyFormRouteScreen() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const selectedGlobalMtkId = useAppSelector(selectSelectedGlobalMtkId);
  const selectedManagementMtkId = useAppSelector(selectSelectedManagementMtkId);
  const selectedComplexId = useAppSelector(selectSelectedManagementComplexId);
  const selectedBuildingId = useAppSelector(selectSelectedManagementBuildingId);
  const selectedBlockId = useAppSelector(selectSelectedManagementBlockId);
  const selectedMtkId = selectedGlobalMtkId ?? selectedManagementMtkId;

  const editingItem = (route.params as FormRouteParams | undefined)?.editingItem ?? null;

  const [submitting, setSubmitting] = React.useState(false);
  const [blockOptions, setBlockOptions] = React.useState<SelectOption[]>([]);
  const [blockLoading, setBlockLoading] = React.useState(false);
  const [blockLoadingMore, setBlockLoadingMore] = React.useState(false);
  const [blockPage, setBlockPage] = React.useState(1);
  const [blockHasMore, setBlockHasMore] = React.useState(false);
  const [blockQuery, setBlockQuery] = React.useState('');
  const [debouncedBlockQuery, setDebouncedBlockQuery] = React.useState('');
  const [formState, setFormState] = React.useState<PropertyFormState>(() => {
    if (editingItem) {
      return mapItemToForm(editingItem);
    }

    if (selectedBlockId !== null) {
      return {
        ...EMPTY_FORM,
        blockId: String(selectedBlockId),
      };
    }

    return EMPTY_FORM;
  });

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedBlockQuery(blockQuery.trim()), 280);
    return () => clearTimeout(timeout);
  }, [blockQuery]);

  const editingBlockId = React.useMemo(() => {
    if (!editingItem) return null;
    const mapped = mapItemToForm(editingItem).blockId.trim();
    return mapped.length > 0 ? mapped : null;
  }, [editingItem]);

  const preferredBlockId = editingBlockId ?? (selectedBlockId !== null ? String(selectedBlockId) : null);

  const loadBlocksPage = React.useCallback(
    async (page: number, append: boolean) => {
      if (selectedMtkId === null || selectedComplexId === null || selectedBuildingId === null) {
        setBlockOptions([]);
        setBlockPage(1);
        setBlockHasMore(false);
        return;
      }

      if (append) {
        setBlockLoadingMore(true);
      } else {
        setBlockLoading(true);
      }

      try {
        const response = await blocksAPI.search({
          page,
          per_page: BLOCK_OPTIONS_PAGE_SIZE,
          mtk_ids: [selectedMtkId],
          mtk_id: selectedMtkId,
          mth_ids: selectedMtkId,
          complex_ids: [selectedComplexId],
          complex_id: selectedComplexId,
          building_ids: [selectedBuildingId],
          building_id: selectedBuildingId,
          ...(debouncedBlockQuery.length > 0 ? { name: debouncedBlockQuery } : {}),
        });

        let mappedOptions = extractItems(response)
          .map((entry: EntityItem) => {
            const id = getEntityId(entry);
            const name = typeof entry.name === 'string' ? entry.name.trim() : '';

            if (id === null || name.length === 0) {
              return null;
            }

            return { id, name };
          })
          .filter((option: SelectOption | null): option is SelectOption => option !== null);

        if (!append && preferredBlockId !== null) {
          const hasPreferred = mappedOptions.some(option => String(option.id) === preferredBlockId);
          if (!hasPreferred) {
            mappedOptions = [{ id: preferredBlockId, name: `Blok #${preferredBlockId}` }, ...mappedOptions];
          }
        }

        const pagination = extractPaginationMeta(response, {
          requestedPage: page,
          requestedPerPage: BLOCK_OPTIONS_PAGE_SIZE,
          receivedCount: mappedOptions.length,
        });

        setBlockPage(page);
        setBlockHasMore(pagination.hasMore);
        setBlockOptions(prev => (append ? mergeUniqueOptions(prev, mappedOptions) : mappedOptions));

        if (!append && editingItem === null && debouncedBlockQuery.length === 0) {
          const fallbackId = selectedBlockId ?? mappedOptions[0]?.id ?? null;
          if (fallbackId !== null) {
            setFormState(prev =>
              prev.blockId.trim().length > 0
                ? prev
                : { ...prev, blockId: String(fallbackId) },
            );
          }
        }
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
    [
      debouncedBlockQuery,
      editingItem,
      preferredBlockId,
      selectedBlockId,
      selectedBuildingId,
      selectedComplexId,
      selectedMtkId,
    ],
  );

  React.useEffect(() => {
    if (selectedMtkId === null || selectedComplexId === null || selectedBuildingId === null) {
      setBlockOptions([]);
      setBlockPage(1);
      setBlockHasMore(false);
      return;
    }

    void loadBlocksPage(1, false);
  }, [loadBlocksPage, selectedBuildingId, selectedComplexId, selectedMtkId]);

  const onLoadMoreBlocks = React.useCallback(() => {
    if (blockLoading || blockLoadingMore || !blockHasMore) {
      return;
    }

    void loadBlocksPage(blockPage + 1, true);
  }, [blockHasMore, blockLoading, blockLoadingMore, blockPage, loadBlocksPage]);

  const onSubmit = React.useCallback(async () => {
    const name = formState.name.trim();
    if (name.length === 0) {
      Alert.alert('Xeta', 'Menzil adi daxil edilmelidir');
      return;
    }

    if (formState.blockId.trim().length === 0) {
      Alert.alert('Xeta', 'Blok ID daxil edilmelidir');
      return;
    }

    if (!Number.isFinite(Number(formState.blockId.trim()))) {
      Alert.alert('Xeta', 'Blok ID reqem olmalidir');
      return;
    }

    const payload = buildPayload(formState);
    const editingId = editingItem ? getEntityId(editingItem) : null;

    try {
      setSubmitting(true);

      if (editingItem && editingId !== null) {
        await propertiesAPI.update(editingId, payload);
      } else {
        await propertiesAPI.add(payload);
      }

      navigation.goBack();
    } catch (submitError) {
      Alert.alert('Xeta', toErrorMessage(submitError, 'Menzil yadda saxlanmadi'));
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, formState, navigation]);

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
      <PropertyFormScreen
        isDark={isDark}
        editingItem={editingItem}
        formState={formState}
        blockOptions={blockOptions}
        blockQuery={blockQuery}
        onBlockQueryChange={setBlockQuery}
        blockLoading={blockLoading}
        blockLoadingMore={blockLoadingMore}
        blockHasMore={blockHasMore}
        onLoadMoreBlocks={onLoadMoreBlocks}
        submitting={submitting}
        onChange={(patch: Partial<PropertyFormState>) => {
          setFormState(prev => ({ ...prev, ...patch }));
        }}
        onClose={() => navigation.goBack()}
        onSubmit={() => {
          void onSubmit();
        }}
      />

      {submitting ? (
        <View style={styles.submittingOverlay} pointerEvents="none">
          <View style={styles.submittingLoader}>
            <ActivityIndicator size="large" color="#0ea5e9" />
          </View>
        </View>
      ) : null}
    </View>
  );
}
