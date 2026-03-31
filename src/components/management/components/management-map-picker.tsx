import React from 'react';
import {
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { managementStyles as styles } from '../management-styles';
import { APP_LAYOUT_COLORS } from '../../../theme/layout-colors';

type NativeMapsModule = {
  default: React.ComponentType<Record<string, unknown>>;
  Marker: React.ComponentType<Record<string, unknown>>;
  PROVIDER_GOOGLE?: unknown;
};

let nativeMaps: NativeMapsModule | null = null;
try {
  nativeMaps = require('react-native-maps') as NativeMapsModule;
} catch {
  nativeMaps = null;
}

type ManagementMapPickerProps = {
  visible: boolean;
  apiKey: string;
  isDark: boolean;
  latitude?: number;
  longitude?: number;
  onClose: () => void;
  onApply: (latitude: number, longitude: number) => void;
};

const DEFAULT_LATITUDE = 40.4093;
const DEFAULT_LONGITUDE = 49.8671;

const isValidLatitude = (value: number) =>
  Number.isFinite(value) && value >= -90 && value <= 90;
const isValidLongitude = (value: number) =>
  Number.isFinite(value) && value >= -180 && value <= 180;

export function ManagementMapPicker({
  visible,
  apiKey,
  isDark,
  latitude,
  longitude,
  onClose,
  onApply,
}: ManagementMapPickerProps) {
  const rawLatitude = typeof latitude === 'number' ? latitude : Number.NaN;
  const rawLongitude = typeof longitude === 'number' ? longitude : Number.NaN;
  const hasValidInitialCoordinate =
    isValidLatitude(rawLatitude) &&
    isValidLongitude(rawLongitude) &&
    !(Math.abs(rawLatitude) < 0.000001 && Math.abs(rawLongitude) < 0.000001);

  const centerLatitude = hasValidInitialCoordinate ? rawLatitude : DEFAULT_LATITUDE;
  const centerLongitude = hasValidInitialCoordinate
    ? rawLongitude
    : DEFAULT_LONGITUDE;

  const [coordinate, setCoordinate] = React.useState({
    latitude: centerLatitude,
    longitude: centerLongitude,
  });
  const [hasLocationPermission, setHasLocationPermission] = React.useState(
    Platform.OS !== 'android',
  );
  const [userCoordinate, setUserCoordinate] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const mapRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const requestPermission = async () => {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location permission',
            message: 'Map needs location access to show your current position.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );

        setHasLocationPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch {
        setHasLocationPermission(false);
      }
    };

    void requestPermission();
  }, []);

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    const nextCoordinate = {
      latitude: centerLatitude,
      longitude: centerLongitude,
    };

    setCoordinate(nextCoordinate);

    mapRef.current?.animateToRegion(
      {
        ...nextCoordinate,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      },
      250,
    );
  }, [centerLatitude, centerLongitude, visible]);

  if (!visible) {
    return null;
  }

  if (Platform.OS === 'android' && !apiKey) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={localStyles.overlay}>
          <View style={[localStyles.panel, isDark ? localStyles.panelDark : localStyles.panelLight]}>
            <Text style={[localStyles.errorText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              Missing Google Maps API key.
            </Text>
            <Pressable onPress={onClose} style={localStyles.closeButton}>
              <Text style={localStyles.closeButtonText}>Bağla</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  if (!nativeMaps) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={localStyles.overlay}>
          <View style={[localStyles.panel, isDark ? localStyles.panelDark : localStyles.panelLight]}>
            <Text style={[localStyles.errorText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              Native map module is not loaded yet. Rebuild app and relaunch.
            </Text>
            <Pressable onPress={onClose} style={localStyles.closeButton}>
              <Text style={localStyles.closeButtonText}>Bağla</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  const MapViewComponent = nativeMaps.default;
  const MarkerComponent = nativeMaps.Marker;

  const onMapPress = (event: any) => {
    const nextCoordinate = event.nativeEvent.coordinate;

    setCoordinate(nextCoordinate);
  };

  const onUserLocationChange = (event: any) => {
    const nextCoordinate = event?.nativeEvent?.coordinate;
    if (!nextCoordinate) {
      return;
    }

    if (
      !isValidLatitude(nextCoordinate.latitude) ||
      !isValidLongitude(nextCoordinate.longitude)
    ) {
      return;
    }

    setUserCoordinate({
      latitude: nextCoordinate.latitude,
      longitude: nextCoordinate.longitude,
    });
  };

  const focusToUserLocation = () => {
    if (!userCoordinate) {
      return;
    }

    mapRef.current?.animateToRegion(
      {
        ...userCoordinate,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      },
      300,
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[localStyles.screen, isDark ? localStyles.screenDark : localStyles.screenLight]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[localStyles.header, isDark ? localStyles.headerDark : localStyles.headerLight]}>
          <Pressable onPress={onClose} style={localStyles.headerButton}>
            <Text style={localStyles.headerButtonText}>Bağla</Text>
          </Pressable>
          <Text style={[localStyles.headerTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
            Xəritədən seç
          </Text>
          <Pressable
            onPress={() => onApply(coordinate.latitude, coordinate.longitude)}
            style={[localStyles.headerButton, localStyles.applyButton]}
          >
            <Text style={[localStyles.headerButtonText, localStyles.applyButtonText]}>Seç</Text>
          </Pressable>
        </View>

        <View style={localStyles.mapContainer}>
          <MapViewComponent
            ref={mapRef}
            style={localStyles.map}
            provider={Platform.OS === 'android' ? nativeMaps.PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude: centerLatitude,
              longitude: centerLongitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
            showsUserLocation={hasLocationPermission}
            followsUserLocation={false}
            showsMyLocationButton={Platform.OS === 'android' && hasLocationPermission}
            onUserLocationChange={onUserLocationChange}
            onPress={onMapPress}
          >
            <MarkerComponent coordinate={coordinate} />
          </MapViewComponent>

          {Platform.OS === 'ios' ? (
            <Pressable
              onPress={focusToUserLocation}
              disabled={!userCoordinate}
              style={[
                localStyles.locateButton,
                isDark ? localStyles.locateButtonDark : localStyles.locateButtonLight,
                !userCoordinate ? localStyles.locateButtonDisabled : null,
              ]}
            >
              <Text
                style={[
                  localStyles.locateButtonText,
                  isDark ? localStyles.locateButtonTextDark : localStyles.locateButtonTextLight,
                ]}
              >
                Mənim yerim
              </Text>
            </Pressable>
          ) : null}

          <View style={[styles.mapHint, isDark ? styles.mapHintDark : styles.mapHintLight]}>
            <Text style={[styles.mapHintText, isDark ? styles.mapHintTextDark : styles.mapHintTextLight]}>
              Map opened. Tap to choose exact point.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  panel: {
    width: '100%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  panelLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  panelDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  screen: {
    flex: 1,
  },
  screenLight: {
    backgroundColor: APP_LAYOUT_COLORS.backgroundLight,
  },
  screenDark: {
    backgroundColor: APP_LAYOUT_COLORS.backgroundDark,
  },
  header: {
    minHeight: 56,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#dbe4ef',
  },
  headerDark: {
    backgroundColor: '#18181b',
    borderBottomColor: '#303036',
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'WorkSans-Bold',
  },
  headerButton: {
    minHeight: 36,
    minWidth: 60,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  applyButton: {
    backgroundColor: '#2563eb',
  },
  applyButtonText: {
    color: '#ffffff',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  locateButton: {
    position: 'absolute',
    right: 12,
    bottom: 18,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateButtonLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  locateButtonDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  locateButtonDisabled: {
    opacity: 0.55,
  },
  locateButtonText: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  locateButtonTextLight: {
    color: '#0f172a',
  },
  locateButtonTextDark: {
    color: '#f4f4f5',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
  },
  closeButton: {
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'WorkSans-SemiBold',
  },
});
