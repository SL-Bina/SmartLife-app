import React from 'react';
import { ActivityIndicator, Alert, Animated, PanResponder, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Cpu, CreditCard, Mail, Save } from 'lucide-react-native';

import {
  extractItem,
  getEntityId,
  getValueByPath,
  toErrorMessage,
  toRecord,
} from '../../../../components/management/management-utils';
import { useThemeMode } from '../../../../hooks/use-theme';
import { complexesAPI } from '../../../../services/management';
import { complexStyles as styles } from './styles';
import { EntityItem } from './types';
import { asText, getComplexName } from './utils';

type SettingsRouteParams = {
  item: EntityItem;
};

type ComplexSettingsState = {
  pre_paid: boolean;
  integrations: {
    device: {
      device_connection: string;
      device_panel_login: string;
      device_panel_password: string;
      device_complex_id: string;
      device_elevator_min_floor: string;
      device_elevator_max_floor: string;
    };
  };
  mail: {
    driver: string;
    host: string;
    port: string;
    username: string;
    password: string;
    encryption: string;
    from_address: string;
    from_name: string;
  };
  sms_api_details: Record<string, unknown>;
  payment_gateway_details: Record<string, unknown>;
  complex_service_module: Record<string, unknown>;
};

type Option = {
  label: string;
  value: string;
};

type SettingsTabKey = 'payment' | 'device' | 'mail';

type SettingsTab = {
  key: SettingsTabKey;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

const DEVICE_CONNECTION_OPTIONS: Option[] = [
  { value: '', label: '-- Secin --' },
  { value: 'basip_project', label: 'Basip Project' },
  { value: 'hikvision', label: 'Hikvision' },
  { value: 'dahua', label: 'Dahua' },
];

const MAIL_DRIVER_OPTIONS: Option[] = [
  { value: 'smtp', label: 'SMTP' },
  { value: 'sendmail', label: 'Sendmail' },
  { value: 'mailgun', label: 'Mailgun' },
  { value: 'ses', label: 'Amazon SES' },
];

const MAIL_ENCRYPTION_OPTIONS: Option[] = [
  { value: 'tls', label: 'TLS' },
  { value: 'ssl', label: 'SSL' },
  { value: '', label: 'None' },
];

const SETTINGS_TABS: SettingsTab[] = [
  { key: 'payment', label: 'Odenis', icon: CreditCard },
  { key: 'device', label: 'Cihaz', icon: Cpu },
  { key: 'mail', label: 'Mail', icon: Mail },
];

const SETTINGS_TAB_KEYS: SettingsTabKey[] = SETTINGS_TABS.map(tab => tab.key);

const EMPTY_SETTINGS: ComplexSettingsState = {
  pre_paid: false,
  integrations: {
    device: {
      device_connection: '',
      device_panel_login: '',
      device_panel_password: '',
      device_complex_id: '',
      device_elevator_min_floor: '',
      device_elevator_max_floor: '',
    },
  },
  mail: {
    driver: 'smtp',
    host: '',
    port: '587',
    username: '',
    password: '',
    encryption: 'tls',
    from_address: '',
    from_name: '',
  },
  sms_api_details: {},
  payment_gateway_details: {},
  complex_service_module: {},
};

const parseNumberOrEmpty = (value: string): number | '' => {
  const normalized = value.trim();
  if (!normalized) {
    return '';
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return '';
  }

  return parsed;
};

const toBool = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  return String(value).toLowerCase() === 'true';
};

