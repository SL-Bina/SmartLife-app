import React from 'react';
import {
  Animated as NativeAnimated,
  StyleSheet,
  View,
  Text,
  Pressable,
  LayoutChangeEvent,
  LayoutAnimation,
  Platform,
  StatusBar,
  UIManager,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { DrawerActions, NavigationState } from '@react-navigation/native';
import * as LucideIcons from 'lucide-react-native';
import { AppRouteItem, getDrawerMenuRoutes } from './routes/routes';
import {
  selectAuthRoleName,
  selectAuthUser,
  selectIsResident,
} from './store/auth-slice';
import { useAppSelector } from './store/hooks';
import { useThemeMode } from './hooks/use-theme';
import { APP_LAYOUT_COLORS } from './theme/layout-colors';

interface DrawerItemProps {
  route: AppRouteItem;
  isSubItem?: boolean;
}

type SafeIconMap = Record<string, string>;
type MenuIconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

const LIGHT_THEME = {
  background: APP_LAYOUT_COLORS.backgroundLight,
  surface: '#FFFFFF',
  surfaceSoft: 'rgba(255,255,255,0.72)',
  text: '#142235',
  textSoft: '#6D7B8E',
  primary: '#2F6BF2',
  primarySoft: 'rgba(47,107,242,0.12)',
  primaryBorder: 'rgba(47,107,242,0.22)',
  border: 'rgba(20,34,53,0.08)',
  shadow: '#0F172A',
  success: '#22C55E',
  successText: '#2C8A57',
  danger: '#EF4444',
  dangerSoft: 'rgba(239,68,68,0.08)',
  dangerBorder: 'rgba(239,68,68,0.18)',
  iconSoft: 'rgba(20,34,53,0.05)',
  iconSoftActive: 'rgba(47,107,242,0.14)',
  subMenuBorder: 'rgba(47,107,242,0.16)',
  liveBg: 'rgba(34,197,94,0.1)',
  liveBorder: 'rgba(34,197,94,0.2)',
  badgeDot: '#A7F3D0',
};

const DARK_THEME = {
  background: APP_LAYOUT_COLORS.backgroundDark,
  surface: '#141418',
  surfaceSoft: 'rgba(39,39,42,0.78)',
  text: '#f4f4f5',
  textSoft: '#a1a1aa',
  primary: '#60a5fa',
  primarySoft: 'rgba(59,130,246,0.18)',
  primaryBorder: 'rgba(96,165,250,0.38)',
  border: 'rgba(113,113,122,0.32)',
  shadow: '#000000',
  success: '#4ade80',
  successText: '#86efac',
  danger: '#f87171',
  dangerSoft: 'rgba(248,113,113,0.16)',
  dangerBorder: 'rgba(248,113,113,0.36)',
  iconSoft: 'rgba(244,244,245,0.08)',
  iconSoftActive: 'rgba(96,165,250,0.22)',
  subMenuBorder: 'rgba(96,165,250,0.26)',
  liveBg: 'rgba(74,222,128,0.14)',
  liveBorder: 'rgba(74,222,128,0.32)',
  badgeDot: '#86efac',
};

type DrawerTheme = typeof LIGHT_THEME;
const THEME = LIGHT_THEME;

const DRAWER_GUTTER = 14;
const ROW_GAP = 8;
const PROFILE_ROUTE_KEYS = new Set(['profile', 'resident_profile']);
const HIDDEN_DRAWER_ROUTE_KEYS = new Set([
  'notifications',
  'notifications_send',
  'notifications_archive',
  'notifications_sent_sms',
  'resident_notifications',
]);

const ROUTE_ICON_MAP: SafeIconMap = {
  home: 'Home',
  finance_invoices: 'FileText',
  finance_payment_history: 'History',
  finance_reports: 'BarChart3',
  finance_expenses: 'HandCoins',
  finance_deposit: 'PiggyBank',
  finance_transfers: 'ArrowLeftRight',
  finance_debt: 'ReceiptText',
  management_mtk: 'Building2',
  management_complex: 'Building',
  management_building: 'Factory',
  management_block: 'Layers3',
  management_property: 'HousePlus',
  management_resident: 'UsersRound',
  services: 'Wrench',
  devices_list: 'Cpu',
  devices_connection: 'Cable',
  parking: 'ParkingCircle',
  notifications: 'BellRing',
  applications_list: 'ClipboardList',
  applications_evaluation: 'ClipboardCheck',
  notifications_send: 'Send',
  notifications_archive: 'Archive',
  notifications_sent_sms: 'MessagesSquare',
  queries_create: 'PenSquare',
  queries_list: 'CircleHelp',
  complex_dashboard: 'LayoutDashboard',
  kpi: 'LineChart',
  electronic_documents: 'BookText',
  reception: 'Inbox',
  permissions: 'ShieldCheck',
  users: 'UserRound',
  profile: 'UserCircle2',
  settings: 'SlidersHorizontal',
  resident_home: 'House',
  resident_complex_dashboard: 'Gauge',
  resident_invoices: 'ScrollText',
  resident_payment_history: 'CreditCard',
  resident_my_properties: 'Home',
  resident_my_services: 'ConciergeBell',
  resident_tickets: 'Ticket',
  resident_e_documents: 'BookOpenText',
  resident_notifications: 'BellDot',
  resident_profile: 'UserRoundCheck',
  resident_settings: 'SlidersHorizontal',
  auth_sign_in: 'KeyRound',
};

const GROUP_ICON_MAP: SafeIconMap = {
  'sidebar.finance': 'Wallet',
  'sidebar.buildingManagement': 'Landmark',
  'sidebar.devices': 'HardDrive',
  'sidebar.applications': 'ClipboardCheck',
  'sidebar.notificationsAndQueries': 'MessageCircleMore',
};

const iconSet = LucideIcons as unknown as Record<string, MenuIconComponent>;

const getLucideIcon = (iconName: string): MenuIconComponent => {
  return (
    iconSet[iconName] ||
    iconSet.CircleHelp ||
    iconSet.Globe ||
    iconSet.Square
  );
};

const resolveMenuIcon = (route: AppRouteItem): MenuIconComponent => {
  if (route.routeKey && ROUTE_ICON_MAP[route.routeKey]) {
    return getLucideIcon(ROUTE_ICON_MAP[route.routeKey]);
  }
  if (GROUP_ICON_MAP[route.name]) return getLucideIcon(GROUP_ICON_MAP[route.name]);
  return getLucideIcon('CircleHelp');
};

const Building2Icon = getLucideIcon('Building2');
const Layers3Icon = getLucideIcon('Layers3');
const HouseIcon = getLucideIcon('House');

const getActiveRouteState = (
  routes: NavigationState['routes'],
  index: number,
  routeKey: string,
) => routes[index].name.toLowerCase().includes(routeKey?.toLowerCase());

const isRouteActive = (
  routes: NavigationState['routes'],
  index: number,
  route: AppRouteItem,
): boolean => {
  if (route.routeKey) return getActiveRouteState(routes, index, route.routeKey);
  return route.children?.some(child => isRouteActive(routes, index, child)) ?? false;
};

const removeFilteredMenuItems = (items: AppRouteItem[]): AppRouteItem[] => {
  return items.reduce<AppRouteItem[]>((acc, item) => {
    if (
      item.routeKey &&
      (PROFILE_ROUTE_KEYS.has(item.routeKey) || HIDDEN_DRAWER_ROUTE_KEYS.has(item.routeKey))
    ) {
      return acc;
    }

    const nextChildren = item.children
      ? removeFilteredMenuItems(item.children)
      : undefined;

    if (!item.routeKey && item.children && (!nextChildren || nextChildren.length === 0)) {
      return acc;
    }

    acc.push({
      ...item,
      children: nextChildren,
    });

    return acc;
  }, []);
};

const ARROW_SPRING = {
  damping: 18,
  stiffness: 240,
  mass: 0.85,
};

const canUseReanimatedDrawer =
  typeof (globalThis as { nativeCallSyncHook?: unknown }).nativeCallSyncHook ===
  'function';

const runSafeMenuTransition = () => {
  LayoutAnimation.configureNext({
    duration: 240,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.spring,
      springDamping: 0.86,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
};

const CollapsibleSubMenu: React.FC<{
  expanded: boolean;
  children: React.ReactNode;
}> = ({ expanded, children }) => {
  const [contentHeight, setContentHeight] = React.useState(0);
  const height = useSharedValue(expanded ? contentHeight : 0);
  const progress = useSharedValue(expanded ? 1 : 0);

  React.useEffect(() => {
    height.value = withTiming(expanded ? contentHeight : 0, {
      duration: expanded ? 220 : 180,
    });
    progress.value = withTiming(expanded ? 1 : 0, {
      duration: expanded ? 220 : 160,
    });
  }, [expanded, contentHeight, height, progress]);

  const onContentLayout = React.useCallback((e: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(e.nativeEvent.layout.height);
    setContentHeight(prev => (prev !== nextHeight ? nextHeight : prev));
  }, []);

  const containerStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
      opacity: progress.value,
      transform: [
        {
          translateY: interpolate(progress.value, [0, 1], [-8, 0]),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.subMenuContainer, containerStyle]}>
      <View
        onLayout={onContentLayout}
        style={styles.subMenuContent}
        pointerEvents={expanded ? 'auto' : 'none'}
      >
        {children}
      </View>
    </Animated.View>
  );
};

const CollapsibleSubMenuSafe: React.FC<{
  expanded: boolean;
  children: React.ReactNode;
}> = ({ expanded, children }) => {
  const [contentHeight, setContentHeight] = React.useState(0);
  const progress = React.useRef(new NativeAnimated.Value(expanded ? 1 : 0)).current;

  React.useEffect(() => {
    NativeAnimated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: expanded ? 230 : 180,
      useNativeDriver: false,
    }).start();
  }, [expanded, progress]);

  const onContentLayout = React.useCallback((e: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(e.nativeEvent.layout.height);
    setContentHeight(prev => (prev !== nextHeight ? nextHeight : prev));
  }, []);

  const animatedStyle = React.useMemo(
    () => ({
      height: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.max(contentHeight, 1)],
      }),
      opacity: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-8, 0],
          }),
        },
      ],
    }),
    [contentHeight, progress],
  );

  return (
    <NativeAnimated.View style={[styles.subMenuContainer, animatedStyle]}>
      <View
        onLayout={onContentLayout}
        style={styles.subMenuContent}
        pointerEvents={expanded ? 'auto' : 'none'}
      >
        <View style={styles.subMenuContentSafe}>{children}</View>
      </View>
    </NativeAnimated.View>
  );
};

