import React from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeft, BadgeCheck, PencilRuler, Save } from 'lucide-react-native';

import { complexStyles as styles } from '../styles';
import { EntityItem, ComplexFormState } from '../types';

type ComplexFormScreenProps = {
  isDark: boolean;
  editingItem: EntityItem | null;
  formState: ComplexFormState;
  submitting: boolean;
  onChange: (patch: Partial<ComplexFormState>) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function ComplexFormScreen({
  isDark,
  editingItem,
  formState,
  submitting,
  onChange,
  onClose,
  onSubmit,
}: ComplexFormScreenProps) {
  const placeholderColor = isDark ? '#71717a' : '#94a3b8';
  const isActive = formState.status === 'active';
  const statusText = isActive ? 'Aktiv' : 'Passiv';
  const entryAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const entry = Animated.timing(entryAnim, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    });

    entry.start();

    return () => {
      entry.stop();
    };
  }, [entryAnim]);

  const entryTranslateY = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });
  const entryScale = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.formScreenKeyboardWrap}
    >
      <Animated.View
        style={[
          styles.formScreenContainer,
          isDark ? styles.formScreenContainerDark : styles.formScreenContainerLight,
          styles.detailEntryContainer,
          {
            opacity: entryAnim,
            transform: [{ translateY: entryTranslateY }, { scale: entryScale }],
          },
        ]}
      >
        <View style={styles.formScreenHeader}>
          <Pressable
            onPress={onClose}
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
                <PencilRuler size={17} color={isDark ? '#7dd3fc' : '#0369a1'} strokeWidth={2.2} />
              </View>

              <View style={styles.detailHeaderTextWrap}>
                <Text style={[styles.detailHeaderTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                  {editingItem ? 'Kompleks Yenile' : 'Yeni Kompleks Elave Et'}
                </Text>
                <Text style={[styles.detailHeaderSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  Form sahələrini doldurub yadda saxlayın.
                </Text>
              </View>
            </View>

            <View style={styles.detailHeaderMetaRow}>
              <View style={[
                styles.detailHeaderBadge,
                isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
              ]}
              >
                <BadgeCheck
                  size={13}
                  color={isActive ? '#15803d' : '#b91c1c'}
                  strokeWidth={2.2}
                />
                <Text style={[
                  styles.detailHeaderBadgeText,
                  isActive ? styles.statusTextActive : styles.statusTextInactive,
                ]}
                >
                  {statusText}
                </Text>
              </View>
            </View>
          </View>
            <Text style={[styles.formSectionTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>Esas melumat</Text>

            <View style={[styles.formFieldBlock, styles.formFieldBlockModern, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Kompleks adi</Text>
              <TextInput
                value={formState.name}
                onChangeText={value => onChange({ name: value })}
                placeholder="Daxil edin"
                placeholderTextColor={placeholderColor}
                style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
              />
            </View>

            <View style={[styles.formFieldBlock, styles.formFieldBlockModern, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Tesvir</Text>
              <TextInput
                value={formState.description}
                onChangeText={value => onChange({ description: value })}
                placeholder="Qisa tesvir"
                placeholderTextColor={placeholderColor}
                multiline
                style={[
                  styles.formInput,
                  styles.formInputMultiline,
                  isDark ? styles.formInputDark : styles.formInputLight,
                ]}
              />
            </View>

            <View style={[styles.formFieldBlock, styles.formFieldBlockModern, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Unvan</Text>
              <TextInput
                value={formState.address}
                onChangeText={value => onChange({ address: value })}
                placeholder="Unvani daxil edin"
                placeholderTextColor={placeholderColor}
                multiline
                style={[
                  styles.formInput,
                  styles.formInputMultiline,
                  isDark ? styles.formInputDark : styles.formInputLight,
                ]}
              />
            </View>

            <View style={styles.formStatusGroup}>
              <Text style={[styles.formSectionTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>Status</Text>
              <View style={styles.formStatusRow}>
                <Pressable
                  onPress={() => onChange({ status: 'active' })}
                  style={[
                    styles.formStatusOption,
                    formState.status === 'active'
                      ? styles.formStatusOptionActive
                      : isDark
                        ? styles.formStatusOptionIdleDark
                        : styles.formStatusOptionIdleLight,
                  ]}
                >
                  <Text
                    style={[
                      styles.formStatusOptionText,
                      formState.status === 'active'
                        ? styles.formStatusOptionTextActive
                        : isDark
                          ? styles.textMutedDark
                          : styles.textMutedLight,
                    ]}
                  >
                    Aktiv
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => onChange({ status: 'inactive' })}
                  style={[
                    styles.formStatusOption,
                    formState.status === 'inactive'
                      ? styles.formStatusOptionInactive
                      : isDark
                        ? styles.formStatusOptionIdleDark
                        : styles.formStatusOptionIdleLight,
                  ]}
                >
                  <Text
                    style={[
                      styles.formStatusOptionText,
                      formState.status === 'inactive'
                        ? styles.formStatusOptionTextInactive
                        : isDark
                          ? styles.textMutedDark
                          : styles.textMutedLight,
                    ]}
                  >
                    Passiv
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text style={[styles.formSectionTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>Elaqe melumatlari</Text>

            <View style={[styles.formFieldBlock, styles.formFieldBlockModern, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Telefon</Text>
              <TextInput
                value={formState.phone}
                onChangeText={value => onChange({ phone: value })}
                placeholder="+994"
                placeholderTextColor={placeholderColor}
                keyboardType="phone-pad"
                style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
              />
            </View>

            <View style={[styles.formFieldBlock, styles.formFieldBlockModern, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Email</Text>
              <TextInput
                value={formState.email}
                onChangeText={value => onChange({ email: value })}
                placeholder="example@domain.com"
                placeholderTextColor={placeholderColor}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
              />
            </View>

            <View style={[styles.formFieldBlock, styles.formFieldBlockModern, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Website</Text>
              <TextInput
                value={formState.website}
                onChangeText={value => onChange({ website: value })}
                placeholder="https://"
                placeholderTextColor={placeholderColor}
                autoCapitalize="none"
                style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
              />
            </View>

            <View style={[styles.formFieldBlock, styles.formFieldBlockModern, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Reng kodu</Text>
              <TextInput
                value={formState.colorCode}
                onChangeText={value => onChange({ colorCode: value })}
                placeholder="#0ea5e9"
                placeholderTextColor={placeholderColor}
                autoCapitalize="none"
                style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
              />
            </View>

            <Text style={[styles.formSectionTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>Koordinatlar</Text>

            <View style={styles.formRow}>
              <View style={[styles.formFieldBlock, styles.formFieldBlockModern, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Lat</Text>
                <TextInput
                  value={formState.lat}
                  onChangeText={value => onChange({ lat: value })}
                  placeholder="40.4093"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                />
              </View>

              <View style={[styles.formFieldBlock, styles.formFieldBlockModern, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Lng</Text>
                <TextInput
                  value={formState.lng}
                  onChangeText={value => onChange({ lng: value })}
                  placeholder="49.8671"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                />
              </View>
            </View>

            <View style={[styles.screenActionsRow, styles.screenActionsRowTwoCol]}>
              <Pressable
                onPress={onClose}
                style={[
                  styles.screenActionButton,
                  isDark ? styles.screenActionButtonDarkGhost : styles.screenActionButtonLightGhost,
                ]}
              >
                <ArrowLeft size={15} color={isDark ? '#e4e4e7' : '#334155'} strokeWidth={2.5} />
                <Text style={[styles.screenActionGhostText, isDark && styles.screenActionGhostTextDark]}>Geri</Text>
              </Pressable>

              <Pressable
                onPress={onSubmit}
                disabled={submitting}
                style={[
                  styles.screenActionButton,
                  styles.screenActionPrimaryButton,
                  submitting && styles.footerButtonDisabled,
                ]}
              >
                <Save size={15} color="#ffffff" strokeWidth={2.4} />
                <Text style={styles.screenActionPrimaryText}>{submitting ? 'Gozle...' : 'Yadda saxla'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
