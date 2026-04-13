import React from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeft, BadgeCheck, Building2, Hash, Ruler, Save } from 'lucide-react-native';

import { propertyStyles as styles } from '../styles';
import { EntityItem, PropertyFormState } from '../types';

type SelectOption = {
  id: string | number;
  name: string;
};

type PropertyFormScreenProps = {
  isDark: boolean;
  editingItem: EntityItem | null;
  formState: PropertyFormState;
  blockOptions: SelectOption[];
  blockQuery: string;
  onBlockQueryChange: (value: string) => void;
  blockLoading: boolean;
  blockLoadingMore: boolean;
  blockHasMore: boolean;
  submitting: boolean;
  onLoadMoreBlocks: () => void;
  onChange: (patch: Partial<PropertyFormState>) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function PropertyFormScreen({
  isDark,
  editingItem,
  formState,
  blockOptions,
  blockQuery,
  onBlockQueryChange,
  blockLoading,
  blockLoadingMore,
  blockHasMore,
  submitting,
  onLoadMoreBlocks,
  onChange,
  onClose,
  onSubmit,
}: PropertyFormScreenProps) {
  const placeholderColor = isDark ? '#71717a' : '#94a3b8';
  const isActive = formState.status === 'active';
  const statusText = isActive ? 'Aktiv' : 'Passiv';
  const [isBlockSelectOpen, setIsBlockSelectOpen] = React.useState(false);
  const entryAnim = React.useRef(new Animated.Value(0)).current;

  const selectedBlockName =
    blockOptions.find(option => String(option.id) === formState.blockId.trim())?.name ??
    (formState.blockId.trim().length > 0 ? `Blok #${formState.blockId.trim()}` : 'Blok secin');

  React.useEffect(() => {
    if (blockOptions.length === 0 && isBlockSelectOpen) {
      setIsBlockSelectOpen(false);
    }
  }, [blockOptions.length, isBlockSelectOpen]);

  React.useEffect(() => {
    const entry = Animated.timing(entryAnim, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    });

    entry.start();
    return () => entry.stop();
  }, [entryAnim]);

  const onSelectScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (blockLoadingMore || !blockHasMore) {
        return;
      }

      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceToBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceToBottom < 48) {
        onLoadMoreBlocks();
      }
    },
    [blockHasMore, blockLoadingMore, onLoadMoreBlocks],
  );

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
                  <Building2 size={17} color={isDark ? '#7dd3fc' : '#0369a1'} strokeWidth={2.2} />
                </View>

                <View style={styles.detailHeaderTextWrap}>
                  <Text style={[styles.detailHeaderTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                    {editingItem ? 'Menzil yenile' : 'Yeni menzil elave et'}
                  </Text>
                  <Text style={[styles.detailHeaderSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    Menzil melumatlarini doldurub yadda saxlayin.
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

            <View style={[styles.formFieldBlock, styles.formFieldBlockModern, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Menzil adi</Text>
              <TextInput
                value={formState.name}
                onChangeText={value => onChange({ name: value })}
                placeholder="Daxil edin"
                placeholderTextColor={placeholderColor}
                style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
              />  
            </View>

            <View
              style={[
                styles.formFieldBlock,
                styles.formFieldBlockModern,
                isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight,
                localStyles.selectBlock,
                isBlockSelectOpen ? localStyles.selectBlockOnTop : null,
              ]}
            >
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Blok ID</Text>

              <Pressable
                onPress={() => {
                  if (blockOptions.length > 0) {
                    setIsBlockSelectOpen(prev => !prev);
                    if (isBlockSelectOpen) {
                      onBlockQueryChange('');
                    }
                  }
                }}
                style={[
                  localStyles.selectTrigger,
                  isDark ? localStyles.selectTriggerDark : localStyles.selectTriggerLight,
                  blockOptions.length === 0 ? localStyles.selectTriggerDisabled : null,
                ]}
              >
                <Text numberOfLines={1} style={[localStyles.selectValue, { color: isDark ? '#f4f4f5' : '#0f172a' }]}>
                  {blockLoading ? 'Yuklenir...' : selectedBlockName}
                </Text>
                <Text style={[localStyles.selectCaret, { color: isDark ? '#a1a1aa' : '#64748b' }]}>{isBlockSelectOpen ? '▲' : '▼'}</Text>
              </Pressable>

              {isBlockSelectOpen ? (
                <View style={[localStyles.selectOptions, isDark ? localStyles.selectOptionsDark : localStyles.selectOptionsLight]}>
                  <TextInput
                    value={blockQuery}
                    onChangeText={onBlockQueryChange}
                    placeholder="Blok axtar"
                    placeholderTextColor="#94a3b8"
                    style={[
                      localStyles.selectSearchInput,
                      isDark ? localStyles.selectTriggerDark : localStyles.selectTriggerLight,
                      { color: isDark ? '#f4f4f5' : '#0f172a' },
                    ]}
                  />

                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    style={localStyles.selectOptionsScroll}
                    contentContainerStyle={localStyles.selectOptionsScrollContent}
                    onScroll={onSelectScroll}
                    scrollEventThrottle={16}
                  >
                    {blockOptions.map(option => {
                      const isSelected = String(option.id) === formState.blockId.trim();

                      return (
                        <Pressable
                          key={String(option.id)}
                          onPress={() => {
                            onChange({ blockId: String(option.id) });
                            setIsBlockSelectOpen(false);
                          }}
                          style={[
                            localStyles.selectOption,
                            isSelected ? (isDark ? localStyles.selectOptionSelectedDark : localStyles.selectOptionSelectedLight) : null,
                          ]}
                        >
                          <Text
                            numberOfLines={1}
                            style={[
                              localStyles.selectOptionText,
                              {
                                color: isSelected ? (isDark ? '#dbeafe' : '#1d4ed8') : (isDark ? '#e4e4e7' : '#1f2937'),
                              },
                            ]}
                          >
                            {option.name}
                          </Text>
                        </Pressable>
                      );
                    })}

                    {blockOptions.length === 0 ? (
                      <Text style={[localStyles.emptySelectText, { color: isDark ? '#a1a1aa' : '#64748b' }]}>Netice tapilmadi</Text>
                    ) : null}

                    {blockLoadingMore ? (
                      <View style={localStyles.selectLoaderWrap}>
                        <ActivityIndicator size="small" color={isDark ? '#38bdf8' : '#0284c7'} />
                      </View>
                    ) : null}
                  </ScrollView>
                </View>
              ) : null}
            </View>

            <View style={[styles.formFieldBlock, styles.formFieldBlockModern, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Menzil no</Text>
              <View style={styles.detailHeaderRow}>
                <Hash size={14} color={isDark ? '#a1a1aa' : '#64748b'} strokeWidth={2.1} />
                <TextInput
                  value={formState.apartmentNumber}
                  onChangeText={value => onChange({ apartmentNumber: value })}
                  placeholder="101"
                  placeholderTextColor={placeholderColor}
                  style={[styles.formInput, styles.formHalfField, isDark ? styles.formInputDark : styles.formInputLight]}
                />
              </View>
            </View>

            <View style={[styles.formFieldBlock, styles.formFieldBlockModern, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Sahe (m2)</Text>
              <View style={styles.detailHeaderRow}>
                <Ruler size={14} color={isDark ? '#a1a1aa' : '#64748b'} strokeWidth={2.1} />
                <TextInput
                  value={formState.area}
                  onChangeText={value => onChange({ area: value })}
                  placeholder="85"
                  placeholderTextColor={placeholderColor}
                  keyboardType="decimal-pad"
                  style={[styles.formInput, styles.formHalfField, isDark ? styles.formInputDark : styles.formInputLight]}
                />
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

const localStyles = StyleSheet.create({
  selectBlock: {
    position: 'relative',
    zIndex: 10,
  },
  selectBlockOnTop: {
    zIndex: 40,
    elevation: 30,
  },
  selectTrigger: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectTriggerLight: {
    backgroundColor: '#f8fbff',
    borderColor: '#dbe4ef',
  },
  selectTriggerDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  selectTriggerDisabled: {
    opacity: 0.65,
  },
  selectValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
  },
  selectCaret: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
  },
  selectOptions: {
    position: 'absolute',
    top: 74,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    padding: 6,
    gap: 4,
    maxHeight: 180,
    zIndex: 220,
    elevation: 40,
  },
  selectOptionsLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  selectOptionsDark: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
  },
  selectSearchInput: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  selectOption: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectOptionSelectedLight: {
    backgroundColor: '#dbeafe',
  },
  selectOptionSelectedDark: {
    backgroundColor: 'rgba(59,130,246,0.26)',
  },
  selectOptionText: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  selectOptionsScroll: {
    maxHeight: 180,
  },
  selectOptionsScrollContent: {
    gap: 4,
  },
  selectLoaderWrap: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySelectText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
    textAlign: 'center',
    paddingVertical: 10,
  },
});