const mapItemToSettings = (item: EntityItem): ComplexSettingsState => {
  const config = toRecord(getValueByPath(item, 'config'));
  const device = toRecord(getValueByPath(config, 'integrations.device'));
  const mail = toRecord(getValueByPath(config, 'mail'));

  return {
    pre_paid: toBool(config.pre_paid),
    integrations: {
      device: {
        device_connection: asText(device.device_connection),
        device_panel_login: asText(device.device_panel_login),
        device_panel_password: asText(device.device_panel_password),
        device_complex_id: asText(device.device_complex_id),
        device_elevator_min_floor: asText(device.device_elevator_min_floor),
        device_elevator_max_floor: asText(device.device_elevator_max_floor),
      },
    },
    mail: {
      driver: asText(mail.driver) || 'smtp',
      host: asText(mail.host),
      port: asText(mail.port) || '587',
      username: asText(mail.username),
      password: asText(mail.password),
      encryption: asText(mail.encryption) || 'tls',
      from_address: asText(mail.from_address),
      from_name: asText(mail.from_name),
    },
    sms_api_details: toRecord(config.sms_api_details),
    payment_gateway_details: toRecord(config.payment_gateway_details),
    complex_service_module: toRecord(config.complex_service_module),
  };
};

const buildConfigPayload = (settings: ComplexSettingsState): Record<string, unknown> => {
  return {
    pre_paid: settings.pre_paid ? 'true' : 'false',
    integrations: {
      device: {
        device_connection: settings.integrations.device.device_connection,
        device_panel_login: settings.integrations.device.device_panel_login,
        device_panel_password: settings.integrations.device.device_panel_password,
        device_complex_id: parseNumberOrEmpty(settings.integrations.device.device_complex_id),
        device_elevator_min_floor: parseNumberOrEmpty(settings.integrations.device.device_elevator_min_floor),
        device_elevator_max_floor: parseNumberOrEmpty(settings.integrations.device.device_elevator_max_floor),
      },
    },
    mail: {
      driver: settings.mail.driver,
      host: settings.mail.host,
      port: parseNumberOrEmpty(settings.mail.port),
      username: settings.mail.username,
      password: settings.mail.password,
      encryption: settings.mail.encryption,
      from_address: settings.mail.from_address,
      from_name: settings.mail.from_name,
    },
    sms_api_details: settings.sms_api_details,
    payment_gateway_details: settings.payment_gateway_details,
    complex_service_module: settings.complex_service_module,
  };
};