const DrawerRow: React.FC<
  DrawerItemProps &
  DrawerContentComponentProps & {
    focused?: boolean;
    theme: DrawerTheme;
  }
> = ({ route, isSubItem = false, focused, theme, ...props }) => {
  const activeColor =
    props.descriptors[props.state.routes[props.state.index].key]?.options
      ?.drawerActiveBackgroundColor || theme.primary;

  const routeIconName = route.routeKey ? ROUTE_ICON_MAP[route.routeKey] : GROUP_ICON_MAP[route.name];
  const RowIcon = getLucideIcon(routeIconName || 'CircleHelp');
  const tintColor = focused ? activeColor : isSubItem ? theme.textSoft : theme.text;

  return (
    <Pressable
      onPress={() =>
        route.routeKey
          ? props.navigation.navigate(route.routeKey)
          : props.navigation.dispatch(DrawerActions.closeDrawer())
      }
      style={({ pressed }) => [
        styles.rowPressable,
        isSubItem && styles.subRowPressable,
        pressed && styles.rowPressed,
      ]}
    >
      <View
        style={[
          styles.rowCard,
          {
            backgroundColor: theme.surfaceSoft,
            borderColor: theme.border,
          },
          isSubItem && styles.subRowCard,
          focused && {
            backgroundColor: theme.primarySoft,
            borderColor: theme.primaryBorder,
          },
        ]}
      >
        {focused && <View style={[styles.activeLine, { backgroundColor: activeColor }]} />}

        <View style={styles.rowInner}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: theme.iconSoft },
              focused && styles.iconWrapActive,
              focused ? { backgroundColor: theme.iconSoftActive } : null,
              isSubItem && styles.subIconWrap,
            ]}
          >
            <RowIcon size={isSubItem ? 18 : 20} color={tintColor} strokeWidth={2.2} />
          </View>

          <Text
            numberOfLines={1}
            style={[
              styles.rowText,
              isSubItem && styles.subRowText,
              focused && styles.rowTextFocused,
              { color: tintColor },
            ]}
          >
            {route.label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const ParentRow: React.FC<{
  route: AppRouteItem;
  expanded: boolean;
  isParentActive: boolean;
  onPress: () => void;
  activeColor: string;
  theme: DrawerTheme;
}> = ({ route, expanded, isParentActive, onPress, activeColor, theme }) => {
  const rotate = useSharedValue(expanded ? 1 : 0);
  const ParentIcon = resolveMenuIcon(route);
  const ChevronDownIcon = getLucideIcon('ChevronDown');

  React.useEffect(() => {
    rotate.value = withSpring(expanded ? 1 : 0, ARROW_SPRING);
  }, [expanded, rotate]);

  const arrowStyle = useAnimatedStyle(() => {
    const deg = interpolate(rotate.value, [0, 1], [0, 180]);
    return {
      transform: [{ rotate: `${deg}deg` }],
    };
  });

  const tintColor = isParentActive ? activeColor : theme.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.rowPressable, pressed && styles.rowPressed]}
    >
      <View
        style={[
          styles.rowCard,
          {
            backgroundColor: theme.surfaceSoft,
            borderColor: theme.border,
          },
          isParentActive && {
            backgroundColor: theme.primarySoft,
            borderColor: theme.primaryBorder,
          },
        ]}
      >
        {isParentActive ? (
          <View style={[styles.activeLine, { backgroundColor: activeColor }]} />
        ) : null}

        <View style={styles.rowInner}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: theme.iconSoft },
              isParentActive && styles.iconWrapActive,
              isParentActive ? { backgroundColor: theme.iconSoftActive } : null,
            ]}
          >
            <ParentIcon size={20} color={tintColor} strokeWidth={2.2} />
          </View>

          <Text
            numberOfLines={1}
            style={[
              styles.rowText,
              isParentActive && styles.rowTextFocused,
              { color: tintColor },
            ]}
          >
            {route.label}
          </Text>

          <Animated.View style={arrowStyle}>
            <ChevronDownIcon size={20} color={tintColor} strokeWidth={2.5} />
          </Animated.View>
        </View>
      </View>
    </Pressable>
  );
};

