import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { ArrowLeft, Flashlight, FlashlightOff } from 'lucide-react-native';

import { useThemeMode } from '../../../hooks/use-theme';
import { showToast } from '../../../utils/action';

const SCAN_FRAME_SIZE = 262;
const SCAN_STABILIZE_MS = 1200;

export default function QrScannerScreen() {
  const navigation =
    useNavigation<DrawerNavigationProp<Record<string, object | undefined>>>();
  const isFocused = useIsFocused();
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const [isRequestingPermission, setIsRequestingPermission] = React.useState(false);
  const [torchEnabled, setTorchEnabled] = React.useState(false);
  const [pendingScanValue, setPendingScanValue] = React.useState<string | null>(null);
  const [pendingRemainingMs, setPendingRemainingMs] = React.useState(0);

  const pendingScanTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingScanTickRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingScanValueRef = React.useRef<string | null>(null);

  const scannerActive = isFocused && hasPermission && !!device;

  const clearPendingScan = React.useCallback(() => {
    if (pendingScanTimerRef.current) {
      clearTimeout(pendingScanTimerRef.current);
      pendingScanTimerRef.current = null;
    }

    if (pendingScanTickRef.current) {
      clearInterval(pendingScanTickRef.current);
      pendingScanTickRef.current = null;
    }

    pendingScanValueRef.current = null;
    setPendingScanValue(null);
    setPendingRemainingMs(0);
  }, []);

  React.useEffect(() => {
    if (hasPermission) {
      return;
    }

    setIsRequestingPermission(true);
    requestPermission()
      .catch(() => {
        showToast('Kamera icazəsi alınmadı');
      })
      .finally(() => {
        setIsRequestingPermission(false);
      });
  }, [hasPermission, requestPermission]);

  React.useEffect(() => {
    if (!scannerActive) {
      clearPendingScan();
      return;
    }
  }, [clearPendingScan, scannerActive]);

  React.useEffect(
    () => () => {
      clearPendingScan();
    },
    [clearPendingScan],
  );

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes, frame) => {
      if (!scannerActive) {
        return;
      }

      if (codes.length === 0) {
        clearPendingScan();
        return;
      }

      const codeAny = codes.find(code => Boolean(code.frame || (code.corners && code.corners.length > 0)));
      if (!codeAny) {
        clearPendingScan();
        return;
      }

      void frame;

      const value = codeAny.value?.trim() || 'tracked-qr';
      if (!value) {
        clearPendingScan();
        return;
      }

      if (pendingScanValueRef.current === value) {
        return;
      }

      clearPendingScan();

      pendingScanValueRef.current = value;
      setPendingScanValue(value);
      setPendingRemainingMs(SCAN_STABILIZE_MS);

      const startedAt = Date.now();
      pendingScanTickRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, SCAN_STABILIZE_MS - elapsed);
        setPendingRemainingMs(remaining);

        if (remaining <= 0 && pendingScanTickRef.current) {
          clearInterval(pendingScanTickRef.current);
          pendingScanTickRef.current = null;
        }
      }, 80);

      pendingScanTimerRef.current = setTimeout(() => {
        if (pendingScanValueRef.current !== value || !scannerActive) {
          clearPendingScan();
          return;
        }

        // Decode is intentionally disabled for now.
        // When re-enabling, put result handling here (setScanResult / navigation).
        clearPendingScan();
      }, SCAN_STABILIZE_MS);
    },
  });

  const onBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('home' as never);
  }, [navigation]);

  const onRequestPermissionPress = React.useCallback(async () => {
    setIsRequestingPermission(true);
    try {
      await requestPermission();
    } catch {
      showToast('Kamera icazəsi alınmadı');
    } finally {
      setIsRequestingPermission(false);
    }
  }, [requestPermission]);

  const pendingRemainingText = React.useMemo(
    () => (pendingRemainingMs / 1000).toFixed(1),
    [pendingRemainingMs],
  );

  const renderPermissionState = () => {
    if (hasPermission) {
      return null;
    }

    return (
      <View style={[styles.stateCard, isDark ? styles.stateCardDark : styles.stateCardLight]}>
        <Text style={[styles.stateTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
          Kameraya giriş lazımdır
        </Text>
        <Text style={[styles.stateSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          QR kodu oxumaq üçün kamera icazəsini ver.
        </Text>
        <Pressable
          onPress={() => void onRequestPermissionPress()}
          style={[styles.stateAction, isDark ? styles.stateActionDark : styles.stateActionLight]}
        >
          {isRequestingPermission ? (
            <ActivityIndicator size="small" color={isDark ? '#0f172a' : '#ffffff'} />
          ) : (
            <Text style={[styles.stateActionText, isDark ? styles.stateActionTextDark : styles.stateActionTextLight]}>
              İcazə ver
            </Text>
          )}
        </Pressable>
      </View>
    );
  };

  const renderCameraMissing = () => {
    if (device || !hasPermission) {
      return null;
    }

    return (
      <View style={[styles.stateCard, isDark ? styles.stateCardDark : styles.stateCardLight]}>
        <Text style={[styles.stateTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
          Kamera tapılmadı
        </Text>
        <Text style={[styles.stateSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          Cihaz kamerası hazır deyil. Yenidən cəhd et.
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      {device && hasPermission ? (
        <Camera
          style={StyleSheet.absoluteFillObject}
          device={device}
          isActive={scannerActive}
          codeScanner={codeScanner}
          torch={torchEnabled ? 'on' : 'off'}
        />
      ) : null}

      <View style={styles.scrim} />

      <View pointerEvents="none" style={styles.trackingOverlay}>
        <View
          style={[
            styles.scanFrameWrap,
            pendingScanValue ? styles.scanFrameWrapTracking : null,
          ]}
        >
          <View style={styles.scanFrame}>
            <View
              style={[
                styles.corner,
                styles.cornerTopLeft,
                pendingScanValue ? styles.cornerTracking : null,
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.cornerTopRight,
                pendingScanValue ? styles.cornerTracking : null,
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.cornerBottomLeft,
                pendingScanValue ? styles.cornerTracking : null,
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.cornerBottomRight,
                pendingScanValue ? styles.cornerTracking : null,
              ]}
            />
          </View>
        </View>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable onPress={onBack} style={[styles.iconButton, styles.iconButtonGhost]}>
            <ArrowLeft size={20} color="#ffffff" strokeWidth={2.5} />
          </Pressable>

          <View style={styles.titleWrap}>
            <Text style={styles.title}>QR Scanner</Text>
            <Text style={styles.subtitle}>Web qoşulma kodunu oxut</Text>
          </View>

          <Pressable
            onPress={() => setTorchEnabled(prev => !prev)}
            style={[styles.iconButton, torchEnabled ? styles.iconButtonActive : styles.iconButtonGhost]}
          >
            {torchEnabled ? (
              <FlashlightOff size={19} color="#ffffff" strokeWidth={2.5} />
            ) : (
              <Flashlight size={19} color="#ffffff" strokeWidth={2.5} />
            )}
          </Pressable>
        </View>

        <View style={styles.centerContent}>
          {pendingScanValue ? (
            <View style={styles.trackingPill}>
              <Text style={styles.trackingPillText}>QR izlənir... {pendingRemainingText}s</Text>
            </View>
          ) : (
            <Text style={styles.hintText}>QR göründükdə çərçivə onu izləyəcək.</Text>
          )}

          {renderPermissionState()}
          {renderCameraMissing()}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: '#0f172a',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.36)',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 22,
  },
  trackingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 8 : 0,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconButtonGhost: {
    backgroundColor: 'rgba(15, 23, 42, 0.44)',
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.7)',
    borderColor: 'rgba(147, 197, 253, 0.9)',
  },
  titleWrap: {
    flex: 1,
    paddingHorizontal: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'WorkSans-Bold',
  },
  subtitle: {
    marginTop: 3,
    color: 'rgba(226, 232, 240, 0.9)',
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 8,
  },
  scanFrameWrap: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    borderRadius: 28,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    overflow: 'hidden',
  },
  scanFrameWrapTracking: {
    borderColor: 'rgba(34,197,94,0.9)',
    backgroundColor: 'rgba(22,163,74,0.12)',
  },
  scanFrame: {
    flex: 1,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#38bdf8',
    zIndex: 3,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 18,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  cornerTracking: {
    borderColor: '#22c55e',
  },
  hintText: {
    color: '#f1f5f9',
    fontSize: 13,
    fontFamily: 'WorkSans-SemiBold',
  },
  trackingPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.65)',
    backgroundColor: 'rgba(20,83,45,0.62)',
  },
  trackingPillText: {
    color: '#dcfce7',
    fontSize: 13,
    fontFamily: 'WorkSans-SemiBold',
  },
  stateCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  stateCardLight: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: '#dbe4ef',
  },
  stateCardDark: {
    backgroundColor: 'rgba(17,24,39,0.94)',
    borderColor: '#334155',
  },
  stateTitle: {
    fontSize: 15,
    fontFamily: 'WorkSans-Bold',
  },
  stateSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'WorkSans-Medium',
  },
  stateAction: {
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateActionLight: {
    backgroundColor: '#2563eb',
  },
  stateActionDark: {
    backgroundColor: '#93c5fd',
  },
  stateActionText: {
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  stateActionTextLight: {
    color: '#ffffff',
  },
  stateActionTextDark: {
    color: '#0f172a',
  },
  textPrimaryLight: {
    color: '#0f172a',
  },
  textPrimaryDark: {
    color: '#f4f4f5',
  },
  textMutedLight: {
    color: '#475569',
  },
  textMutedDark: {
    color: '#cbd5e1',
  },
});
