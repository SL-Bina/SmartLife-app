import React from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { Bell, Bolt, Cpu, UserRound } from 'lucide-react-native';
import SafeBlurView from './safe-blur-view';
import { getHeaderResponsiveMetrics } from './header-responsive';

import { showToast } from '../../utils/action';

type BottomPageHeaderProps = {
  title: string;
  isDark: boolean;
  bottomInset: number;
  profileRouteKey?: string;
  settingsRouteKey?: string;
  devicesRouteKey?: string;
  notificationsRouteKey?: string;
  notificationText?: string;
  notificationCount?: number;
  quickRouteOptions?: Array<{ routeKey: string; label: string }>;
};

export default function BottomPageHeader({
  title,
  isDark,
  bottomInset,
  profileRouteKey = 'profile',
  settingsRouteKey = 'settings',
  devicesRouteKey = 'my_devices',
  notificationsRouteKey = 'notifications',
  notificationText = 'No new notifications',
  notificationCount = 0,
  quickRouteOptions = [],
}: BottomPageHeaderProps) {
  const { width, height, fontScale } = useWindowDimensions();
  const metrics = React.useMemo(
    () => getHeaderResponsiveMetrics(width, fontScale),
    [fontScale, width],
  );

  const navigation =
    useNavigation<DrawerNavigationProp<Record<string, object | undefined>>>();
  const activeRouteName =
    useNavigationState(state => state.routes[state.index]?.name) ?? '';
  const bellRotateValue = React.useRef(new Animated.Value(0)).current;
  const settingsRevealScale = React.useRef(new Animated.Value(0.16)).current;
  const settingsRevealOpacity = React.useRef(new Animated.Value(0)).current;
  const settingsRevealPulseScale = React.useRef(new Animated.Value(0.16)).current;
  const settingsRevealPulseOpacity = React.useRef(new Animated.Value(0)).current;
  const profileButtonRef = React.useRef<View | null>(null);
  const settingsButtonRef = React.useRef<View | null>(null);
  const devicesButtonRef = React.useRef<View | null>(null);
  const notificationButtonRef = React.useRef<View | null>(null);
  const centerRouteButtonRef = React.useRef<View | null>(null);
  const revealAnimatingRef = React.useRef(false);
  const revealTargetRouteRef = React.useRef<string | null>(null);
  const revealSourceRouteRef = React.useRef<string | null>(null);
  const revealFallbackTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [settingsRevealVisible, setSettingsRevealVisible] = React.useState(false);
  const [settingsRevealCenter, setSettingsRevealCenter] = React.useState({ x: 0, y: 0 });
  const [isQuickDropdownOpen, setIsQuickDropdownOpen] = React.useState(false);
  const expandProgress = React.useRef(new Animated.Value(0)).current;
  const layoutProgress = React.useRef(new Animated.Value(0)).current;

  const revealGrowDuration = React.useMemo(() => (width >= 430 ? 430 : 390), [width]);
  const revealPulseFadeDuration = React.useMemo(() => (width >= 430 ? 340 : 300), [width]);
  const revealRingBorderWidth = React.useMemo(
    () => Math.min(4, Math.max(2, width * 0.0065)),
    [width],
  );

  const wrapperStyle = React.useMemo(
    () => [
      styles.wrapper,
      {
        bottom: Math.max(bottomInset, 0) + metrics.bottomOffset,
        paddingHorizontal: metrics.horizontalPadding,
        zIndex: isQuickDropdownOpen ? 220 : styles.wrapper.zIndex,
      },
    ],
    [isQuickDropdownOpen, bottomInset, metrics.bottomOffset, metrics.horizontalPadding],
  );

  const sideGroupWidth = React.useMemo(
    () => metrics.bottomButtonSize * 2 + metrics.bottomActionGap,
    [metrics.bottomActionGap, metrics.bottomButtonSize],
  );

  const maxCapsuleWidth = React.useMemo(
    () =>
      Math.max(
        168,
        width - metrics.horizontalPadding * 2 - sideGroupWidth * 2 - 26,
      ),
    [metrics.horizontalPadding, sideGroupWidth, width],
  );

  const collapsedCapsuleWidth = React.useMemo(
    () =>
      Math.min(
        maxCapsuleWidth,
        Math.max(128, Math.min(162, width * 0.3)),
      ),
    [maxCapsuleWidth, width],
  );

  const expandedCapsuleWidth = React.useMemo(
    () =>
      Math.min(
        maxCapsuleWidth,
        Math.max(collapsedCapsuleWidth + 58, Math.min(236, width * 0.48)),
      ),
    [collapsedCapsuleWidth, maxCapsuleWidth, width],
  );

  const centerWrapperStyle = React.useMemo(
    () => [
      styles.centerWrapper,
      {
        bottom: Math.max(bottomInset, 0) + metrics.bottomOffset,
        left: 0,
        right: 0,
        zIndex: isQuickDropdownOpen ? 280 : styles.centerWrapper.zIndex,
      },
    ],
    [isQuickDropdownOpen, bottomInset, metrics.bottomOffset],
  );

  const actionGroupStyle = React.useMemo(
    () => ({ gap: metrics.bottomActionGap }),
    [metrics.bottomActionGap],
  );

  const sideButtonStyle = React.useMemo(
    () => ({ width: metrics.bottomButtonSize, height: metrics.bottomButtonSize }),
    [metrics.bottomButtonSize],
  );

  const badgeStyle = React.useMemo(
    () => ({
      top: metrics.bottomBadgeInset,
      right: metrics.bottomBadgeInset,
      minWidth: metrics.bottomBadgeSize,
      height: metrics.bottomBadgeSize,
      paddingHorizontal: metrics.bottomBadgeHorizontalPadding,
    }),
    [
      metrics.bottomBadgeHorizontalPadding,
      metrics.bottomBadgeInset,
      metrics.bottomBadgeSize,
    ],
  );

  const badgeTextStyle = React.useMemo(
    () => ({
      fontSize: metrics.bottomBadgeFontSize,
      lineHeight: metrics.bottomBadgeLineHeight,
    }),
    [metrics.bottomBadgeFontSize, metrics.bottomBadgeLineHeight],
  );

  const titleStyle = React.useMemo(
    () => ({
      fontSize: metrics.bottomTitleFontSize,
      width: '100%' as const,
      paddingHorizontal: 0,
    }),
    [metrics.bottomTitleFontSize],
  );

  const titleWrapStyle = React.useMemo(
    () => ({
      height: metrics.bottomButtonSize,
    }),
    [metrics.bottomButtonSize],
  );

  const titleRowStyle = React.useMemo(
    () => ({ gap: Math.max(4, metrics.bottomActionGap - 4) }),
    [metrics.bottomActionGap],
  );

  const titleTouchAreaStyle = React.useMemo(
    () => ({ minHeight: metrics.bottomButtonSize - 4, width: '100%' as const }),
    [metrics.bottomButtonSize],
  );

  const inlineDropdownListStyle = React.useMemo(
    () => ({ paddingBottom: Math.max(5, metrics.bottomActionGap - 3) }),
    [metrics.bottomActionGap],
  );

  const dropdownItemStyle = React.useMemo(
    () => ({
      minHeight: Math.max(42, metrics.bottomButtonSize - 8),
      paddingHorizontal: Math.max(12, metrics.bottomTitlePaddingHorizontal - 2),
      borderRadius: 12,
      marginHorizontal: 6,
      marginVertical: 3,
    }),
    [metrics.bottomButtonSize, metrics.bottomTitlePaddingHorizontal],
  );

  const dropdownItemTextStyle = React.useMemo(
    () => ({ fontSize: Math.max(12, metrics.bottomTitleFontSize - 1) }),
    [metrics.bottomTitleFontSize],
  );

  const canNavigateToRoute = React.useCallback(
    (routeKey: string) => {
      const routeNames = (navigation.getState() as { routeNames?: string[] })?.routeNames ?? [];
      return routeNames.includes(routeKey);
    },
    [navigation],
  );

  const resolveAvailableRoute = React.useCallback(
    (preferredRoute: string, fallbackRoutes: string[] = []) => {
      const allCandidates = [preferredRoute, ...fallbackRoutes].filter(Boolean);
      return allCandidates.find(routeKey => canNavigateToRoute(routeKey)) ?? null;
    },
    [canNavigateToRoute],
  );

  const resetRevealAnimation = React.useCallback(() => {
    if (revealFallbackTimeoutRef.current) {
      clearTimeout(revealFallbackTimeoutRef.current);
      revealFallbackTimeoutRef.current = null;
    }

    settingsRevealScale.stopAnimation();
    settingsRevealOpacity.stopAnimation();
    settingsRevealPulseScale.stopAnimation();
    settingsRevealPulseOpacity.stopAnimation();
    settingsRevealScale.setValue(0.16);
    settingsRevealOpacity.setValue(0);
    settingsRevealPulseScale.setValue(0.16);
    settingsRevealPulseOpacity.setValue(0);
    setSettingsRevealVisible(false);
    revealAnimatingRef.current = false;
    revealTargetRouteRef.current = null;
    revealSourceRouteRef.current = null;
  }, [
    settingsRevealOpacity,
    settingsRevealPulseOpacity,
    settingsRevealPulseScale,
    settingsRevealScale,
  ]);

  const closeQuickDropdown = React.useCallback(() => {
    setIsQuickDropdownOpen(false);
  }, []);

  React.useEffect(() => {
    Animated.timing(expandProgress, {
      toValue: isQuickDropdownOpen ? 1 : 0,
      duration: isQuickDropdownOpen ? 210 : 160,
      easing: isQuickDropdownOpen
        ? Easing.bezier(0.22, 0.61, 0.36, 1)
        : Easing.bezier(0.4, 0, 1, 1),
      useNativeDriver: true,
    }).start();

    Animated.timing(layoutProgress, {
      toValue: isQuickDropdownOpen ? 1 : 0,
      duration: isQuickDropdownOpen ? 210 : 160,
      easing: isQuickDropdownOpen
        ? Easing.bezier(0.22, 0.61, 0.36, 1)
        : Easing.bezier(0.4, 0, 1, 1),
      useNativeDriver: false,
    }).start();
  }, [expandProgress, isQuickDropdownOpen, layoutProgress]);

  const resolvedQuickRouteOptions = React.useMemo(
    () =>
      Array.from(
        new Map(
          quickRouteOptions
            .filter(option => canNavigateToRoute(option.routeKey))
            .map(option => [option.routeKey, option]),
        ).values(),
      ),
    [canNavigateToRoute, quickRouteOptions],
  );

  const activeQuickRoute = React.useMemo(
    () =>
      resolvedQuickRouteOptions.find(option => option.routeKey === activeRouteName),
    [activeRouteName, resolvedQuickRouteOptions],
  );

  const centerLabel = activeQuickRoute?.label ?? title;

  const titleFontSizeStyle = React.useMemo(() => {
    const textLength = centerLabel.trim().length;

    if (textLength <= 14) {
      return { fontSize: metrics.bottomTitleFontSize };
    }

    if (textLength <= 19) {
      return { fontSize: Math.max(12, metrics.bottomTitleFontSize - 1) };
    }

    if (textLength <= 24) {
      return { fontSize: Math.max(11, metrics.bottomTitleFontSize - 2) };
    }

    return { fontSize: Math.max(10, metrics.bottomTitleFontSize - 3) };
  }, [centerLabel, metrics.bottomTitleFontSize]);

  const titleListHeight = React.useMemo(
    () =>
      Math.min(
        resolvedQuickRouteOptions.length * Math.max(42, metrics.bottomButtonSize - 8) + 10,
        Math.max(180, Math.min(height * 0.34, 270)),
      ),
    [height, metrics.bottomButtonSize, resolvedQuickRouteOptions.length],
  );

  const titleWrapAnimatedStyle = React.useMemo(
    () => ({
      width: layoutProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [collapsedCapsuleWidth, expandedCapsuleWidth],
      }),
      height: layoutProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [metrics.bottomButtonSize, metrics.bottomButtonSize + titleListHeight + 10],
      }),
      borderRadius: layoutProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [999, 24],
      }),
    }),
    [
      collapsedCapsuleWidth,
      expandedCapsuleWidth,
      layoutProgress,
      metrics.bottomButtonSize,
      titleListHeight,
    ],
  );

  const titleWrapNativeAnimatedStyle = React.useMemo(
    () => ({
      transform: [
        {
          scale: expandProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.03],
          }),
        },
      ],
    }),
    [expandProgress],
  );

  const titleTextAnimatedStyle = React.useMemo(
    () => ({
      transform: [
        {
          scale: expandProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.08],
          }),
        },
      ],
    }),
    [expandProgress],
  );

  React.useEffect(() => {
    if (!resolvedQuickRouteOptions.length && isQuickDropdownOpen) {
      setIsQuickDropdownOpen(false);
    }
  }, [isQuickDropdownOpen, resolvedQuickRouteOptions.length]);

  React.useEffect(() => {
    setIsQuickDropdownOpen(false);
  }, [activeRouteName]);

  React.useEffect(() => {
    if (!revealAnimatingRef.current) {
      return;
    }

    if (
      revealTargetRouteRef.current &&
      activeRouteName === revealTargetRouteRef.current &&
      revealSourceRouteRef.current !== activeRouteName
    ) {
      requestAnimationFrame(() => {
        resetRevealAnimation();
      });
    }
  }, [activeRouteName, resetRevealAnimation]);

  React.useEffect(
    () => () => {
      if (revealFallbackTimeoutRef.current) {
        clearTimeout(revealFallbackTimeoutRef.current);
      }
    },
    [],
  );

  const runReveal = React.useCallback(
    ({
      buttonRef,
      targetRoute,
      fallbackMessage,
      onComplete,
    }: {
      buttonRef: React.RefObject<View | null>;
      targetRoute?: string | null;
      fallbackMessage?: string;
      onComplete?: () => void;
    }) => {
      if (targetRoute && activeRouteName === targetRoute) {
        return;
      }

      if (targetRoute && !canNavigateToRoute(targetRoute)) {
        showToast(fallbackMessage ?? 'Bu səhifə hazır deyil');
        return;
      }

      if (revealAnimatingRef.current) {
        return;
      }

      const triggerAction = () => {
        if (targetRoute) {
          navigation.navigate(targetRoute as never);
          return;
        }

        onComplete?.();
      };

      const buttonView = buttonRef.current;
      if (!buttonView) {
        triggerAction();
        return;
      }

      buttonView.measureInWindow((x, y, buttonWidth, buttonHeight) => {
        if (!buttonWidth || !buttonHeight) {
          triggerAction();
          return;
        }

        revealAnimatingRef.current = true;
        const centerX = x + buttonWidth / 2;
        const centerY = y + buttonHeight / 2;
        setSettingsRevealCenter({ x: centerX, y: centerY });
        setSettingsRevealVisible(true);

        const maxDistanceToCorner = Math.max(
          Math.hypot(centerX, centerY),
          Math.hypot(width - centerX, centerY),
          Math.hypot(centerX, height - centerY),
          Math.hypot(width - centerX, height - centerY),
        );

        const revealDiameter = Math.max(metrics.bottomButtonSize, 44);
        const targetScale = (maxDistanceToCorner * 2) / revealDiameter;

        settingsRevealScale.setValue(0.16);
        settingsRevealOpacity.setValue(0.98);
        settingsRevealPulseScale.setValue(0.16);
        settingsRevealPulseOpacity.setValue(0.05);

        Animated.parallel([
          Animated.sequence([
            Animated.timing(settingsRevealPulseOpacity, {
              toValue: 0.34,
              duration: 80,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(settingsRevealPulseOpacity, {
              toValue: 0,
              duration: revealPulseFadeDuration,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(settingsRevealPulseScale, {
            toValue: targetScale * 1.12,
            duration: revealGrowDuration,
            easing: Easing.bezier(0.2, 0.7, 0.2, 1),
            useNativeDriver: true,
          }),
        ]).start();

        Animated.timing(settingsRevealScale, {
          toValue: targetScale,
          duration: revealGrowDuration,
          easing: Easing.bezier(0.22, 0.61, 0.36, 1),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (!finished) {
            resetRevealAnimation();
            return;
          }

          if (targetRoute) {
            revealSourceRouteRef.current = activeRouteName;
            revealTargetRouteRef.current = targetRoute;
            triggerAction();

            revealFallbackTimeoutRef.current = setTimeout(() => {
              if (revealAnimatingRef.current) {
                resetRevealAnimation();
              }
            }, 1800);

            return;
          }

          triggerAction();

          Animated.timing(settingsRevealOpacity, {
            toValue: 0,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start(() => {
            resetRevealAnimation();
          });
        });
      });
    },
    [
      activeRouteName,
      canNavigateToRoute,
      height,
      metrics.bottomButtonSize,
      navigation,
      resetRevealAnimation,
      revealGrowDuration,
      revealPulseFadeDuration,
      settingsRevealOpacity,
      settingsRevealPulseOpacity,
      settingsRevealPulseScale,
      settingsRevealScale,
      width,
    ],
  );

  const onProfilePress = React.useCallback(() => {
    closeQuickDropdown();

    const profileRoute = resolveAvailableRoute(profileRouteKey, ['resident_profile', 'profile']);
    if (!profileRoute) {
      showToast('Profil səhifəsi mövcud deyil');
      return;
    }

    if (activeRouteName === profileRoute) {
      return;
    }

    runReveal({
      buttonRef: profileButtonRef,
      targetRoute: profileRoute,
      fallbackMessage: 'Profil səhifəsi mövcud deyil',
    });
  }, [
    activeRouteName,
    closeQuickDropdown,
    profileRouteKey,
    resolveAvailableRoute,
    runReveal,
  ]);

  const onSettingsPress = React.useCallback(() => {
    closeQuickDropdown();

    const settingsRoute = resolveAvailableRoute(settingsRouteKey, ['resident_settings', 'settings']);
    if (!settingsRoute) {
      showToast('Tənzimləmələr bu səhifədə aktiv deyil');
      return;
    }

    if (activeRouteName === settingsRoute) {
      return;
    }

    runReveal({
      buttonRef: settingsButtonRef,
      targetRoute: settingsRoute,
      fallbackMessage: 'Tənzimləmələr bu səhifədə aktiv deyil',
    });
  }, [
    activeRouteName,
    closeQuickDropdown,
    resolveAvailableRoute,
    runReveal,
    settingsRouteKey,
  ]);

  const onDevicesPress = React.useCallback(() => {
    closeQuickDropdown();

    const deviceRoute = resolveAvailableRoute(devicesRouteKey, ['resident_my_devices', 'my_devices']);
    if (!deviceRoute) {
      showToast('My Devices səhifəsi bu istifadəçi üçün aktiv deyil');
      return;
    }

    runReveal({
      buttonRef: devicesButtonRef,
      targetRoute: deviceRoute,
      fallbackMessage: 'My Devices səhifəsi bu istifadəçi üçün aktiv deyil',
    });
  }, [closeQuickDropdown, devicesRouteKey, resolveAvailableRoute, runReveal]);

  const onNotificationPress = React.useCallback(() => {
    closeQuickDropdown();

    const notificationsRoute = resolveAvailableRoute(notificationsRouteKey, [
      'resident_notifications',
      'notifications',
    ]);

    if (!notificationsRoute) {
      showToast('Bildirişlər səhifəsi bu istifadəçi üçün aktiv deyil');
      return;
    }

    runReveal({
      buttonRef: notificationButtonRef,
      targetRoute: notificationsRoute,
      fallbackMessage: notificationText,
    });
  }, [
    closeQuickDropdown,
    notificationText,
    notificationsRouteKey,
    resolveAvailableRoute,
    runReveal,
  ]);

  const onCenterPress = React.useCallback(() => {
    if (!resolvedQuickRouteOptions.length) {
      return;
    }

    setIsQuickDropdownOpen(prev => !prev);
  }, [resolvedQuickRouteOptions.length]);

  const onQuickRouteSelect = React.useCallback(
    (routeKey: string) => {
      closeQuickDropdown();
      if (routeKey === activeRouteName) {
        return;
      }

      runReveal({
        buttonRef: centerRouteButtonRef,
        targetRoute: routeKey,
        fallbackMessage: 'Sürətli keçid səhifəsi mövcud deyil',
      });
    },
    [activeRouteName, closeQuickDropdown, runReveal],
  );

  const blurType = isDark ? 'dark' : 'light';
  const blurFallbackColor = isDark
    ? 'rgba(24,24,27,0.72)'
    : 'rgba(255,255,255,0.72)';
  const controlBlurAmount = Platform.OS === 'android' ? 14 : 20;
  const centerBlurAmount = Platform.OS === 'android' ? 12 : 18;
  const useOverlayBlur = Platform.OS === 'ios';
  const badgeText = notificationCount > 99 ? '99+' : String(notificationCount);

  const renderGlassLayer = React.useCallback(
    (blurAmount: number, target: 'control' | 'capsule' = 'control') => {
    if (Platform.OS === 'android') {
      return (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            target === 'capsule'
              ? isDark
                ? styles.androidCapsuleFillDark
                : styles.androidCapsuleFillLight
              : isDark
                ? styles.androidSolidFillDark
                : styles.androidSolidFillLight,
          ]}
        />
      );
    }

    return (
      <SafeBlurView
        style={StyleSheet.absoluteFillObject}
        blurType={blurType}
        blurAmount={blurAmount}
        fallbackColor={blurFallbackColor}
      />
    );
    },
    [blurFallbackColor, blurType, isDark],
  );

  React.useEffect(() => {
    if (notificationCount <= 0) {
      bellRotateValue.stopAnimation();
      bellRotateValue.setValue(0);
      return;
    }

    const runRingAnimation = () => {
      Animated.sequence([
        Animated.timing(bellRotateValue, {
          toValue: -1,
          duration: 70,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(bellRotateValue, {
          toValue: 1,
          duration: 90,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(bellRotateValue, {
          toValue: -0.8,
          duration: 90,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(bellRotateValue, {
          toValue: 0.8,
          duration: 90,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(bellRotateValue, {
          toValue: 0,
          duration: 80,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();
    };

    runRingAnimation();
    const intervalId = setInterval(runRingAnimation, 4200);

    return () => {
      clearInterval(intervalId);
      bellRotateValue.stopAnimation();
      bellRotateValue.setValue(0);
    };
  }, [bellRotateValue, notificationCount]);

  const bellAnimatedStyle = React.useMemo(
    () => ({
      transform: [
        {
          rotate: bellRotateValue.interpolate({
            inputRange: [-1, 1],
            outputRange: ['-14deg', '14deg'],
          }),
        },
      ],
    }),
    [bellRotateValue],
  );

  const settingsRevealStyle = React.useMemo(() => {
    const revealDiameter = Math.max(metrics.bottomButtonSize, 44);
    return {
      width: revealDiameter,
      height: revealDiameter,
      borderRadius: revealDiameter / 2,
      left: settingsRevealCenter.x - revealDiameter / 2,
      top: settingsRevealCenter.y - revealDiameter / 2,
      opacity: settingsRevealOpacity,
      transform: [{ scale: settingsRevealScale }],
      backgroundColor: isDark ? '#000000' : '#ffffff',
    };
  }, [
    isDark,
    metrics.bottomButtonSize,
    settingsRevealCenter.x,
    settingsRevealCenter.y,
    settingsRevealOpacity,
    settingsRevealScale,
  ]);

  const settingsRevealPulseStyle = React.useMemo(() => {
    const revealDiameter = Math.max(metrics.bottomButtonSize, 44);
    return {
      width: revealDiameter,
      height: revealDiameter,
      borderRadius: revealDiameter / 2,
      left: settingsRevealCenter.x - revealDiameter / 2,
      top: settingsRevealCenter.y - revealDiameter / 2,
      opacity: settingsRevealPulseOpacity,
      transform: [{ scale: settingsRevealPulseScale }],
      borderColor: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
      backgroundColor: 'transparent',
      borderWidth: revealRingBorderWidth,
    };
  }, [
    isDark,
    metrics.bottomButtonSize,
    revealRingBorderWidth,
    settingsRevealCenter.x,
    settingsRevealCenter.y,
    settingsRevealPulseOpacity,
    settingsRevealPulseScale,
  ]);

  const dropdownLayoutAnimatedStyle = React.useMemo(
    () => ({
      height: layoutProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, titleListHeight],
      }),
    }),
    [layoutProgress, titleListHeight],
  );

  const dropdownContentAnimatedStyle = React.useMemo(
    () => ({
      opacity: expandProgress,
      transform: [
        {
          translateY: expandProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [-10, 0],
          }),
        },
        {
          scaleY: expandProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.88, 1],
          }),
        },
      ],
    }),
    [expandProgress],
  );

  const layerAnimatedStyle = React.useMemo(
    () => ({
      opacity: expandProgress,
    }),
    [expandProgress],
  );

  return (
    <>
      {isQuickDropdownOpen ? (
        <Pressable
          style={[styles.dropdownBackdrop, { zIndex: 260 }]}
          onPress={closeQuickDropdown}
        >
          <Animated.View style={[styles.layerOverlay, layerAnimatedStyle]}>
            {useOverlayBlur ? (
              <SafeBlurView
                style={StyleSheet.absoluteFillObject}
                blurType={blurType}
                blurAmount={6}
                fallbackColor={blurFallbackColor}
              />
            ) : null}
            <View
              style={[
                styles.layerTint,
                Platform.OS === 'android'
                  ? styles.layerTintAndroid
                  : isDark
                    ? styles.layerTintDark
                    : styles.layerTintLight,
              ]}
            />
          </Animated.View>
        </Pressable>
      ) : null}

      {settingsRevealVisible ? (
        <View pointerEvents="none" style={styles.revealOverlay}>
          <Animated.View style={[styles.revealPulseCircle, settingsRevealPulseStyle]} />
          <Animated.View style={[styles.revealCircle, settingsRevealStyle]} />
        </View>
      ) : null}

      <View pointerEvents="box-none" style={wrapperStyle}>
        <View style={styles.row}>
          <View style={[styles.actionGroup, actionGroupStyle]}>
            <Pressable
              onPress={onProfilePress}
              ref={profileButtonRef}
              style={[
                styles.sideButton,
                sideButtonStyle,
                isDark ? styles.glassDark : styles.glassLight,
              ]}
            >
              {renderGlassLayer(controlBlurAmount)}

              <UserRound
                size={metrics.sideIconSize}
                color={isDark ? '#f4f4f5' : '#0f172a'}
                strokeWidth={2.3}
              />
            </Pressable>

            <Pressable
              onPress={onSettingsPress}
              ref={settingsButtonRef}
              style={[
                styles.sideButton,
                sideButtonStyle,
                isDark ? styles.glassDark : styles.glassLight,
              ]}
            >
              {renderGlassLayer(controlBlurAmount)}

              <Bolt
                size={metrics.sideIconSize}
                color={isDark ? '#f4f4f5' : '#0f172a'}
                strokeWidth={2.3}
              />
            </Pressable>
          </View>

          <View style={styles.centerSpacer} />

          <View style={[styles.actionGroup, actionGroupStyle]}>
            <Pressable
              onPress={onDevicesPress}
              ref={devicesButtonRef}
              style={[
                styles.sideButton,
                sideButtonStyle,
                isDark ? styles.glassDark : styles.glassLight,
              ]}
            >
              {renderGlassLayer(controlBlurAmount)}

              <Cpu
                size={metrics.sideIconSize}
                color={isDark ? '#f4f4f5' : '#0f172a'}
                strokeWidth={2.3}
              />
            </Pressable>

            <Pressable
              onPress={onNotificationPress}
              ref={notificationButtonRef}
              style={[
                styles.sideButton,
                sideButtonStyle,
                styles.notificationButton,
                isDark ? styles.glassDark : styles.glassLight,
              ]}
            >
              {renderGlassLayer(controlBlurAmount)}

              <Animated.View style={bellAnimatedStyle}>
                <Bell
                  size={metrics.bellIconSize}
                  color={isDark ? '#f4f4f5' : '#0f172a'}
                  strokeWidth={2.4}
                />
              </Animated.View>

              {notificationCount > 0 ? (
                <View style={[styles.badge, badgeStyle, isDark ? styles.badgeDark : styles.badgeLight]}>
                  <Text style={[styles.badgeText, badgeTextStyle]}>{badgeText}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>
      </View>

      <View pointerEvents="box-none" style={centerWrapperStyle}>
        <Animated.View style={titleWrapNativeAnimatedStyle}>
          <Animated.View
            style={[
              styles.titleWrap,
              titleWrapStyle,
              titleWrapAnimatedStyle,
              isDark ? styles.glassDark : styles.glassLight,
            ]}
          >
            {renderGlassLayer(centerBlurAmount, 'capsule')}

            <Pressable
              onPress={onCenterPress}
              disabled={!resolvedQuickRouteOptions.length}
              ref={centerRouteButtonRef}
              style={[styles.titleTouchArea, titleTouchAreaStyle]}
            >
              <View style={[styles.titleRow, titleRowStyle]}>
                <Animated.Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                  ellipsizeMode="tail"
                  style={[
                    styles.title,
                    titleStyle,
                    titleFontSizeStyle,
                    titleTextAnimatedStyle,
                    isDark ? styles.titleDark : styles.titleLight,
                  ]}
                >
                  {centerLabel}
                </Animated.Text>
              </View>
            </Pressable>

            <Animated.View
              pointerEvents={isQuickDropdownOpen ? 'auto' : 'none'}
              style={[
                styles.inlineDropdownList,
                inlineDropdownListStyle,
                dropdownLayoutAnimatedStyle,
              ]}
            >
              <Animated.View style={dropdownContentAnimatedStyle}>
                {resolvedQuickRouteOptions.map(option => {
                  const isActive = option.routeKey === activeRouteName;

                  return (
                    <Pressable
                      key={option.routeKey}
                      onPress={() => onQuickRouteSelect(option.routeKey)}
                      style={[
                        styles.dropdownItem,
                        dropdownItemStyle,
                        isActive
                          ? isDark
                            ? styles.dropdownItemSelectedDark
                            : styles.dropdownItemSelectedLight
                          : undefined,
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.dropdownItemText,
                          dropdownItemTextStyle,
                          isDark
                            ? styles.dropdownItemTextDark
                            : styles.dropdownItemTextLight,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
  },
  centerWrapper: {
    position: 'absolute',
    zIndex: 80,
    alignItems: 'center',
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
  layerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  layerTint: {
    ...StyleSheet.absoluteFillObject,
  },
  layerTintLight: {
    backgroundColor: 'rgba(2,6,23,0.16)',
  },
  layerTintAndroid: {
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  layerTintDark: {
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  revealOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
    elevation: 1,
  },
  revealCircle: {
    position: 'absolute',
  },
  revealPulseCircle: {
    position: 'absolute',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  centerSpacer: {
    flex: 1,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleTouchArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  inlineDropdownList: {
    width: '100%',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dropdownItemSelectedLight: {
    backgroundColor: 'rgba(15,23,42,0.08)',
  },
  dropdownItemSelectedDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dropdownItemText: {
    fontFamily: 'WorkSans-SemiBold',
  },
  dropdownItemTextLight: {
    color: '#0f172a',
  },
  dropdownItemTextDark: {
    color: '#f4f4f5',
  },
  glassLight: {
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 9,
    shadowColor: '#64748b',
  },
  glassDark: {
    borderWidth: 1,
    borderColor: 'rgba(63,63,70,0.65)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
    shadowColor: '#000000',
  },
  sideButton: {
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLight: {
    backgroundColor: '#dc2626',
  },
  badgeDark: {
    backgroundColor: '#ef4444',
  },
  badgeText: {
    color: '#ffffff',
    fontFamily: 'WorkSans-Bold',
  },
  title: {
    textAlign: 'center',
    fontFamily: 'WorkSans-SemiBold',
  },
  titleWrap: {
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 80,
  },
  titleLight: {
    color: '#1e293b',
  },
  titleDark: {
    color: '#f5f5f5',
  },
  androidSolidFillLight: {
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  androidSolidFillDark: {
    backgroundColor: 'rgba(24,24,27,0.9)',
  },
  androidCapsuleFillLight: {
    backgroundColor: '#ffffff',
  },
  androidCapsuleFillDark: {
    backgroundColor: '#18181b',
  },
});
