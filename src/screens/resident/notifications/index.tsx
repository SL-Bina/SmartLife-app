import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Bell,
  CheckCheck,
  Eye,
  RefreshCcw,
  Search,
} from 'lucide-react-native';

import AppPageLayout from '../../../components/common/app-page-layout';
import { useThemeMode } from '../../../hooks/use-theme';
import notificationsAPI from '../../../services/notifications-api';
import {
  asNumber,
  asString,
  extractList,
  formatDate,
  pickText,
  toRecord,
} from '../resident-data-utils';
import { useResidentPropertySelector } from '../use-resident-property-selector';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  receivedAt: string;
  status: string;
  type: string;
  read: boolean;
};

const normalizeStatus = (value: unknown): string => asString(value).trim().toLowerCase();

const isReadNotification = (item: Record<string, unknown>): boolean => {
  if (typeof item.read === 'boolean') {
    return item.read;
  }

  if (item.read_at !== null && item.read_at !== undefined && asString(item.read_at)) {
    return true;
  }

  if (item.readAt !== null && item.readAt !== undefined && asString(item.readAt)) {
    return true;
  }

  const status = normalizeStatus(item.status);
  return status === 'read' || status === 'seen';
};

const normalizeNotification = (
  value: Record<string, unknown>,
  index: number,
): NotificationItem => {
  const id = asString(value.id) || `notification-${index + 1}`;
  return {
    id,
    title: pickText(value.title, `Bildiriş #${id}`),
    message: pickText(value.message, value.body, value.description),
    receivedAt: formatDate(value.created_at ?? value.receivedAt),
    status: normalizeStatus(value.status),
    type: pickText(value.type, 'info').toLowerCase(),
    read: isReadNotification(value),
  };
};

const resolvePageMeta = (payload: unknown, fallbackPage: number) => {
  const root = toRecord(payload);
  const first = toRecord(root.data);
  const second = toRecord(first.data);

  const currentPage =
    asNumber(first.current_page)
    || asNumber(second.current_page)
    || asNumber(root.current_page)
    || fallbackPage;

  const lastPage =
    asNumber(first.last_page)
    || asNumber(second.last_page)
    || asNumber(root.last_page)
    || currentPage;

  const unreadCount =
    asNumber(root.unread_count)
    || asNumber(first.unread_count)
    || asNumber(second.unread_count)
    || null;

  return {
    currentPage,
    lastPage,
    unreadCount,
  };
};

const mergeUniqueNotifications = (
  prev: NotificationItem[],
  next: NotificationItem[],
): NotificationItem[] => {
  const map = new Map<string, NotificationItem>();

  prev.forEach(item => {
    map.set(item.id, item);
  });

  next.forEach(item => {
    map.set(item.id, item);
  });

  return Array.from(map.values());
};

