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
import { ArrowLeft, BadgeCheck, CalendarDays, Hash, Mail, Phone, Save, User } from 'lucide-react-native';

import { residentStyles as styles } from '../styles';
import { EntityItem, ResidentFormState } from '../types';

type ResidentFormScreenProps = {
  isDark: boolean;
  editingItem: EntityItem | null;
  formState: ResidentFormState;
  submitting: boolean;
  onChange: (patch: Partial<ResidentFormState>) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function ResidentFormScreen({
  isDark,
  editingItem,
  formState,
  submitting,
  onChange,
  onClose,
  onSubmit,
}: ResidentFormScreenProps) {
  const placeholderColor = isDark ? '#71717a' : '#94a3b8';
  const isActive = formState.status === 'active';
  const statusText = isActive ? 'Aktiv' : 'Passiv';
  const entryAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const entry = Animated.timing(entryAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    });

    entry.start();
    return () => entry.stop();
  }, [entryAnim]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formScreenKeyboardWrap}>
      <Animated.View
        style={[
          styles.formScreenContainer,
          isDark ? styles.formScreenContainerDark : styles.formScreenContainerLight,
          styles.detailEntryContainer,
          {
            opacity: entryAnim,
            transform: [
              { translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              { scale: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) },
            ],
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
          <ScrollView style={styles.modalScroll} contentContainerStyle={[styles.modalScrollContent, styles.detailScreenScrollContent]} showsVerticalScrollIndicator={false}>
            <View style={[styles.detailHeaderCard, isDark ? styles.detailHeaderCardDark : styles.detailHeaderCardLight]}>
              <View style={styles.detailHeaderRow}>
                <View style={[styles.detailHeaderIconWrap, isDark ? styles.detailHeaderIconWrapDark : styles.detailHeaderIconWrapLight]}>
                  <User size={17} color={isDark ? '#7dd3fc' : '#0369a1'} strokeWidth={2.2} />
                </View>

                <View style={styles.detailHeaderTextWrap}>
                  <Text style={[styles.detailHeaderTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                    {editingItem ? 'Sakin yenile' : 'Yeni sakin elave et'}
                  </Text>
                  <Text style={[styles.detailHeaderSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    Sakin melumatlarini doldurub yadda saxlayin.
                  </Text>
                </View>
              </View>

              <View style={styles.detailHeaderMetaRow}>
                <View style={[styles.detailHeaderBadge, isActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                  <BadgeCheck size={13} color={isActive ? '#15803d' : '#b91c1c'} strokeWidth={2.2} />
                  <Text style={[styles.detailHeaderBadgeText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>{statusText}</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.formSectionTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>Esas melumat</Text>

            <View style={styles.formRow}>
              <View style={[styles.formFieldBlock, styles.formFieldBlockModern, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Ad</Text>
                <TextInput
                  value={formState.name}
                  onChangeText={value => onChange({ name: value })}
                  placeholder="Ad"
                  placeholderTextColor={placeholderColor}
                  style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                />
              </View>

              <View style={[styles.formFieldBlock, styles.formFieldBlockModern, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Soyad</Text>
                <TextInput
                  value={formState.surname}
                  onChangeText={value => onChange({ surname: value })}
                  placeholder="Soyad"
                  placeholderTextColor={placeholderColor}
                  style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                />
              </View>
            </View>

            <View style={[styles.formFieldBlock, styles.formFieldBlockModern, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Nov</Text>
              <View style={styles.formStatusRow}>
                <Pressable
                  onPress={() => onChange({ type: 'owner' })}
                  style={[
                    styles.formStatusOption,
                    formState.type === 'owner'
                      ? styles.formStatusOptionActive
                      : isDark
                        ? styles.formStatusOptionIdleDark
                        : styles.formStatusOptionIdleLight,
                  ]}
                >
                  <Text style={[styles.formStatusOptionText, formState.type === 'owner' ? styles.formStatusOptionTextActive : isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    Mulkedar
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => onChange({ type: 'tenant' })}
                  style={[
                    styles.formStatusOption,
                    formState.type === 'tenant'
                      ? styles.formStatusOptionActive
                      : isDark
                        ? styles.formStatusOptionIdleDark
                        : styles.formStatusOptionIdleLight,
                  ]}
                >
                  <Text style={[styles.formStatusOptionText, formState.type === 'tenant' ? styles.formStatusOptionTextActive : isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    Icareci
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.formFieldBlock, styles.formFieldBlockModern, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Elaqe</Text>
              <View style={styles.detailHeaderRow}>
                <Phone size={14} color={isDark ? '#a1a1aa' : '#64748b'} strokeWidth={2.1} />
                <TextInput
                  value={formState.phone}
                  onChangeText={value => onChange({ phone: value })}
                  placeholder="Telefon"
                  placeholderTextColor={placeholderColor}
                  style={[styles.formInput, styles.formHalfField, isDark ? styles.formInputDark : styles.formInputLight]}
                />
              </View>

              <View style={styles.detailHeaderRow}>
                <Mail size={14} color={isDark ? '#a1a1aa' : '#64748b'} strokeWidth={2.1} />
                <TextInput
                  value={formState.email}
                  onChangeText={value => onChange({ email: value })}
                  placeholder="Email"
                  placeholderTextColor={placeholderColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.formInput, styles.formHalfField, isDark ? styles.formInputDark : styles.formInputLight]}
                />
              </View>
            </View>

            <Text style={[styles.formSectionTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>Elave melumat</Text>

            <View style={styles.formRow}>
              <View style={[styles.formFieldBlock, styles.formFieldBlockModern, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Ata adi</Text>
                <TextInput
                  value={formState.fatherName}
                  onChangeText={value => onChange({ fatherName: value })}
                  placeholder="Ata adi"
                  placeholderTextColor={placeholderColor}
                  style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                />
              </View>

              <View style={[styles.formFieldBlock, styles.formFieldBlockModern, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>FIN kod</Text>
                <View style={styles.detailHeaderRow}>
                  <Hash size={14} color={isDark ? '#a1a1aa' : '#64748b'} strokeWidth={2.1} />
                  <TextInput
                    value={formState.personalCode}
                    onChangeText={value => onChange({ personalCode: value })}
                    placeholder="FIN"
                    placeholderTextColor={placeholderColor}
                    style={[styles.formInput, styles.formHalfField, isDark ? styles.formInputDark : styles.formInputLight]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formFieldBlock, styles.formFieldBlockModern, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Dogum tarixi</Text>
                <View style={styles.detailHeaderRow}>
                  <CalendarDays size={14} color={isDark ? '#a1a1aa' : '#64748b'} strokeWidth={2.1} />
                  <TextInput
                    value={formState.birthDate}
                    onChangeText={value => onChange({ birthDate: value })}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={placeholderColor}
                    style={[styles.formInput, styles.formHalfField, isDark ? styles.formInputDark : styles.formInputLight]}
                  />
                </View>
              </View>

              <View style={[styles.formFieldBlock, styles.formFieldBlockModern, styles.formHalfField, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
                <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Cins</Text>
                <View style={styles.formStatusRow}>
                  <Pressable
                    onPress={() => onChange({ gender: 'male' })}
                    style={[
                      styles.formStatusOption,
                      formState.gender === 'male'
                        ? styles.formStatusOptionActive
                        : isDark
                          ? styles.formStatusOptionIdleDark
                          : styles.formStatusOptionIdleLight,
                    ]}
                  >
                    <Text style={[styles.formStatusOptionText, formState.gender === 'male' ? styles.formStatusOptionTextActive : isDark ? styles.textMutedDark : styles.textMutedLight]}>
                      Kisi
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => onChange({ gender: 'female' })}
                    style={[
                      styles.formStatusOption,
                      formState.gender === 'female'
                        ? styles.formStatusOptionActive
                        : isDark
                          ? styles.formStatusOptionIdleDark
                          : styles.formStatusOptionIdleLight,
                    ]}
                  >
                    <Text style={[styles.formStatusOptionText, formState.gender === 'female' ? styles.formStatusOptionTextActive : isDark ? styles.textMutedDark : styles.textMutedLight]}>
                      Qadin
                    </Text>
                  </Pressable>
                </View>
              </View>
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
                  <Text style={[styles.formStatusOptionText, formState.status === 'active' ? styles.formStatusOptionTextActive : isDark ? styles.textMutedDark : styles.textMutedLight]}>
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
                  <Text style={[styles.formStatusOptionText, formState.status === 'inactive' ? styles.formStatusOptionTextInactive : isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    Passiv
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.screenActionsRow, styles.screenActionsRowTwoCol]}>
              <Pressable
                onPress={onClose}
                style={[styles.screenActionButton, isDark ? styles.screenActionButtonDarkGhost : styles.screenActionButtonLightGhost]}
              >
                <ArrowLeft size={15} color={isDark ? '#e4e4e7' : '#334155'} strokeWidth={2.5} />
                <Text style={[styles.screenActionGhostText, isDark && styles.screenActionGhostTextDark]}>Geri</Text>
              </Pressable>

              <Pressable
                onPress={onSubmit}
                disabled={submitting}
                style={[styles.screenActionButton, styles.screenActionPrimaryButton, submitting && styles.footerButtonDisabled]}
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
