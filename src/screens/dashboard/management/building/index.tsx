import React from 'react';
import { ActivityIndicator, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import AppPageLayout from '../../../../components/common/app-page-layout';
import {
  extractItems,
  extractPaginationMeta,
  getEntityId,
  toErrorMessage,
} from '../../../../components/management/management-utils';
import { useThemeMode } from '../../../../hooks/use-theme';
import { buildingsAPI, complexesAPI } from '../../../../services/management';
import { selectSelectedGlobalMtkId } from '../../../../store/global-mtk-slice';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  selectSelectedManagementComplexId,
  selectSelectedManagementMtkId,
  setSelectedManagementComplexId,
} from '../../../../store/management-filter-slice';
import { BuildingHeroSection } from './components/BuildingHeroSection';
import { BuildingListItem } from './components/BuildingListItem';
import { buildingStyles as styles } from './styles';
import { EntityItem, ITEMS_PER_PAGE } from './types';

type ComplexOption = {
  id: string | number;
  name: string;
};

export default function ManagementBuildingScreen() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();

  const selectedGlobalMtkId = useAppSelector(selectSelectedGlobalMtkId);
  const selectedManagementMtkId = useAppSelector(selectSelectedManagementMtkId);
  const selectedComplexId = useAppSelector(selectSelectedManagementComplexId);
  const selectedMtkId = selectedGlobalMtkId ?? selectedManagementMtkId;

  const PAGE_HORIZONTAL_PADDING = 32;
  const cardWidth = Math.max(280, width - PAGE_HORIZONTAL_PADDING);

  const [items, setItems] = React.useState<EntityItem[]>([]);
  const [complexOptions, setComplexOptions] = React.useState<ComplexOption[]>([]);
  const [totalItems, setTotalItems] = React.useState<number | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [hasMorePages, setHasMorePages] = React.useState(false);

  const [search, setSearch] = React.useState('');
  const [appliedSearch, setAppliedSearch] = React.useState('');

  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const previousMtkIdRef = React.useRef<string | number | null>(selectedMtkId);

  React.useEffect(() => {
    const previous = previousMtkIdRef.current;
    const changed =
      (previous === null && selectedMtkId !== null) ||
      (previous !== null && selectedMtkId === null) ||
      (previous !== null && selectedMtkId !== null && String(previous) !== String(selectedMtkId));

    if (changed) {
      dispatch(setSelectedManagementComplexId(null));
    }

    previousMtkIdRef.current = selectedMtkId;
  }, [dispatch, selectedMtkId]);

  React.useEffect(() => {
    if (selectedMtkId === null) {
      setComplexOptions([]);
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        const response = await complexesAPI.search({
          page: 1,
          per_page: 200,
          mtk_ids: [selectedMtkId],
          mtk_id: selectedMtkId,
          mth_ids: selectedMtkId,
        });

        const nextOptions = extractItems(response)
          .map(entry => {
            const id = getEntityId(entry);
            const name = typeof entry.name === 'string' ? entry.name.trim() : '';

            if (id === null || name.length === 0) {
              return null;
            }

            return { id, name };
          })
          .filter((option): option is ComplexOption => option !== null);

        if (!isMounted) {
          return;
        }

        setComplexOptions(nextOptions);

        const hasSelected =
          selectedComplexId !== null &&
          nextOptions.some(option => String(option.id) === String(selectedComplexId));

        if (!hasSelected) {
          dispatch(setSelectedManagementComplexId(nextOptions[0]?.id ?? null));
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setComplexOptions([]);
        dispatch(setSelectedManagementComplexId(null));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [dispatch, selectedComplexId, selectedMtkId]);

  const loadItems = React.useCallback(
    async (options?: { page?: number; append?: boolean; refresh?: boolean; searchValue?: string }) => {
      const page = options?.page ?? 1;
      const append = options?.append ?? false;
      const refresh = options?.refresh ?? false;
      const searchValue = (options?.searchValue ?? appliedSearch).trim();

      if (append) {
        setLoadingMore(true);
      } else if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        setError(null);

        if (selectedMtkId === null || selectedComplexId === null) {
          setItems([]);
          setTotalItems(0);
          setCurrentPage(1);
          setHasMorePages(false);
          return;
        }

        const params: Record<string, unknown> = {
          page,
          per_page: ITEMS_PER_PAGE,
          mtk_ids: [selectedMtkId],
          mtk_id: selectedMtkId,
          mth_ids: selectedMtkId,
          complex_ids: [selectedComplexId],
          complex_id: selectedComplexId,
        };

        if (searchValue.length > 0) {
          params.name = searchValue;
        }

        const response = await buildingsAPI.search(params);

        const list = extractItems(response);
        const pagination = extractPaginationMeta(response, {
          requestedPage: page,
          requestedPerPage: ITEMS_PER_PAGE,
          receivedCount: list.length,
        });

        setItems(prev => (append ? [...prev, ...list] : list));
        setTotalItems(pagination.total);
        setCurrentPage(page);
        setHasMorePages(pagination.hasMore);
      } catch (loadError) {
        setError(toErrorMessage(loadError, 'Bina siyahisi yuklenmedi'));
        if (!append) {
          setItems([]);
          setTotalItems(null);
          setCurrentPage(1);
          setHasMorePages(false);
        }
      } finally {
        if (append) {
          setLoadingMore(false);
        } else if (refresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [appliedSearch, selectedComplexId, selectedMtkId],
  );

  React.useEffect(() => {
    void loadItems({ page: 1, append: false, searchValue: appliedSearch });
  }, [appliedSearch, loadItems, selectedComplexId, selectedMtkId]);

  useFocusEffect(
    React.useCallback(() => {
      void loadItems({ page: 1, append: false, searchValue: appliedSearch });
    }, [appliedSearch, loadItems, selectedComplexId, selectedMtkId]),
  );

  const onLoadMore = React.useCallback(() => {
    if (loading || loadingMore || refreshing || !hasMorePages) {
      return;
    }

    void loadItems({
      page: currentPage + 1,
      append: true,
      searchValue: appliedSearch,
    });
  }, [appliedSearch, currentPage, hasMorePages, loadItems, loading, loadingMore, refreshing]);

  const onRefresh = React.useCallback(() => {
    if (loadingMore) {
      return;
    }

    void loadItems({ page: 1, append: false, refresh: true, searchValue: appliedSearch });
  }, [appliedSearch, loadItems, loadingMore]);

  const onSearchPress = React.useCallback(() => {
    setAppliedSearch(search.trim());
  }, [search]);

  const onClearPress = React.useCallback(() => {
    setSearch('');
    setAppliedSearch('');
  }, []);

  const openCreateModal = React.useCallback(() => {
    navigation.navigate('ManagementBuildingForm');
  }, [navigation]);

  return (
    <AppPageLayout
      title="Bina"
      isDark={isDark}
      scrollable
      settingsRouteKey="settings"
      profileRouteKey="profile"
      contentContainerStyle={styles.layoutContent}
      onReachEnd={hasMorePages ? onLoadMore : undefined}
      reachEndOffset={72}
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
      <View style={[styles.screen, isDark ? styles.screenDark : styles.screenLight]}>
        <BuildingHeroSection
          isDark={isDark}
          totalItems={totalItems ?? items.length}
          complexOptions={complexOptions}
          selectedComplexId={selectedComplexId}
          onComplexSelect={complexId => {
            dispatch(setSelectedManagementComplexId(complexId));
          }}
          search={search}
          error={error}
          onSearchChange={setSearch}
          onSearchPress={onSearchPress}
          onClearPress={onClearPress}
          onCreatePress={openCreateModal}
        />

        {loading ? (
          <View style={styles.centerStateWrap}>
            <ActivityIndicator size="large" color="#0ea5e9" />
          </View>
        ) : null}

        {!loading && items.length === 0 ? (
          <View style={styles.centerStateWrap}>
            <Text style={[styles.emptyText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              Bina qeydi tapilmadi
            </Text>
          </View>
        ) : null}

        {!loading && items.length > 0 ? (
          <View style={styles.listWrap}>
            {items.map(item => (
              <BuildingListItem
                key={String(getEntityId(item) ?? Math.random())}
                item={item}
                isDark={isDark}
                cardWidth={cardWidth}
                onPress={entry => {
                  navigation.navigate('ManagementBuildingView', { item: entry });
                }}
              />
            ))}

            {loadingMore ? (
              <View style={styles.loadMoreWrap}>
                <ActivityIndicator size="small" color="#0ea5e9" />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </AppPageLayout>
  );
}
