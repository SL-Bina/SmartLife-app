import React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  extractPaginationMeta,
  extractItems,
  getEntityId,
  toErrorMessage,
} from '../../../../components/management/management-utils';
import { useThemeMode } from '../../../../hooks/use-theme';
import { blocksAPI, buildingsAPI } from '../../../../services/management';
import { selectSelectedGlobalMtkId } from '../../../../store/global-mtk-slice';
import { useAppSelector } from '../../../../store/hooks';
import {
  selectSelectedManagementBuildingId,
  selectSelectedManagementComplexId,
  selectSelectedManagementMtkId,
} from '../../../../store/management-filter-slice';
import { BlockFormScreen } from './components/BlockFormScreen';
import { blockStyles as styles } from './styles';
import { EMPTY_FORM, EntityItem, BlockFormState } from './types';
import { buildPayload } from './utils';

type FormRouteParams = {
  editingItem?: EntityItem;
};

type SelectOption = {
  id: string | number;
  name: string;
};

const BUILDING_OPTIONS_PAGE_SIZE = 40;

const mergeUniqueOptions = (base: SelectOption[], incoming: SelectOption[]) => {
  const byId = new Map<string, SelectOption>();

  [...base, ...incoming].forEach(option => {
    byId.set(String(option.id), option);
  });

  return Array.from(byId.values());
};

const mapItemToForm = (item: EntityItem): BlockFormState => {
  const meta = item.meta && typeof item.meta === 'object' && !Array.isArray(item.meta)
    ? (item.meta as Record<string, unknown>)
    : {};
  const statusRaw = String(item.status).trim().toLowerCase();
  const normalizedStatus = statusRaw === 'inactive' || statusRaw === '0' ? 'inactive' : 'active';

  return {
    name: typeof item.name === 'string' ? item.name : '',
    buildingId:
      typeof item.building_id === 'string' || typeof item.building_id === 'number'
        ? String(item.building_id)
        : '',
    description:
      typeof item.description === 'string'
        ? item.description
        : (typeof meta.description === 'string' ? meta.description : ''),
    status: normalizedStatus,
  };
};