export default function NotificationsSection() {
  const { resolvedTheme } = useThemeMode();
  const {
    propertyId,
    propertyOptions,
    selectedPropertyName,
    onPropertyChange,
  } = useResidentPropertySelector();
  const isDark = resolvedTheme === 'dark';

  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [page, setPage] = React.useState(1);
  const [lastPage, setLastPage] = React.useState(1);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [queryInput, setQueryInput] = React.useState('');
  const [query, setQuery] = React.useState('');

  const loadPage = React.useCallback(
    async (targetPage: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        setError(null);

        const params: Record<string, unknown> = {};
        if (propertyId !== null) {
          params.property_id = propertyId;
        }

        if (query) {
          params.query = query;
          params.search = query;
          params.q = query;
        }

        const response = await notificationsAPI.getMyNotifications(targetPage, params);
        const list = extractList(response).map(item => toRecord(item));
        const normalized = list.map((item, index) => normalizeNotification(item, index));
        const pageMeta = resolvePageMeta(response, targetPage);

        setItems(prev => {
          const merged = append ? mergeUniqueNotifications(prev, normalized) : normalized;
          if (typeof pageMeta.unreadCount === 'number') {
            setUnreadCount(pageMeta.unreadCount);
          } else {
            setUnreadCount(merged.filter(item => !item.read).length);
          }
          return merged;
        });

        setPage(pageMeta.currentPage);
        setLastPage(pageMeta.lastPage);
      } catch (loadError) {
        if (loadError instanceof Error && loadError.message) {
          setError(loadError.message);
        } else {
          setError('Bildirişlər yüklənmədi');
        }
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [propertyId, query],
  );

  React.useEffect(() => {
    void loadPage(1, false);
  }, [loadPage]);

  const onApplyQuery = React.useCallback(() => {
    setQuery(queryInput.trim());
  }, [queryInput]);

  const onClearQuery = React.useCallback(() => {
    setQueryInput('');
    setQuery('');
  }, []);

  const onLoadMore = React.useCallback(() => {
    if (loadingMore || loading || page >= lastPage) {
      return;
    }

    void loadPage(page + 1, true);
  }, [lastPage, loadPage, loading, loadingMore, page]);

  const onMarkRead = React.useCallback(async (id: string) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, read: true } : item)));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await notificationsAPI.markRead(id);
    } catch {
      // Keep optimistic update for better UX.
    }
  }, []);

  const onMarkAllRead = React.useCallback(async () => {
    try {
      await notificationsAPI.markAllRead();
    } catch {
      // Local state still updates to keep UI consistent.
    } finally {
      setItems(prev => prev.map(item => ({ ...item, read: true })));
      setUnreadCount(0);
    }
  }, []);

  const hasMore = page < lastPage;

  return (
    <AppPageLayout
      title="Bildirişlər"
      isDark={isDark}
      scrollable
      settingsRouteKey="resident_settings"
      profileRouteKey="resident_profile"
      devicesRouteKey="resident_my_devices"
      notificationsRouteKey="resident_notifications"
      notificationCount={unreadCount}
      notificationText={
        unreadCount > 0 ? `${unreadCount} oxunmamış bildiriş` : 'Yeni bildiriş yoxdur'
      }
      mtkOptions={propertyOptions.map(option => option.name)}
      initialMtk={selectedPropertyName}
      onMtkChange={onPropertyChange}
    >
      <View style={[styles.hero, isDark ? styles.heroDark : styles.heroLight]}>
        <View style={[styles.heroIconWrap, isDark ? styles.heroIconWrapDark : styles.heroIconWrapLight]}>
          <Bell size={18} color={isDark ? '#dbeafe' : '#1d4ed8'} strokeWidth={2.3} />
        </View>

        <View style={styles.heroTextWrap}>
          <Text style={[styles.heroTitle, isDark ? styles.heroTitleDark : styles.heroTitleLight]}>
            Bildirişlər
          </Text>
          <Text style={[styles.heroSubtitle, isDark ? styles.heroSubtitleDark : styles.heroSubtitleLight]}>
            Real data ilə bildiriş axını, axtarış və oxunma idarəsi
          </Text>
        </View>

        <View style={[styles.unreadPill, isDark ? styles.unreadPillDark : styles.unreadPillLight]}>
          <Text style={[styles.unreadPillText, isDark ? styles.unreadPillTextDark : styles.unreadPillTextLight]}>
            {unreadCount} oxunmamış
          </Text>
        </View>
      </View>

      <View style={styles.queryRow}>
        <View style={[styles.searchInputWrap, isDark ? styles.searchInputWrapDark : styles.searchInputWrapLight]}>
          <Search size={16} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.3} />
          <TextInput
            value={queryInput}
            onChangeText={setQueryInput}
            placeholder="Axtar..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            style={[styles.searchInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
            returnKeyType="search"
            onSubmitEditing={onApplyQuery}
          />
        </View>

        <Pressable
          onPress={onApplyQuery}
          style={[styles.actionButton, isDark ? styles.actionButtonDark : styles.actionButtonLight]}
        >
          <Text style={[styles.actionButtonText, isDark ? styles.actionButtonTextDark : styles.actionButtonTextLight]}>
            Axtar
          </Text>
        </Pressable>
      </View>

      <View style={styles.topActionsRow}>
        <Pressable
          onPress={() => void loadPage(1, false)}
          style={[styles.inlineAction, isDark ? styles.inlineActionDark : styles.inlineActionLight]}
        >
          <RefreshCcw size={14} color={isDark ? '#cbd5e1' : '#334155'} strokeWidth={2.3} />
          <Text style={[styles.inlineActionText, isDark ? styles.inlineActionTextDark : styles.inlineActionTextLight]}>
            Yenilə
          </Text>
        </Pressable>

        {query ? (
          <Pressable
            onPress={onClearQuery}
            style={[styles.inlineAction, isDark ? styles.inlineActionDark : styles.inlineActionLight]}
          >
            <Text style={[styles.inlineActionText, isDark ? styles.inlineActionTextDark : styles.inlineActionTextLight]}>
              Sorğunu təmizlə
            </Text>
          </Pressable>
        ) : null}

        {unreadCount > 0 ? (
          <Pressable
            onPress={onMarkAllRead}
            style={[styles.inlineAction, isDark ? styles.inlineActionDark : styles.inlineActionLight]}
          >
            <CheckCheck size={14} color={isDark ? '#cbd5e1' : '#334155'} strokeWidth={2.3} />
            <Text style={[styles.inlineActionText, isDark ? styles.inlineActionTextDark : styles.inlineActionTextLight]}>
              Hamısını oxu
            </Text>
          </Pressable>
        ) : null}
      </View>

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

      {!loading && !error && items.length === 0 ? (
        <View style={styles.centerWrap}>
          <Text style={[styles.emptyText, isDark ? styles.emptyTextDark : styles.emptyTextLight]}>
            Bildiriş tapılmadı
          </Text>
        </View>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <View style={styles.itemsWrap}>
          {items.map(item => (
            <Pressable
              key={item.id}
              onPress={() => {
                if (!item.read) {
                  void onMarkRead(item.id);
                }
              }}
              style={[
                styles.card,
                isDark ? styles.cardDark : styles.cardLight,
                !item.read ? styles.cardUnread : null,
              ]}
            >
              <View style={styles.cardTopRow}>
                <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : styles.cardTitleLight]}>
                  {item.title}
                </Text>
                <View style={styles.cardActionsRight}>
                  {!item.read ? <View style={styles.unreadDot} /> : null}
                  <Eye size={14} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.3} />
                </View>
              </View>

              <Text style={[styles.cardMessage, isDark ? styles.cardMessageDark : styles.cardMessageLight]}>
                {item.message || '-'}
              </Text>

              <View style={styles.cardMetaRow}>
                <Text style={[styles.cardMeta, isDark ? styles.cardMetaDark : styles.cardMetaLight]}>
                  {item.type || 'info'}
                </Text>
                <Text style={[styles.cardMeta, isDark ? styles.cardMetaDark : styles.cardMetaLight]}>
                  {item.receivedAt}
                </Text>
              </View>
            </Pressable>
          ))}

          {hasMore ? (
            <Pressable
              onPress={onLoadMore}
              disabled={loadingMore}
              style={[styles.loadMoreButton, isDark ? styles.loadMoreButtonDark : styles.loadMoreButtonLight]}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color={isDark ? '#dbeafe' : '#1d4ed8'} />
              ) : (
                <Text style={[styles.loadMoreText, isDark ? styles.loadMoreTextDark : styles.loadMoreTextLight]}>
                  Daha çox göstər
                </Text>
              )}
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </AppPageLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  heroLight: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  heroDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e3a8a',
  },
  heroIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconWrapLight: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  heroIconWrapDark: {
    backgroundColor: '#111827',
    borderColor: '#1e3a8a',
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
    fontFamily: 'WorkSans-Regular',
  },
  heroSubtitleLight: {
    color: '#475569',
  },
  heroSubtitleDark: {
    color: '#cbd5e1',
  },
  unreadPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  unreadPillLight: {
    backgroundColor: '#ffffff',
    borderColor: '#93c5fd',
  },
  unreadPillDark: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  unreadPillText: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  unreadPillTextLight: {
    color: '#1d4ed8',
  },
  unreadPillTextDark: {
    color: '#dbeafe',
  },
  queryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  searchInputWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },
  searchInputWrapLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
  },
  searchInputWrapDark: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: 'WorkSans-Regular',
  },
  searchInputLight: {
    color: '#1e293b',
  },
  searchInputDark: {
    color: '#e2e8f0',
  },
  actionButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  actionButtonLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
  },
  actionButtonDark: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  actionButtonTextLight: {
    color: '#1d4ed8',
  },
  actionButtonTextDark: {
    color: '#dbeafe',
  },
  topActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  inlineAction: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  inlineActionLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
  },
  inlineActionDark: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  inlineActionText: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  inlineActionTextLight: {
    color: '#1e293b',
  },
  inlineActionTextDark: {
    color: '#e2e8f0',
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
  emptyText: {
    fontSize: 14,
    fontFamily: 'WorkSans-Regular',
  },
  emptyTextLight: {
    color: '#475569',
  },
  emptyTextDark: {
    color: '#cbd5e1',
  },
  itemsWrap: {
    gap: 8,
    paddingBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 11,
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  cardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'WorkSans-SemiBold',
  },
  cardTitleLight: {
    color: '#0f172a',
  },
  cardTitleDark: {
    color: '#f8fafc',
  },
  cardActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  cardMessage: {
    marginTop: 5,
    fontSize: 12,
    fontFamily: 'WorkSans-Regular',
  },
  cardMessageLight: {
    color: '#475569',
  },
  cardMessageDark: {
    color: '#cbd5e1',
  },
  cardMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardMeta: {
    fontSize: 11,
    fontFamily: 'WorkSans-Regular',
    textTransform: 'capitalize',
  },
  cardMetaLight: {
    color: '#64748b',
  },
  cardMetaDark: {
    color: '#94a3b8',
  },
  loadMoreButton: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  loadMoreButtonLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
  },
  loadMoreButtonDark: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  loadMoreText: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  loadMoreTextLight: {
    color: '#1d4ed8',
  },
  loadMoreTextDark: {
    color: '#dbeafe',
  },
});
