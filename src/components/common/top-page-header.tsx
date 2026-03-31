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
import { DrawerActions, useNavigation, useNavigationState } from '@react-navigation/native';
import { Check, ChevronDown, Menu, QrCode } from 'lucide-react-native';
import SafeBlurView from './safe-blur-view';
import { getHeaderResponsiveMetrics } from './header-responsive';
import { showToast } from '../../utils/action';

type TopPageHeaderProps = {
  title: string;
  isDark: boolean;
  topInset: number;
  mtkOptions?: string[];
  initialMtk?: string;
  onMtkChange?: (mtkName: string) => void;
  onMtkDropdownOpen?: () => void;
};

export default function TopPageHeader({
  title,
  isDark,
  topInset,
  mtkOptions,
  initialMtk,
  onMtkChange,
  onMtkDropdownOpen,
}: TopPageHeaderProps) {
  const { width, fontScale } = useWindowDimensions();
  const metrics = React.useMemo(
    () => getHeaderResponsiveMetrics(width, fontScale),
    [fontScale, width],
  );

  const navigation =
    useNavigation<DrawerNavigationProp<Record<string, object | undefined>>>();
  const activeRouteName =
    useNavigationState(state => state.routes[state.index]?.name) ?? '';
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const hasMtkOptions = (mtkOptions?.length ?? 0) > 0;
  const normalizedInitialMtk = (initialMtk ?? '').trim();
  const mtkOptionsSignature = React.useMemo(
    () => (mtkOptions ?? []).map(option => option.trim()).join('||'),
    [mtkOptions],
  );
  const [selectedMtk, setSelectedMtk] = React.useState(
    normalizedInitialMtk || mtkOptions?.[0] || 'MTK',
  );
  const previousInitialMtkRef = React.useRef(normalizedInitialMtk);
  const expandProgress = React.useRef(new Animated.Value(0)).current;
  const layoutProgress = React.useRef(new Animated.Value(0)).current;

  const wrapperStyle = React.useMemo(
    () => [
      styles.wrapper,
      {
        top: topInset + metrics.topOffset,
        paddingHorizontal: metrics.horizontalPadding,
        zIndex: isDropdownOpen ? 220 : styles.wrapper.zIndex,
      },
    ],
    [isDropdownOpen, metrics.horizontalPadding, metrics.topOffset, topInset],
  );
  const centerWrapperStyle = React.useMemo(
    () => [
      styles.centerWrapper,
      {
        top: topInset + metrics.topOffset,
        left: metrics.topCenterInset,
        right: metrics.topCenterInset,
        zIndex: isDropdownOpen ? 280 : styles.centerWrapper.zIndex,
      },
    ],
    [isDropdownOpen, metrics.topCenterInset, metrics.topOffset, topInset],
  );

  const blurType = isDark ? 'dark' : 'light';
  const blurFallbackColor = isDark
    ? 'rgba(24,24,27,0.72)'
    : 'rgba(255,255,255,0.72)';
  const controlBlurAmount = Platform.OS === 'android' ? 14 : 20;
  const centerBlurAmount = Platform.OS === 'android' ? 12 : 18;
  const useOverlayBlur = Platform.OS === 'ios';

  const onQrScannerPress = React.useCallback(() => {
    const routeNames = (navigation.getState() as { routeNames?: string[] })?.routeNames ?? [];
    const scannerRoute =
      routeNames.find(route => route === 'qr_scanner') ??
      routeNames.find(route => route === 'resident_qr_scanner');

    if (!scannerRoute) {
      showToast('QR scanner bu səhifə üçün aktiv deyil');
      return;
    }

    if (activeRouteName === scannerRoute) {
      return;
    }

    navigation.navigate(scannerRoute as never);
  }, [activeRouteName, navigation]);

  const onMenuPressIn = React.useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const closeDropdown = React.useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  const resolvedMtkOptions = React.useMemo(() => {
    const source = hasMtkOptions
      ? mtkOptions ?? []
      : normalizedInitialMtk
        ? [normalizedInitialMtk]
        : [];
    const unique = Array.from(new Set(source));

    if (selectedMtk && !unique.includes(selectedMtk) && hasMtkOptions) {
      unique.unshift(selectedMtk);
    }

    return unique;
  }, [hasMtkOptions, mtkOptionsSignature, normalizedInitialMtk, selectedMtk]);

  const canOpenMtkDropdown = resolvedMtkOptions.length > 1;
  const centerTitle = selectedMtk || normalizedInitialMtk || resolvedMtkOptions[0] || 'MTK';

  const onCenterPress = React.useCallback(() => {
    if (!canOpenMtkDropdown) {
      return;
    }

    setIsDropdownOpen(prev => {
      const next = !prev;
      if (next) {
        onMtkDropdownOpen?.();
      }
      return next;
    });
  }, [canOpenMtkDropdown, onMtkDropdownOpen]);

  const titleListHeight = React.useMemo(
    () =>
      Math.min(
        resolvedMtkOptions.length * metrics.topDropdownRowHeight + metrics.topDropdownExtraPadding,
        metrics.topDropdownMaxHeight,
      ),
    [
      metrics.topDropdownExtraPadding,
      metrics.topDropdownMaxHeight,
      metrics.topDropdownRowHeight,
      resolvedMtkOptions.length,
    ],
  );

  const onMtkSelect = React.useCallback(
    (mtkName: string) => {
      setSelectedMtk(mtkName);
      onMtkChange?.(mtkName);
      closeDropdown();
    },
    [closeDropdown, onMtkChange],
  );

  React.useEffect(() => {
    const initialChanged = previousInitialMtkRef.current !== normalizedInitialMtk;
    previousInitialMtkRef.current = normalizedInitialMtk;

    if (initialChanged && normalizedInitialMtk) {
      setSelectedMtk(normalizedInitialMtk);
      return;
    }

    if (resolvedMtkOptions.length === 0) {
      setSelectedMtk(prev => prev || 'MTK');
      return;
    }

    setSelectedMtk(prev => {
      if (prev && resolvedMtkOptions.includes(prev)) {
        return prev;
      }

      if (normalizedInitialMtk && resolvedMtkOptions.includes(normalizedInitialMtk)) {
        return normalizedInitialMtk;
      }

      return resolvedMtkOptions[0];
    });
  }, [normalizedInitialMtk, resolvedMtkOptions]);

  React.useEffect(() => {
    if (!canOpenMtkDropdown && isDropdownOpen) {
      setIsDropdownOpen(false);
    }
  }, [canOpenMtkDropdown, isDropdownOpen]);

  React.useEffect(() => {
    Animated.timing(expandProgress, {
      toValue: isDropdownOpen ? 1 : 0,
      duration: isDropdownOpen ? 210 : 160,
      easing: isDropdownOpen
        ? Easing.bezier(0.22, 0.61, 0.36, 1)
        : Easing.bezier(0.4, 0, 1, 1),
      useNativeDriver: true,
    }).start();

    Animated.timing(layoutProgress, {
      toValue: isDropdownOpen ? 1 : 0,
      duration: isDropdownOpen ? 210 : 160,
      easing: isDropdownOpen
        ? Easing.bezier(0.22, 0.61, 0.36, 1)
        : Easing.bezier(0.4, 0, 1, 1),
      useNativeDriver: false,
    }).start();
  }, [expandProgress, isDropdownOpen, layoutProgress]);

  const titleWrapAnimatedStyle = React.useMemo(
    () => ({
      height: layoutProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [metrics.topTitleCollapsedHeight, metrics.topTitleExpandedBase + titleListHeight],
      }),
      marginHorizontal: layoutProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -10],
      }),
      borderRadius: layoutProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [999, 24],
      }),
    }),
    [layoutProgress, metrics.topTitleCollapsedHeight, metrics.topTitleExpandedBase, titleListHeight],
  );

  const sideButtonStyle = React.useMemo(
    () => ({ width: metrics.topButtonSize, height: metrics.topButtonSize }),
    [metrics.topButtonSize],
  );

  const titleWrapStaticStyle = React.useMemo(
    () => ({
      paddingHorizontal: metrics.topTitlePaddingHorizontal,
      paddingTop: metrics.topTitlePaddingTop,
    }),
    [metrics.topTitlePaddingHorizontal, metrics.topTitlePaddingTop],
  );

  const titleTouchAreaStyle = React.useMemo(
    () => ({ minHeight: metrics.topTitleTouchMinHeight }),
    [metrics.topTitleTouchMinHeight],
  );

  const titleRowStyle = React.useMemo(
    () => ({ gap: metrics.topTitleRowGap }),
    [metrics.topTitleRowGap],
  );

  const inlineDropdownListStyle = React.useMemo(
    () => ({ paddingBottom: metrics.topInlineDropdownPaddingBottom }),
    [metrics.topInlineDropdownPaddingBottom],
  );

  const titleTextStyle = React.useMemo(
    () => ({
      fontSize: metrics.topTitleFontSize,
      paddingHorizontal: Math.max(metrics.topTitlePaddingHorizontal - 4, 10),
    }),
    [metrics.topTitleFontSize, metrics.topTitlePaddingHorizontal],
  );

  const dropdownItemStyle = React.useMemo(
    () => ({
      minHeight: metrics.topDropdownItemMinHeight,
      paddingHorizontal: metrics.topDropdownItemPaddingHorizontal,
      borderRadius: metrics.topDropdownItemRadius,
      marginHorizontal: metrics.topDropdownItemMarginHorizontal,
      marginVertical: metrics.topDropdownItemMarginVertical,
    }),
    [
      metrics.topDropdownItemMarginHorizontal,
      metrics.topDropdownItemMarginVertical,
      metrics.topDropdownItemMinHeight,
      metrics.topDropdownItemPaddingHorizontal,
      metrics.topDropdownItemRadius,
    ],
  );

  const dropdownItemTextStyle = React.useMemo(
    () => ({ fontSize: metrics.topDropdownTextSize }),
    [metrics.topDropdownTextSize],
  );

  const titleWrapNativeAnimatedStyle = React.useMemo(
    () => ({
      transform: [
        {
          scale: expandProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.035],
          }),
        },
        {
          translateY: expandProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 2],
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
            outputRange: [1, 1.12],
          }),
        },
      ],
    }),
    [expandProgress],
  );

  const chevronAnimatedStyle = React.useMemo(
    () => ({
      transform: [
        {
          rotate: expandProgress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
          }),
        },
      ],
    }),
    [expandProgress],
  );

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

  const overlayTintStyle = React.useMemo(() => {
    if (Platform.OS === 'android') {
      return styles.layerTintAndroid;
    }

    return isDark ? styles.layerTintDark : styles.layerTintLight;
  }, [isDark]);

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

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View pointerEvents="box-none" style={wrapperStyle}>
        <View style={styles.row}>
          <Pressable
            onPressIn={onMenuPressIn}
            style={[styles.sideButton, sideButtonStyle, isDark ? styles.glassDark : styles.glassLight]}
          >
            {renderGlassLayer(controlBlurAmount)}

            <Menu
              size={metrics.sideIconSize}
              color={isDark ? '#f4f4f5' : '#0f172a'}
              strokeWidth={2.4}
            />
          </Pressable>

          <View style={styles.centerSpacer} />

          <Pressable
            onPress={onQrScannerPress}
            style={[styles.sideButton, sideButtonStyle, isDark ? styles.glassDark : styles.glassLight]}
          >
            {renderGlassLayer(controlBlurAmount)}

            <QrCode
              size={metrics.sideIconSize}
              color={isDark ? '#f4f4f5' : '#0f172a'}
              strokeWidth={2.4}
            />
          </Pressable>
        </View>
      </View>

      {isDropdownOpen ? (
        <Pressable
          style={[styles.layerPressable, { zIndex: 260 }]}
          onPress={closeDropdown}
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
                overlayTintStyle,
              ]}
            />
          </Animated.View>
        </Pressable>
      ) : null}

      <View pointerEvents="box-none" style={centerWrapperStyle}>
        <Animated.View
          style={titleWrapNativeAnimatedStyle}
        >
          <Animated.View
            style={[
              styles.titleWrap,
              titleWrapStaticStyle,
              titleWrapAnimatedStyle,
              isDark ? styles.glassDark : styles.glassLight,
            ]}
          >
            {renderGlassLayer(centerBlurAmount, 'capsule')}

            <Pressable
              style={[styles.titleTouchArea, titleTouchAreaStyle]}
              onPress={onCenterPress}
              disabled={!canOpenMtkDropdown}
            >
              <View style={[styles.titleRow, titleRowStyle]}>
                <Animated.Text
                  numberOfLines={1}
                  style={[
                    styles.title,
                    titleTextStyle,
                    titleTextAnimatedStyle,
                    isDark ? styles.titleDark : styles.titleLight,
                  ]}
                >
                  {centerTitle}
                </Animated.Text>

                {canOpenMtkDropdown ? (
                  <Animated.View style={chevronAnimatedStyle}>
                    <ChevronDown
                      size={metrics.topChevronSize}
                      color={isDark ? '#e4e4e7' : '#334155'}
                      strokeWidth={2.6}
                    />
                  </Animated.View>
                ) : null}
              </View>
            </Pressable>

            <Animated.View
              pointerEvents={isDropdownOpen ? 'auto' : 'none'}
              style={[
                styles.inlineDropdownList,
                inlineDropdownListStyle,
                dropdownLayoutAnimatedStyle,
              ]}
            >
              <Animated.View style={dropdownContentAnimatedStyle}>
                {resolvedMtkOptions.map((item, index) => {
                  const isSelected = item === selectedMtk;

                  return (
                    <Pressable
                      key={`${item}-${index}`}
                      style={[
                        styles.dropdownItem,
                        dropdownItemStyle,
                        isSelected
                          ? isDark
                            ? styles.dropdownItemSelectedDark
                            : styles.dropdownItemSelectedLight
                          : undefined,
                      ]}
                      onPress={() => onMtkSelect(item)}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          dropdownItemTextStyle,
                          isDark ? styles.dropdownItemTextDark : styles.dropdownItemTextLight,
                        ]}
                      >
                        {item}
                      </Text>

                      {isSelected ? (
                        <Check
                          size={metrics.topCheckSize}
                          color={isDark ? '#d4d4d8' : '#0f172a'}
                          strokeWidth={2.8}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
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
  layerPressable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
  layerOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  titleWrap: {
    borderRadius: 999,
    overflow: 'hidden',
    zIndex: 80,
    justifyContent: 'flex-start',
  },
  titleTouchArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineDropdownList: {
    width: '100%',
    overflow: 'hidden',
  },
  title: {
    textAlign: 'center',
    fontFamily: 'WorkSans-SemiBold',
    letterSpacing: 0.2,
  },
  titleLight: {
    color: '#1e293b',
  },
  titleDark: {
    color: '#f5f5f5',
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
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});
