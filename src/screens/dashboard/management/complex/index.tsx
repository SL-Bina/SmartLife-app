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
import { complexesAPI } from '../../../../services/management';
import { selectSelectedGlobalMtkId } from '../../../../store/global-mtk-slice';
import { selectSelectedManagementMtkId } from '../../../../store/management-filter-slice';
import { useAppSelector } from '../../../../store/hooks';
import { ComplexHeroSection } from './components/ComplexHeroSection';
import { ComplexListItem } from './components/ComplexListItem';
import { complexStyles as styles } from './styles';
import { EntityItem, ITEMS_PER_PAGE } from './types';

export default function ManagementComplexScreen() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const selectedGlobalMtkId = useAppSelector(selectSelectedGlobalMtkId);
  const selectedManagementMtkId = useAppSelector(selectSelectedManagementMtkId);
  const selectedMtkId = selectedGlobalMtkId ?? selectedManagementMtkId;

  const PAGE_HORIZONTAL_PADDING = 32;
  const cardWidth = Math.max(280, width - PAGE_HORIZONTAL_PADDING);

  const [items, setItems] = React.useState<EntityItem[]>([]);
  const [totalItems, setTotalItems] = React.useState<number | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [hasMorePages, setHasMorePages] = React.useState(false);

  const [search, setSearch] = React.useState('');
  const [appliedSearch, setAppliedSearch] = React.useState('');

  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

        if (selectedMtkId === null) {
          setItems([]);
          setTotalItems(0);
          setCurrentPage(1);
          setHasMorePages(false);
          return;
        }

        const params: Record<string, unknown> = {
          page,
          per_page: ITEMS_PER_PAGE,
          // Some backends expect mtk_ids[] while older ones still parse mth_ids.
          mtk_ids: [selectedMtkId],
          mtk_id: selectedMtkId,
          mth_ids: selectedMtkId,
        };

        if (searchValue.length > 0) {
          params.name = searchValue;
        }

        const response = await complexesAPI.search(params);

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
        setError(toErrorMessage(loadError, 'Kompleks siyahisi yuklenmedi'));
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
    [appliedSearch, selectedMtkId],
  );

  React.useEffect(() => {
    void loadItems({ page: 1, append: false, searchValue: appliedSearch });
  }, [appliedSearch, loadItems, selectedMtkId]);

  useFocusEffect(
    React.useCallback(() => {
      void loadItems({ page: 1, append: false, searchValue: appliedSearch });
    }, [appliedSearch, loadItems, selectedMtkId]),
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
    navigation.navigate('ManagementComplexForm');
  }, [navigation]);

  return (
    <AppPageLayout
      title="Kompleks"
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
        <ComplexHeroSection
          isDark={isDark}
          totalItems={totalItems ?? items.length}
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
              Kompleks qeydi tapilmadi
            </Text>
          </View>
        ) : null}

        {!loading && items.length > 0 ? (
          <View style={styles.listWrap}>
            {items.map(item => (
              <ComplexListItem
                key={String(getEntityId(item) ?? Math.random())}
                item={item}
                isDark={isDark}
                cardWidth={cardWidth}
                onPress={entry => {
                  navigation.navigate('ManagementComplexView', { item: entry });
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