const DrawerContent: React.FC<DrawerContentComponentProps> = props => {
  const authUser = useAppSelector(selectAuthUser);
  const roleName = useAppSelector(selectAuthRoleName);
  const isResident = useAppSelector(selectIsResident);
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const theme = isDark ? DARK_THEME : LIGHT_THEME;
  const insets = useSafeAreaInsets();
  const [expandedParent, setExpandedParent] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const { routes, index } = props.state;
  const drawerLayout = isResident ? 'resident' : 'dashboard';
  const drawerMenuRoutes = React.useMemo(
    () =>
      removeFilteredMenuItems(
        getDrawerMenuRoutes(drawerLayout, authUser, roleName || undefined),
      ),
    [authUser, drawerLayout, roleName],
  );
  const sceneOptions = props.descriptors[routes[index].key]?.options;
  const activeColor = sceneOptions?.drawerActiveBackgroundColor || theme.primary;

  const activeParentName = React.useMemo(() => {
    const activeParent = drawerMenuRoutes.find(
      route => route.children?.length && isRouteActive(routes, index, route),
    );
    return activeParent?.name ?? null;
  }, [drawerMenuRoutes, routes, index]);

  React.useEffect(() => {
    if (activeParentName) {
      if (!canUseReanimatedDrawer) {
        runSafeMenuTransition();
      }
      setExpandedParent(activeParentName);
    }
  }, [activeParentName]);

  const contentInsetStyles = React.useMemo(
    () => ({
      paddingBottom: Math.max(insets.bottom, 14) + 6,
    }),
    [insets.bottom],
  );

  const topInsetStyles = React.useMemo(
    () => ({
      paddingTop:
        insets.top > 0
          ? insets.top
          : Platform.OS === 'android'
            ? (StatusBar.currentHeight ?? 0)
            : 0,
    }),
    [insets.top],
  );

  const renderRoute = (route: AppRouteItem) => {
    const focused = isRouteActive(routes, index, route);

    if (route.children?.length) {
      const expanded = expandedParent === route.name || activeParentName === route.name;
      const isLockedOpen = activeParentName === route.name;
      const isParentActive = isRouteActive(routes, index, route);

      return (
        <View key={route.name} style={styles.parentBlock}>
          <ParentRow
            route={route}
            expanded={expanded}
            isParentActive={isParentActive}
            activeColor={activeColor}
            theme={theme}
            onPress={() => {
              if (isLockedOpen) return;
              if (!canUseReanimatedDrawer) {
                runSafeMenuTransition();
              }
              setExpandedParent(prev => (prev === route.name ? null : route.name));
            }}
          />

          <CollapsibleSubMenu expanded={expanded}>
            <View style={[styles.subMenuWrap, { borderLeftColor: theme.subMenuBorder }]}>
              {route.children.map(child => (
                <DrawerRow
                  key={child.name}
                  {...props}
                  route={child}
                  isSubItem
                  theme={theme}
                  focused={isRouteActive(routes, index, child)}
                />
              ))}
            </View>
          </CollapsibleSubMenu>
        </View>
      );
    }

    return (
      <DrawerRow
        key={route.name}
        {...props}
        route={route}
        theme={theme}
        focused={focused}
      />
    );
  };

  const renderRouteSafe = (route: AppRouteItem) => {
    const focused = isRouteActive(routes, index, route);

    if (route.children?.length) {
      const expanded = expandedParent === route.name || activeParentName === route.name;
      const isLockedOpen = activeParentName === route.name;
      const isParentActive = isRouteActive(routes, index, route);
      const ParentIcon = resolveMenuIcon(route);
      const ChevronDownIcon = getLucideIcon('ChevronDown');
      const tintColor = isParentActive ? activeColor : theme.text;

      return (
        <View key={route.name} style={styles.parentBlock}>
          <Pressable
            onPress={() => {
              if (isLockedOpen) return;
              runSafeMenuTransition();
              setExpandedParent(prev => (prev === route.name ? null : route.name));
            }}
            style={({ pressed }) => [styles.rowPressable, pressed && styles.rowPressed]}
          >
            <View
              style={[
                styles.rowCard,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.border,
                },
                isParentActive && {
                  backgroundColor: theme.primarySoft,
                  borderColor: theme.primaryBorder,
                },
              ]}
            >
              {isParentActive ? (
                <View style={[styles.activeLine, { backgroundColor: activeColor }]} />
              ) : null}

              <View style={styles.rowInner}>
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: theme.iconSoft },
                    isParentActive && styles.iconWrapActive,
                    isParentActive ? { backgroundColor: theme.iconSoftActive } : null,
                  ]}
                >
                  <ParentIcon size={20} color={tintColor} strokeWidth={2.2} />
                </View>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.rowText,
                    isParentActive && styles.rowTextFocused,
                    { color: tintColor },
                  ]}
                >
                  {route.label}
                </Text>

                <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
                  <ChevronDownIcon size={20} color={tintColor} strokeWidth={2.5} />
                </View>
              </View>
            </View>
          </Pressable>

          <CollapsibleSubMenuSafe expanded={expanded}>
            <View style={[styles.subMenuWrapSafeMode, { borderLeftColor: theme.subMenuBorder }]}> 
              {route.children.map(child => (
                <DrawerRow
                  key={child.name}
                  {...props}
                  route={child}
                  isSubItem
                  theme={theme}
                  focused={isRouteActive(routes, index, child)}
                />
              ))}
            </View>
          </CollapsibleSubMenuSafe>
        </View>
      );
    }

    return (
      <DrawerRow
        key={route.name}
        {...props}
        route={route}
        theme={theme}
        focused={focused}
      />
    );
  };

  return (
    <SafeAreaView
      edges={['right', 'bottom', 'left']}
      style={[styles.safeArea, { backgroundColor: theme.background }, topInsetStyles]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.brandPanel,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <View style={styles.brandRow}>
            <View style={[styles.brandBadge, { backgroundColor: theme.primary, shadowColor: theme.shadow }]}> 
              <Text style={styles.brandBadgeText}>SL</Text>
              <View style={[styles.brandBadgeDot, { backgroundColor: theme.badgeDot }]} />
            </View>

            <View style={styles.flexOne}>
              <Text style={[styles.panelKicker, { color: theme.textSoft }]}>MTK</Text>
              <Text style={[styles.panelTitle, { color: theme.text }]}>West Town MTK</Text>
              <Text style={[styles.panelSubtitle, { color: theme.textSoft }]}>SmartLife idarə paneli</Text>
            </View>

            <View style={[styles.livePill, { backgroundColor: theme.liveBg, borderColor: theme.liveBorder }]}>
              <View style={[styles.liveDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.liveText, { color: theme.successText }]}>Aktiv</Text>
            </View>
          </View>

          <View style={styles.panelStatsRow}>
            <View style={[styles.panelStatChip, { borderColor: theme.primaryBorder, backgroundColor: theme.primarySoft }]}>
              <Building2Icon size={14} color={theme.primary} strokeWidth={2.3} />
              <Text style={[styles.panelStatText, { color: theme.primary }]}>3 bina</Text>
            </View>

            <View style={[styles.panelStatChip, { borderColor: theme.primaryBorder, backgroundColor: theme.primarySoft }]}>
              <Layers3Icon size={14} color={theme.primary} strokeWidth={2.3} />
              <Text style={[styles.panelStatText, { color: theme.primary }]}>12 blok</Text>
            </View>

            <View style={[styles.panelStatChip, { borderColor: theme.primaryBorder, backgroundColor: theme.primarySoft }]}>
              <HouseIcon size={14} color={theme.primary} strokeWidth={2.3} />
              <Text style={[styles.panelStatText, { color: theme.primary }]}>480 mənzil</Text>
            </View>
          </View>
        </View>
      </View>

      <DrawerContentScrollView
        {...props}
        style={{ backgroundColor: theme.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: theme.background },
          contentInsetStyles,
        ]}
      >
        {drawerMenuRoutes.map(canUseReanimatedDrawer ? renderRoute : renderRouteSafe)}
      </DrawerContentScrollView>

      {/* <Pressable
        style={({ pressed }) => [
          styles.signOutBtn,
          signOutInsetStyles,
          pressed && styles.rowPressed,
        ]}
      >
        <View style={styles.signOutLeft}>
          <View style={styles.signOutIconWrap}>
            <LogoutIcon size={18} color={THEME.danger} strokeWidth={2.2} />
          </View>
          <Text style={styles.signOutText}>Çıxış et</Text>
        </View>
      </Pressable> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },

  header: {
    paddingHorizontal: DRAWER_GUTTER,
    paddingTop: 8,
    paddingBottom: 8,
  },
  flexOne: {
    flex: 1,
  },
  brandPanel: {
    backgroundColor: THEME.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: THEME.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    position: 'relative',
    shadowColor: THEME.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  brandBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'WorkSans-Bold',
  },
  brandBadgeDot: {
    position: 'absolute',
    right: 7,
    top: 7,
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: '#A7F3D0',
  },
  panelKicker: {
    fontSize: 10,
    color: THEME.textSoft,
    fontFamily: 'WorkSans-SemiBold',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  panelTitle: {
    fontSize: 18,
    color: THEME.text,
    fontFamily: 'WorkSans-Bold',
  },
  panelSubtitle: {
    fontSize: 12,
    color: THEME.textSoft,
    fontFamily: 'WorkSans-Regular',
    marginTop: 2,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: THEME.success,
    marginRight: 6,
  },
  liveText: {
    color: THEME.successText,
    fontSize: 11,
    fontFamily: 'WorkSans-Medium',
  },
  panelStatsRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  panelStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: THEME.primaryBorder,
    backgroundColor: THEME.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  panelStatText: {
    marginLeft: 6,
    color: THEME.primary,
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 6,
    paddingHorizontal: DRAWER_GUTTER,
  },

  parentBlock: {
    marginBottom: 0,
  },
  parentRowPressable: {
    marginBottom: ROW_GAP,
  },
  parentRow: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: THEME.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  parentRowExpanded: {
    borderColor: THEME.primaryBorder,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  parentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parentIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(20,34,53,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  parentIconWrapActive: {
    backgroundColor: 'rgba(47,107,242,0.14)',
  },
  parentText: {
    fontSize: 14,
    fontFamily: 'WorkSans-SemiBold',
  },
  parentSubText: {
    marginTop: 2,
    fontSize: 11,
    color: THEME.textSoft,
    fontFamily: 'WorkSans-Regular',
  },

  subMenuContainer: {
    overflow: 'hidden',
  },
  subMenuContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingBottom: 8,
  },
  subMenuContentSafe: {
    width: '100%',
  },
  subMenuWrap: {
    marginLeft: 12,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(47,107,242,0.16)',
  },
  subMenuWrapSafeMode: {
    marginLeft: 12,
    paddingLeft: 10,
    paddingTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(47,107,242,0.16)',
  },

  rowPressable: {
    marginBottom: ROW_GAP,
  },
  subRowPressable: {
    marginBottom: ROW_GAP,
  },
  rowPressed: {
    opacity: 0.93,
    transform: [{ scale: 0.997 }],
  },
  rowCard: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: THEME.surfaceSoft,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
  },
  subRowCard: {
    minHeight: 48,
    borderRadius: 16,
  },
  activeLine: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 4,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(20,34,53,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(47,107,242,0.14)',
  },
  subIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  rowText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: THEME.text,
    fontFamily: 'WorkSans-Medium',
  },
  subRowText: {
    fontSize: 13,
  },
  rowTextFocused: {
    fontFamily: 'WorkSans-SemiBold',
  },

  signOutBtn: {
    marginHorizontal: DRAWER_GUTTER + 4,
    marginTop: 8,
    marginBottom: 12,
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: THEME.dangerBorder,
    backgroundColor: THEME.dangerSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  signOutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    paddingLeft: 15,
  },
  signOutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.12)',
    marginRight: 10,
  },
  signOutText: {
    color: THEME.danger,
    fontSize: 15,
    fontFamily: 'WorkSans-SemiBold',
  },
});

export default DrawerContent;