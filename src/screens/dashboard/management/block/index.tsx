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
import { blocksAPI, buildingsAPI, complexesAPI } from '../../../../services/management';
import { selectSelectedGlobalMtkId } from '../../../../store/global-mtk-slice';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  selectSelectedManagementBuildingId,
  selectSelectedManagementComplexId,
  selectSelectedManagementMtkId,
  setSelectedManagementBuildingId,
  setSelectedManagementComplexId,
} from '../../../../store/management-filter-slice';
import { BlockHeroSection } from './components/BlockHeroSection';
import { BlockListCard } from './components/BlockListCard';
import { blockStyles as styles } from './styles';
import { EntityItem, ITEMS_PER_PAGE } from './types';

type SelectOption = {
  id: string | number;
  name: string;
};

const OPTIONS_PER_PAGE = 40;

const mergeUniqueOptions = (base: SelectOption[], incoming: SelectOption[]) => {
  const byId = new Map<string, SelectOption>();

  [...base, ...incoming].forEach(option => {
    byId.set(String(option.id), option);
  });

  return Array.from(byId.values());
};

export default function ManagementBlockScreen() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();

  const selectedGlobalMtkId = useAppSelector(selectSelectedGlobalMtkId);
  const selectedManagementMtkId = useAppSelector(selectSelectedManagementMtkId);
  const selectedComplexId = useAppSelector(selectSelectedManagementComplexId);
  const selectedBuildingId = useAppSelector(selectSelectedManagementBuildingId);
  const selectedMtkId = selectedGlobalMtkId ?? selectedManagementMtkId;

  const PAGE_HORIZONTAL_PADDING = 32;
  const cardWidth = Math.max(280, width - PAGE_HORIZONTAL_PADDING);

  const [items, setItems] = React.useState<EntityItem[]>([]);
  const [complexOptions, setComplexOptions] = React.useState<SelectOption[]>([]);
  const [buildingOptions, setBuildingOptions] = React.useState<SelectOption[]>([]);
  const [complexPage, setComplexPage] = React.useState(1);
  const [complexHasMore, setComplexHasMore] = React.useState(false);
  const [complexLoading, setComplexLoading] = React.useState(false);
  const [complexLoadingMore, setComplexLoadingMore] = React.useState(false);
  const [complexQuery, setComplexQuery] = React.useState('');
  const [debouncedComplexQuery, setDebouncedComplexQuery] = React.useState('');
  const [buildingPage, setBuildingPage] = React.useState(1);
  const [buildingHasMore, setBuildingHasMore] = React.useState(false);
  const [buildingLoading, setBuildingLoading] = React.useState(false);
  const [buildingLoadingMore, setBuildingLoadingMore] = React.useState(false);
  const [buildingQuery, setBuildingQuery] = React.useState('');
  const [debouncedBuildingQuery, setDebouncedBuildingQuery] = React.useState('');
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
      dispatch(setSelectedManagementBuildingId(null));
    }

    previousMtkIdRef.current = selectedMtkId;
  }, [dispatch, selectedMtkId]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedComplexQuery(complexQuery.trim());
    }, 280);

    return () => clearTimeout(timeout);
  }, [complexQuery]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedBuildingQuery(buildingQuery.trim());
    }, 280);

    return () => clearTimeout(timeout);
  }, [buildingQuery]);

  const loadComplexesPage = React.useCallback(
    async (page: number, append: boolean) => {
      if (selectedMtkId === null) {
        setComplexOptions([]);
        setComplexPage(1);
        setComplexHasMore(false);
        return;
      }

      if (append) {
        setComplexLoadingMore(true);
      } else {
        setComplexLoading(true);
      }

      try {
        const response = await complexesAPI.search({
          page,
          per_page: OPTIONS_PER_PAGE,
          mtk_ids: [selectedMtkId],
          mtk_id: selectedMtkId,
          mth_ids: selectedMtkId,
          ...(debouncedComplexQuery.length > 0 ? { name: debouncedComplexQuery } : {}),
        });

        const options = extractItems(response)
          .map(entry => {
            const id = getEntityId(entry);
            const name = typeof entry.name === 'string' ? entry.name.trim() : '';

            if (id === null || name.length === 0) {
              return null;
            }

            return { id, name };
          })
          .filter((option): option is SelectOption => option !== null);

        const pagination = extractPaginationMeta(response, {
          requestedPage: page,
          requestedPerPage: OPTIONS_PER_PAGE,
          receivedCount: options.length,
        });

        setComplexPage(page);
        setComplexHasMore(pagination.hasMore);
        setComplexOptions(prev => (append ? mergeUniqueOptions(prev, options) : options));

        if (!append && debouncedComplexQuery.length === 0) {
          const hasSelected =
            selectedComplexId !== null &&
            options.some(option => String(option.id) === String(selectedComplexId));

          if (!hasSelected) {
            dispatch(setSelectedManagementComplexId(options[0]?.id ?? null));
            dispatch(setSelectedManagementBuildingId(null));
          }
        }
      } catch {
        if (!append) {
          setComplexOptions([]);
          setComplexPage(1);
          setComplexHasMore(false);
          dispatch(setSelectedManagementComplexId(null));
          dispatch(setSelectedManagementBuildingId(null));
        }
      } finally {
        if (append) {
          setComplexLoadingMore(false);
        } else {
          setComplexLoading(false);
        }
      }
    },
    [debouncedComplexQuery, dispatch, selectedComplexId, selectedMtkId],
  );

  React.useEffect(() => {
    void loadComplexesPage(1, false);
  }, [loadComplexesPage]);

  const loadBuildingsPage = React.useCallback(
    async (page: number, append: boolean) => {
      if (selectedMtkId === null || selectedComplexId === null) {
        setBuildingOptions([]);
        setBuildingPage(1);
        setBuildingHasMore(false);
        dispatch(setSelectedManagementBuildingId(null));
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
          per_page: OPTIONS_PER_PAGE,
          mtk_ids: [selectedMtkId],
          mtk_id: selectedMtkId,
          mth_ids: selectedMtkId,
          complex_ids: [selectedComplexId],
          complex_id: selectedComplexId,
          ...(debouncedBuildingQuery.length > 0 ? { name: debouncedBuildingQuery } : {}),
        });

        const options = extractItems(response)
          .map(entry => {
            const id = getEntityId(entry);
            const name = typeof entry.name === 'string' ? entry.name.trim() : '';

            if (id === null || name.length === 0) {
              return null;
            }

            return { id, name };
          })
          .filter((option): option is SelectOption => option !== null);

        const pagination = extractPaginationMeta(response, {
          requestedPage: page,
          requestedPerPage: OPTIONS_PER_PAGE,
          receivedCount: options.length,
        });

        setBuildingPage(page);
        setBuildingHasMore(pagination.hasMore);
        setBuildingOptions(prev => (append ? mergeUniqueOptions(prev, options) : options));

        if (!append && debouncedBuildingQuery.length === 0) {
          const hasSelected =
            selectedBuildingId !== null &&
            options.some(option => String(option.id) === String(selectedBuildingId));

          if (!hasSelected) {
            dispatch(setSelectedManagementBuildingId(options[0]?.id ?? null));
          }
        }
      } catch {
        if (!append) {
          setBuildingOptions([]);
          setBuildingPage(1);
          setBuildingHasMore(false);
          dispatch(setSelectedManagementBuildingId(null));
        }
      } finally {
        if (append) {
          setBuildingLoadingMore(false);
        } else {
          setBuildingLoading(false);
        }
      }
    },
    [debouncedBuildingQuery, dispatch, selectedBuildingId, selectedComplexId, selectedMtkId],
  );

  React.useEffect(() => {
    void loadBuildingsPage(1, false);
  }, [loadBuildingsPage]);

  const onLoadMoreComplexOptions = React.useCallback(() => {
    if (complexLoading || complexLoadingMore || !complexHasMore) {
      return;
    }

    void loadComplexesPage(complexPage + 1, true);
  }, [complexHasMore, complexLoading, complexLoadingMore, complexPage, loadComplexesPage]);

  const onLoadMoreBuildingOptions = React.useCallback(() => {
    if (buildingLoading || buildingLoadingMore || !buildingHasMore) {
      return;
    }

    void loadBuildingsPage(buildingPage + 1, true);
  }, [buildingHasMore, buildingLoading, buildingLoadingMore, buildingPage, loadBuildingsPage]);

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

        if (selectedMtkId === null || selectedComplexId === null || selectedBuildingId === null) {
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
          building_ids: [selectedBuildingId],
          building_id: selectedBuildingId,
        };

        if (searchValue.length > 0) {
          params.name = searchValue;
        }

        const response = await blocksAPI.search(params);

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
        setError(toErrorMessage(loadError, 'Blok siyahisi yuklenmedi'));
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
    [appliedSearch, selectedBuildingId, selectedComplexId, selectedMtkId],
  );

  React.useEffect(() => {
    void loadItems({ page: 1, append: false, searchValue: appliedSearch });
  }, [appliedSearch, loadItems, selectedBuildingId, selectedComplexId, selectedMtkId]);

  useFocusEffect(
    React.useCallback(() => {
      void loadItems({ page: 1, append: false, searchValue: appliedSearch });
    }, [appliedSearch, loadItems, selectedBuildingId, selectedComplexId, selectedMtkId]),
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
    navigation.navigate('ManagementBlockForm');
  }, [navigation]);

  return (
    <AppPageLayout
      title="Block"
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
        <View style={styles.heroLayer}>
          <BlockHeroSection
            isDark={isDark}
            totalItems={totalItems ?? items.length}
            complexOptions={complexOptions}
            selectedComplexId={selectedComplexId}
            complexQuery={complexQuery}
            onComplexQueryChange={setComplexQuery}
            complexLoadingMore={complexLoadingMore}
            complexHasMore={complexHasMore}
            onLoadMoreComplexOptions={onLoadMoreComplexOptions}
            onComplexSelect={complexId => {
              dispatch(setSelectedManagementComplexId(complexId));
              dispatch(setSelectedManagementBuildingId(null));
              setBuildingQuery('');
            }}
            buildingOptions={buildingOptions}
            selectedBuildingId={selectedBuildingId}
            buildingQuery={buildingQuery}
            onBuildingQueryChange={setBuildingQuery}
            buildingLoadingMore={buildingLoadingMore}
            buildingHasMore={buildingHasMore}
            onLoadMoreBuildingOptions={onLoadMoreBuildingOptions}
            onBuildingSelect={buildingId => {
              dispatch(setSelectedManagementBuildingId(buildingId));
            }}
            search={search}
            error={error}
            onSearchChange={setSearch}
            onSearchPress={onSearchPress}
            onClearPress={onClearPress}
            onCreatePress={openCreateModal}
          />
        </View>

        {loading ? (
          <View style={styles.centerStateWrap}>
            <ActivityIndicator size="large" color="#0ea5e9" />
          </View>
        ) : null}

        {!loading && items.length === 0 ? (
          <View style={styles.centerStateWrap}>
            <Text style={[styles.emptyText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              Blok qeydi tapilmadi
            </Text>
          </View>
        ) : null}

        {!loading && items.length > 0 ? (
          <View style={styles.listWrap}>
            {items.map(item => (
              <BlockListCard
                key={String(getEntityId(item) ?? Math.random())}
                item={item}
                isDark={isDark}
                cardWidth={cardWidth}
                onPress={entry => {
                  navigation.navigate('ManagementBlockView', { item: entry });
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