export default function ManagementBlockFormRouteScreen() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const selectedGlobalMtkId = useAppSelector(selectSelectedGlobalMtkId);
  const selectedManagementMtkId = useAppSelector(selectSelectedManagementMtkId);
  const selectedComplexId = useAppSelector(selectSelectedManagementComplexId);
  const selectedBuildingId = useAppSelector(selectSelectedManagementBuildingId);
  const selectedMtkId = selectedGlobalMtkId ?? selectedManagementMtkId;

  const editingItem = (route.params as FormRouteParams | undefined)?.editingItem ?? null;

  const [submitting, setSubmitting] = React.useState(false);
  const [buildingOptions, setBuildingOptions] = React.useState<SelectOption[]>([]);
  const [buildingLoading, setBuildingLoading] = React.useState(false);
  const [buildingLoadingMore, setBuildingLoadingMore] = React.useState(false);
  const [buildingPage, setBuildingPage] = React.useState(1);
  const [buildingHasMore, setBuildingHasMore] = React.useState(false);
  const [buildingQuery, setBuildingQuery] = React.useState('');
  const [debouncedBuildingQuery, setDebouncedBuildingQuery] = React.useState('');
  const [formState, setFormState] = React.useState<BlockFormState>(() => {
    if (editingItem) {
      return mapItemToForm(editingItem);
    }

    if (selectedBuildingId !== null) {
      return {
        ...EMPTY_FORM,
        buildingId: String(selectedBuildingId),
      };
    }

    return EMPTY_FORM;
  });

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedBuildingQuery(buildingQuery.trim());
    }, 280);

    return () => clearTimeout(timeout);
  }, [buildingQuery]);

  const editingBuildingId = React.useMemo(() => {
    if (!editingItem) {
      return null;
    }

    const mapped = mapItemToForm(editingItem).buildingId.trim();
    return mapped.length > 0 ? mapped : null;
  }, [editingItem]);

  const preferredBuildingId = editingBuildingId ?? (selectedBuildingId !== null ? String(selectedBuildingId) : null);

  const loadBuildingsPage = React.useCallback(
    async (page: number, append: boolean) => {
      if (selectedMtkId === null || selectedComplexId === null) {
        setBuildingOptions([]);
        setBuildingPage(1);
        setBuildingHasMore(false);
        return;
      }

      if (append) {
        setBuildingLoadingMore(true);
      } else {
        setBuildingLoading(true);
      }

      try {
        const response = await buildingsAPI.search({
          page,
          per_page: BUILDING_OPTIONS_PAGE_SIZE,
          mtk_ids: [selectedMtkId],
          mtk_id: selectedMtkId,
          mth_ids: selectedMtkId,
          complex_ids: [selectedComplexId],
          complex_id: selectedComplexId,
          ...(debouncedBuildingQuery.length > 0 ? { name: debouncedBuildingQuery } : {}),
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

        if (!append && preferredBuildingId !== null) {
          const hasPreferred = mappedOptions.some(option => String(option.id) === preferredBuildingId);
          if (!hasPreferred) {
            mappedOptions = [{ id: preferredBuildingId, name: `Bina #${preferredBuildingId}` }, ...mappedOptions];
          }
        }

        const pagination = extractPaginationMeta(response, {
          requestedPage: page,
          requestedPerPage: BUILDING_OPTIONS_PAGE_SIZE,
          receivedCount: mappedOptions.length,
        });

        setBuildingPage(page);
        setBuildingHasMore(pagination.hasMore);
        setBuildingOptions(prev => (append ? mergeUniqueOptions(prev, mappedOptions) : mappedOptions));

        if (!append && editingItem === null) {
          const fallbackId = selectedBuildingId ?? mappedOptions[0]?.id ?? null;
          if (fallbackId !== null) {
            setFormState(prev =>
              prev.buildingId.trim().length > 0
                ? prev
                : { ...prev, buildingId: String(fallbackId) },
            );
          }
        }
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
    [
      debouncedBuildingQuery,
      editingItem,
      preferredBuildingId,
      selectedBuildingId,
      selectedComplexId,
      selectedMtkId,
    ],
  );

  React.useEffect(() => {
    if (selectedMtkId === null || selectedComplexId === null) {
      setBuildingOptions([]);
      setBuildingPage(1);
      setBuildingHasMore(false);
      return;
    }

    void loadBuildingsPage(1, false);
  }, [loadBuildingsPage]);

  const onLoadMoreBuildings = React.useCallback(() => {
    if (buildingLoading || buildingLoadingMore || !buildingHasMore) {
      return;
    }

    void loadBuildingsPage(buildingPage + 1, true);
  }, [buildingHasMore, buildingLoading, buildingLoadingMore, buildingPage, loadBuildingsPage]);

  const onSubmit = React.useCallback(async () => {
    const name = formState.name.trim();
    if (name.length === 0) {
      Alert.alert('Xeta', 'Blok adi daxil edilmelidir');
      return;
    }

    if (formState.buildingId.trim().length === 0) {
      Alert.alert('Xeta', 'Bina ID daxil edilmelidir');
      return;
    }

    if (!Number.isFinite(Number(formState.buildingId.trim()))) {
      Alert.alert('Xeta', 'Bina ID reqem olmalidir');
      return;
    }

    const payload = buildPayload(formState);
    const editingId = editingItem ? getEntityId(editingItem) : null;

    try {
      setSubmitting(true);

      if (editingItem && editingId !== null) {
        await blocksAPI.update(editingId, payload);
      } else {
        await blocksAPI.add(payload);
      }

      navigation.goBack();
    } catch (submitError) {
      Alert.alert('Xeta', toErrorMessage(submitError, 'Blok yadda saxlanmadi'));
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
      <BlockFormScreen
        isDark={isDark}
        editingItem={editingItem}
        formState={formState}
        buildingOptions={buildingOptions}
        buildingQuery={buildingQuery}
        onBuildingQueryChange={setBuildingQuery}
        buildingLoading={buildingLoading}
        buildingLoadingMore={buildingLoadingMore}
        buildingHasMore={buildingHasMore}
        onLoadMoreBuildings={onLoadMoreBuildings}
        submitting={submitting}
        onChange={(patch: Partial<BlockFormState>) => {
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