export default function ManagementComplexSettingsRouteScreen() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const initialItem = (route.params as SettingsRouteParams | undefined)?.item ?? null;

  const [item, setItem] = React.useState<EntityItem | null>(initialItem);
  const [loading, setLoading] = React.useState(Boolean(initialItem));
  const [submitting, setSubmitting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<SettingsTabKey>('payment');
  const [settings, setSettings] = React.useState<ComplexSettingsState>(
    initialItem ? mapItemToSettings(initialItem) : EMPTY_SETTINGS,
  );
  const sectionAnim = React.useRef(new Animated.Value(1)).current;

  const placeholderColor = isDark ? '#71717a' : '#94a3b8';
  const selectedDeviceLabel =
    DEVICE_CONNECTION_OPTIONS.find(option => option.value === settings.integrations.device.device_connection)?.label ||
    'Secilmeyib';
  const sectionTranslateY = sectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  useFocusEffect(
    React.useCallback(() => {
      const id = initialItem ? getEntityId(initialItem) : null;

      if (initialItem === null || id === null) {
        setLoading(false);
        return undefined;
      }

      let isMounted = true;

      void (async () => {
        try {
          setLoading(true);
          const response = await complexesAPI.getById(id);
          const detail = extractItem(response);
          if (isMounted) {
            const merged = { ...initialItem, ...detail };
            setItem(merged);
            setSettings(mapItemToSettings(merged));
          }
        } catch (loadError) {
          if (isMounted) {
            Alert.alert('Xeta', toErrorMessage(loadError, 'Kompleks parametrlari yuklenmedi'));
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      })();

      return () => {
        isMounted = false;
      };
    }, [initialItem]),
  );

  const onSave = React.useCallback(async () => {
    const id = item ? getEntityId(item) : null;
    if (id === null) {
      Alert.alert('Xeta', 'Kompleks ID tapilmadi');
      return;
    }

    try {
      setSubmitting(true);
      await complexesAPI.updateConfig(id, buildConfigPayload(settings));
      navigation.goBack();
    } catch (saveError) {
      Alert.alert('Xeta', toErrorMessage(saveError, 'Kompleks parametrlari yadda saxlanmadi'));
    } finally {
      setSubmitting(false);
    }
  }, [item, navigation, settings]);

  const setDeviceField = React.useCallback(
    (key: keyof ComplexSettingsState['integrations']['device'], value: string) => {
      setSettings(prev => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          device: {
            ...prev.integrations.device,
            [key]: value,
          },
        },
      }));
    },
    [],
  );

  const setMailField = React.useCallback(
    (key: keyof ComplexSettingsState['mail'], value: string) => {
      setSettings(prev => ({
        ...prev,
        mail: {
          ...prev.mail,
          [key]: value,
        },
      }));
    },
    [],
  );

  const onTabPress = React.useCallback(
    (nextTab: SettingsTabKey) => {
      if (nextTab === activeTab) {
        return;
      }

      Animated.timing(sectionAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        setActiveTab(nextTab);
        sectionAnim.setValue(0);
        Animated.timing(sectionAnim, {
          toValue: 1,
          duration: 230,
          useNativeDriver: true,
        }).start();
      });
    },
    [activeTab, sectionAnim],
  );

  const onTabSwipe = React.useCallback(
    (direction: 'next' | 'prev') => {
      const currentIndex = SETTINGS_TAB_KEYS.indexOf(activeTab);
      if (currentIndex === -1) {
        return;
      }

      const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= SETTINGS_TAB_KEYS.length) {
        return;
      }

      onTabPress(SETTINGS_TAB_KEYS[nextIndex]);
    },
    [activeTab, onTabPress],
  );

  const tabSwipeResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx <= -42) {
            onTabSwipe('next');
            return;
          }

          if (gestureState.dx >= 42) {
            onTabSwipe('prev');
          }
        },
      }),
    [onTabSwipe],
  );

  const renderOptions = React.useCallback(
    (options: Option[], selectedValue: string, onSelect: (value: string) => void) => (
      <View style={styles.settingsOptionRow}>
        {options.map(option => {
          const selected = selectedValue === option.value;

          return (
            <Pressable
              key={option.value || '__empty'}
              onPress={() => onSelect(option.value)}
              style={[
                styles.settingsOptionButton,
                isDark && styles.settingsOptionButtonDark,
                selected && styles.settingsOptionButtonActive,
                selected && isDark && styles.settingsOptionButtonActiveDark,
                selected && (isDark ? styles.settingsOptionButtonPremiumDark : styles.settingsOptionButtonPremiumLight),
              ]}
            >
              <Text
                style={[
                  styles.settingsOptionText,
                  isDark && styles.settingsOptionTextDark,
                  selected && styles.settingsOptionTextActive,
                  selected && isDark && styles.settingsOptionTextActiveDark,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    ),
    [isDark],
  );

  return (
    <View
      style={[
        styles.detailRouteRoot,
        isDark ? styles.detailRouteRootDark : styles.detailRouteRootLight,
        {
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {loading ? (
        <View style={styles.centerStateWrap}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <View style={[styles.formScreenContainer, isDark ? styles.formScreenContainerDark : styles.formScreenContainerLight]}>
          <View style={styles.formScreenHeader}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={10}
              style={[styles.detailBackButton, isDark ? styles.detailBackButtonDark : styles.detailBackButtonLight]}
            >
              <ArrowLeft size={16} color={isDark ? '#f5f5f5' : '#0f172a'} strokeWidth={2.4} />
              <Text style={[styles.detailBackButtonText, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>Geri</Text>
            </Pressable>
          </View>

          <View style={styles.formScreenBody}>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={[styles.modalScrollContent, styles.detailScreenScrollContent]}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.detailHeaderCard, isDark ? styles.detailHeaderCardDark : styles.detailHeaderCardLight]}>
                <View style={styles.detailHeaderRow}>
                  <View style={[styles.detailHeaderIconWrap, isDark ? styles.detailHeaderIconWrapDark : styles.detailHeaderIconWrapLight]}>
                    <CreditCard size={17} color={isDark ? '#7dd3fc' : '#0369a1'} strokeWidth={2.2} />
                  </View>

                  <View style={styles.detailHeaderTextWrap}>
                    <Text style={[styles.detailHeaderTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                      Kompleks Parametrlari
                    </Text>
                    <Text style={[styles.detailHeaderSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                      {item ? getComplexName(item) : '-'}
                    </Text>
                  </View>
                </View>

                <View style={styles.settingsMetaRow}>
                  <View
                    style={[
                      styles.settingsMetaChip,
                      isDark ? styles.settingsMetaChipDark : styles.settingsMetaChipLight,
                      settings.pre_paid && styles.settingsMetaChipActive,
                    ]}
                  >
                    <Text style={[styles.settingsMetaLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Pre-paid</Text>
                    <Text
                      style={[
                        styles.settingsMetaValue,
                        isDark ? styles.textPrimaryDark : styles.textPrimaryLight,
                        settings.pre_paid && styles.statusTextActive,
                      ]}
                    >
                      {settings.pre_paid ? 'Aktiv' : 'Passiv'}
                    </Text>
                  </View>

                  <View style={[styles.settingsMetaChip, isDark ? styles.settingsMetaChipDark : styles.settingsMetaChipLight]}>
                    <Text style={[styles.settingsMetaLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Device</Text>
                    <Text style={[styles.settingsMetaValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                      {selectedDeviceLabel}
                    </Text>
                  </View>

                  <View style={[styles.settingsMetaChip, isDark ? styles.settingsMetaChipDark : styles.settingsMetaChipLight]}>
                    <Text style={[styles.settingsMetaLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Mail driver</Text>
                    <Text style={[styles.settingsMetaValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                      {settings.mail.driver.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.settingsTabRow, isDark ? styles.settingsTabRowDark : styles.settingsTabRowLight]}>
                {SETTINGS_TABS.map(tab => {
                  const selected = activeTab === tab.key;
                  const Icon = tab.icon;

                  return (
                    <Pressable
                      key={tab.key}
                      onPress={() => onTabPress(tab.key)}
                      style={[
                        styles.settingsTabButton,
                        isDark && styles.settingsTabButtonDark,
                        selected && styles.settingsTabButtonActive,
                        selected && isDark && styles.settingsTabButtonActiveDark,
                      ]}
                    >
                      <Icon
                        size={14}
                        color={selected ? (isDark ? '#dbeafe' : '#1d4ed8') : (isDark ? '#a1a1aa' : '#64748b')}
                        strokeWidth={2.3}
                      />
                      <Text
                        style={[
                          styles.settingsTabText,
                          isDark && styles.settingsTabTextDark,
                          selected && styles.settingsTabTextActive,
                          selected && isDark && styles.settingsTabTextActiveDark,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Animated.View
                {...tabSwipeResponder.panHandlers}
                style={[
                  styles.settingsAnimatedSection,
                  {
                    opacity: sectionAnim,
                    transform: [{ translateY: sectionTranslateY }],
                  },
                ]}
              >
                {activeTab === 'payment' ? (
                  <View style={[styles.settingsSectionCard, isDark ? styles.settingsSectionCardDark : styles.settingsSectionCardLight]}>
                    <View style={styles.detailHeaderRow}>
                      <View style={[styles.detailHeaderIconWrap, isDark ? styles.detailHeaderIconWrapDark : styles.detailHeaderIconWrapLight]}>
                        <CreditCard size={16} color={isDark ? '#7dd3fc' : '#0369a1'} strokeWidth={2.2} />
                      </View>
                      <Text style={[styles.viewSectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                        Odenis Konfiqurasiyasi
                      </Text>
                    </View>

                    <View style={[styles.viewInfoRow, styles.viewInfoRowModern]}>
                      <View style={styles.viewInfoContent}>
                        <Text style={[styles.viewInfoValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>Pre-Paid Sistemi</Text>
                        <Text style={[styles.viewInfoLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                          Sakinler balans yukleyerek xidmetlerden istifade edecek.
                        </Text>
                        <Text style={[styles.viewInfoLabel, settings.pre_paid ? styles.statusTextActive : (isDark ? styles.textMutedDark : styles.textMutedLight)]}>
                          ● {settings.pre_paid ? 'Aktivdir' : 'Aktiv deyil'}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => setSettings(prev => ({ ...prev, pre_paid: !prev.pre_paid }))}
                        style={[styles.settingsToggleTrack, settings.pre_paid && styles.settingsToggleTrackActive]}
                      >
                        <View
                          style={[
                            styles.settingsToggleThumb,
                            settings.pre_paid ? { transform: [{ translateX: 22 }] } : null,
                          ]}
                        />
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                {activeTab === 'device' ? (
                  <View style={[styles.settingsSectionCard, isDark ? styles.settingsSectionCardDark : styles.settingsSectionCardLight]}>
                    <View style={styles.detailHeaderRow}>
                      <View style={[styles.detailHeaderIconWrap, isDark ? styles.detailHeaderIconWrapDark : styles.detailHeaderIconWrapLight]}>
                        <Cpu size={16} color={isDark ? '#c4b5fd' : '#7e22ce'} strokeWidth={2.2} />
                      </View>
                      <Text style={[styles.viewSectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                        Cihaz Inteqrasiyasi
                      </Text>
                    </View>

                    <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Baglanti novu</Text>
                    {renderOptions(DEVICE_CONNECTION_OPTIONS, settings.integrations.device.device_connection, value => {
                      setDeviceField('device_connection', value);
                    })}

                    <View style={styles.rowInputs}>
                      <View style={[styles.formFieldBlock, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                        <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Panel login</Text>
                        <TextInput
                          value={settings.integrations.device.device_panel_login}
                          onChangeText={value => setDeviceField('device_panel_login', value)}
                          placeholder="info@example.com"
                          placeholderTextColor={placeholderColor}
                          style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                        />
                      </View>

                      <View style={[styles.formFieldBlock, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                        <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Panel sifre</Text>
                        <TextInput
                          value={settings.integrations.device.device_panel_password}
                          onChangeText={value => setDeviceField('device_panel_password', value)}
                          placeholder="******"
                          placeholderTextColor={placeholderColor}
                          secureTextEntry
                          style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                        />
                      </View>
                    </View>

                    <View style={styles.rowInputs}>
                      <View style={[styles.formFieldBlock, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                        <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Device Complex ID</Text>
                        <TextInput
                          value={settings.integrations.device.device_complex_id}
                          onChangeText={value => setDeviceField('device_complex_id', value)}
                          placeholder="1234"
                          placeholderTextColor={placeholderColor}
                          keyboardType="number-pad"
                          style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                        />
                      </View>

                      <View style={[styles.formFieldBlock, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                        <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Lift min mertebe</Text>
                        <TextInput
                          value={settings.integrations.device.device_elevator_min_floor}
                          onChangeText={value => setDeviceField('device_elevator_min_floor', value)}
                          placeholder="-2"
                          placeholderTextColor={placeholderColor}
                          keyboardType="number-pad"
                          style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                        />
                      </View>
                    </View>

                    <View style={[styles.formFieldBlock, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                      <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Lift max mertebe</Text>
                      <TextInput
                        value={settings.integrations.device.device_elevator_max_floor}
                        onChangeText={value => setDeviceField('device_elevator_max_floor', value)}
                        placeholder="16"
                        placeholderTextColor={placeholderColor}
                        keyboardType="number-pad"
                        style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                      />
                    </View>
                  </View>
                ) : null}

                {activeTab === 'mail' ? (
                  <View style={[styles.settingsSectionCard, isDark ? styles.settingsSectionCardDark : styles.settingsSectionCardLight]}>
                    <View style={styles.detailHeaderRow}>
                      <View style={[styles.detailHeaderIconWrap, isDark ? styles.detailHeaderIconWrapDark : styles.detailHeaderIconWrapLight]}>
                        <Mail size={16} color={isDark ? '#86efac' : '#166534'} strokeWidth={2.2} />
                      </View>
                      <Text style={[styles.viewSectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                        Mail Konfiqurasiyasi
                      </Text>
                    </View>

                    <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Driver</Text>
                    {renderOptions(MAIL_DRIVER_OPTIONS, settings.mail.driver, value => {
                      setMailField('driver', value);
                    })}

                    <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Sifreleme</Text>
                    {renderOptions(MAIL_ENCRYPTION_OPTIONS, settings.mail.encryption, value => {
                      setMailField('encryption', value);
                    })}

                    <View style={styles.rowInputs}>
                      <View style={[styles.formFieldBlock, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                        <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Host</Text>
                        <TextInput
                          value={settings.mail.host}
                          onChangeText={value => setMailField('host', value)}
                          placeholder="smtp.gmail.com"
                          placeholderTextColor={placeholderColor}
                          style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                        />
                      </View>

                      <View style={[styles.formFieldBlock, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                        <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Port</Text>
                        <TextInput
                          value={settings.mail.port}
                          onChangeText={value => setMailField('port', value)}
                          placeholder="587"
                          placeholderTextColor={placeholderColor}
                          keyboardType="number-pad"
                          style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                        />
                      </View>
                    </View>

                    <View style={styles.rowInputs}>
                      <View style={[styles.formFieldBlock, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                        <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Username</Text>
                        <TextInput
                          value={settings.mail.username}
                          onChangeText={value => setMailField('username', value)}
                          placeholder="you@gmail.com"
                          placeholderTextColor={placeholderColor}
                          style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                        />
                      </View>

                      <View style={[styles.formFieldBlock, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                        <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Sifre</Text>
                        <TextInput
                          value={settings.mail.password}
                          onChangeText={value => setMailField('password', value)}
                          placeholder="******"
                          placeholderTextColor={placeholderColor}
                          secureTextEntry
                          style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                        />
                      </View>
                    </View>

                    <View style={styles.rowInputs}>
                      <View style={[styles.formFieldBlock, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                        <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>From address</Text>
                        <TextInput
                          value={settings.mail.from_address}
                          onChangeText={value => setMailField('from_address', value)}
                          placeholder="noreply@example.com"
                          placeholderTextColor={placeholderColor}
                          style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                        />
                      </View>

                      <View style={[styles.formFieldBlock, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                        <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>From name</Text>
                        <TextInput
                          value={settings.mail.from_name}
                          onChangeText={value => setMailField('from_name', value)}
                          placeholder="SmartLife"
                          placeholderTextColor={placeholderColor}
                          style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                        />
                      </View>
                    </View>
                  </View>
                ) : null}
              </Animated.View>

              <View style={[styles.detailActionPanel, isDark ? styles.detailActionPanelDark : styles.detailActionPanelLight]}>
                <Text style={[styles.detailActionPanelTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  Emeliyyatlar
                </Text>

                <View style={[styles.screenActionsRow, styles.screenActionsRowCompact]}>
                  <Pressable
                    onPress={() => navigation.goBack()}
                    style={[
                      styles.screenActionButton,
                      isDark ? styles.screenActionButtonDarkGhost : styles.screenActionButtonLightGhost,
                    ]}
                  >
                    <ArrowLeft size={15} color={isDark ? '#e4e4e7' : '#334155'} strokeWidth={2.5} />
                    <Text style={[styles.screenActionGhostText, isDark && styles.screenActionGhostTextDark]}>Legv et</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      void onSave();
                    }}
                    disabled={submitting}
                    style={[
                      styles.screenActionButton,
                      styles.screenActionPrimaryButton,
                      submitting && (isDark ? styles.screenActionGlassLoadingDark : styles.screenActionGlassLoadingLight),
                    ]}
                  >
                    {submitting ? (
                      <>
                        <ActivityIndicator size="small" color={isDark ? '#dbeafe' : '#0f172a'} />
                        <Text style={[styles.screenActionGlassText, isDark && styles.screenActionGlassTextDark]}>Yaddasaxlanir...</Text>
                      </>
                    ) : (
                      <>
                        <Save size={15} color="#ffffff" strokeWidth={2.4} />
                        <Text style={styles.screenActionPrimaryText}>Yadda saxla</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}
