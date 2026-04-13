import React from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomPageHeader from './bottom-page-header';
import { getHeaderResponsiveMetrics } from './header-responsive';
import TopPageHeader from './top-page-header';
import { useGlobalMtkSelector } from '../../hooks/use-global-mtk-selector';
import { APP_LAYOUT_COLORS } from '../../theme/layout-colors';
import { useNotificationUnreadCount } from '../../hooks/use-notification-unread-count';
import { useQuickNavigationRoutes } from '../../hooks/use-quick-navigation-routes';
import { selectIsResident } from '../../store/auth-slice';
import { useAppSelector } from '../../store/hooks';

type AppPageLayoutProps = {
  title: string;
  isDark: boolean;
  children: React.ReactNode;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  backgroundLight?: string;
  backgroundDark?: string;
  settingsRouteKey?: string;
  profileRouteKey?: string;
  devicesRouteKey?: string;
  notificationsRouteKey?: string;
  notificationText?: string;
  notificationCount?: number;
  mtkOptions?: string[];
  initialMtk?: string;
  onMtkChange?: (mtkName: string) => void;
  onMtkDropdownOpen?: () => void;
  onReachEnd?: () => void;
  reachEndOffset?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export default function AppPageLayout({
  title,
  isDark,
  children,
  scrollable = false,
  contentStyle,
  contentContainerStyle,
  backgroundLight = APP_LAYOUT_COLORS.backgroundLight,
  backgroundDark = APP_LAYOUT_COLORS.backgroundDark,
  settingsRouteKey = 'settings',
  profileRouteKey = 'profile',
  devicesRouteKey = 'my_devices',
  notificationsRouteKey = 'notifications',
  notificationText,
  notificationCount,
  mtkOptions,
  initialMtk,
  onMtkChange,
  onMtkDropdownOpen,
  onReachEnd,
  reachEndOffset = 140,
  refreshing = false,
  onRefresh,
}: AppPageLayoutProps) {
  const { width, fontScale } = useWindowDimensions();
  const isAndroid = Platform.OS === 'android';
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotificationUnreadCount();
  const { selectedRouteOptions } = useQuickNavigationRoutes();
  const isResident = useAppSelector(selectIsResident);
  const reachEndLockedRef = React.useRef(false);
  const responsiveMetrics = React.useMemo(
    () => getHeaderResponsiveMetrics(width, fontScale),
    [fontScale, width],
  );
  const shouldUseGlobalMtk = !isResident && (mtkOptions?.length ?? 0) === 0;
  const {
    mtkOptions: globalMtkOptions,
    selectedMtkName: globalSelectedMtkName,
    onMtkChange: onGlobalMtkChange,
  } = useGlobalMtkSelector(shouldUseGlobalMtk);

  const resolvedMtkOptions = shouldUseGlobalMtk ? globalMtkOptions : mtkOptions;
  const resolvedInitialMtk = shouldUseGlobalMtk ? globalSelectedMtkName : initialMtk;
  const resolvedOnMtkChange = React.useCallback(
    (mtkName: string) => {
      if (shouldUseGlobalMtk) {
        onGlobalMtkChange(mtkName);
      }

      onMtkChange?.(mtkName);
    },
    [onGlobalMtkChange, onMtkChange, shouldUseGlobalMtk],
  );

  const layoutPaddingTop = insets.top + responsiveMetrics.layoutTopPadding;
  const layoutPaddingBottom = Math.max(insets.bottom, 0) + responsiveMetrics.layoutBottomPadding;
  const refreshProgressOffset = React.useMemo(
    () => Math.round(insets.top + responsiveMetrics.topOffset + responsiveMetrics.topButtonSize + 6),
    [insets.top, responsiveMetrics.topButtonSize, responsiveMetrics.topOffset],
  );
  const blockStyle = React.useMemo(
    () => ({ height: responsiveMetrics.layoutTopBlock }),
    [responsiveMetrics.layoutTopBlock],
  );

  const containerThemeStyle = React.useMemo(
    () => ({ backgroundColor: isDark ? backgroundDark : backgroundLight }),
    [backgroundDark, backgroundLight, isDark],
  );

  const scrollContentStyle = React.useMemo(
    () => [
      styles.baseContent,
      {
        paddingTop: layoutPaddingTop,
        paddingBottom: layoutPaddingBottom,
      },
      contentContainerStyle,
    ],
    [contentContainerStyle, layoutPaddingBottom, layoutPaddingTop],
  );

  const contentWrapStyle = React.useMemo(
    () => [
      styles.contentWrap,
      {
        paddingTop: layoutPaddingTop,
        paddingBottom: layoutPaddingBottom,
      },
      contentStyle,
    ],
    [contentStyle, layoutPaddingBottom, layoutPaddingTop],
  );

  const onScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!onReachEnd) {
        return;
      }

      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceFromBottom <= reachEndOffset) {
        if (!reachEndLockedRef.current) {
          reachEndLockedRef.current = true;
          onReachEnd();
        }
        return;
      }

      if (distanceFromBottom > reachEndOffset + 48) {
        reachEndLockedRef.current = false;
      }
    },
    [onReachEnd, reachEndOffset],
  );

  const resolvedNotificationCount = notificationCount ?? unreadCount;
  const resolvedNotificationText = notificationText
    ?? (resolvedNotificationCount > 0
      ? `${resolvedNotificationCount} oxunmamış bildiriş`
      : 'Yeni bildiriş yoxdur');

  return (
    <View style={[styles.container, containerThemeStyle]}>
      <View style={[styles.block, blockStyle]} />
      <TopPageHeader
        title={title}
        isDark={isDark}
        topInset={insets.top}
        mtkOptions={resolvedMtkOptions}
        initialMtk={resolvedInitialMtk}
        onMtkChange={resolvedOnMtkChange}
        onMtkDropdownOpen={onMtkDropdownOpen}
      />

      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={scrollContentStyle}
          showsVerticalScrollIndicator={false}
          bounces={!isAndroid && Boolean(onRefresh)}
          alwaysBounceVertical={!isAndroid && Boolean(onRefresh)}
          alwaysBounceHorizontal={false}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          automaticallyAdjustsScrollIndicatorInsets={false}
          scrollToOverflowEnabled={false}
          overScrollMode={isAndroid ? 'auto' : 'always'}
          nestedScrollEnabled={false}
          decelerationRate={Platform.OS === 'ios' ? 'normal' : 'normal'}
          refreshControl={onRefresh
            ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={isDark ? '#7dd3fc' : '#2563eb'}
                colors={['#2563eb']}
                progressViewOffset={refreshProgressOffset}
              />
            )
            : undefined}
          onContentSizeChange={() => {
            reachEndLockedRef.current = false;
          }}
          onScroll={onReachEnd ? onScroll : undefined}
          scrollEventThrottle={isAndroid ? 32 : 16}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={contentWrapStyle}>{children}</View>
      )}

      <BottomPageHeader
        title={title}
        isDark={isDark}
        bottomInset={insets.bottom}
        profileRouteKey={profileRouteKey}
        settingsRouteKey={settingsRouteKey}
        devicesRouteKey={devicesRouteKey}
        notificationsRouteKey={notificationsRouteKey}
        notificationText={resolvedNotificationText}
        notificationCount={resolvedNotificationCount}
        quickRouteOptions={selectedRouteOptions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  block: {},
  scrollView: {
    flex: 1,
  },
  baseContent: {
    paddingHorizontal: 16,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
