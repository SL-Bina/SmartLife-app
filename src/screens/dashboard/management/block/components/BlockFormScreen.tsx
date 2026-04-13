import React from 'react';
import {
  ActivityIndicator,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeft, BadgeCheck, Blocks, FileText, Save } from 'lucide-react-native';

import { blockStyles as styles } from '../styles';
import { EntityItem, BlockFormState } from '../types';

type SelectOption = {
  id: string | number;
  name: string;
};

type BlockFormScreenProps = {
  isDark: boolean;
  editingItem: EntityItem | null;
  formState: BlockFormState;
  buildingOptions: SelectOption[];
  buildingQuery: string;
  onBuildingQueryChange: (value: string) => void;
  buildingLoading: boolean;
  buildingLoadingMore: boolean;
  buildingHasMore: boolean;
  submitting: boolean;
  onLoadMoreBuildings: () => void;
  onChange: (patch: Partial<BlockFormState>) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function BlockFormScreen({
  isDark,
  editingItem,
  formState,
  buildingOptions,
  buildingQuery,
  onBuildingQueryChange,
  buildingLoading,
  buildingLoadingMore,
  buildingHasMore,
  submitting,
  onLoadMoreBuildings,
  onChange,
  onClose,
  onSubmit,
}: BlockFormScreenProps) {
  const placeholderColor = isDark ? '#71717a' : '#94a3b8';
  const isActive = formState.status === 'active';
  const statusText = isActive ? 'Aktiv' : 'Passiv';
  const [isBuildingSelectOpen, setIsBuildingSelectOpen] = React.useState(false);
  const entryAnim = React.useRef(new Animated.Value(0)).current;

  const selectedBuildingName =
    buildingOptions.find(option => String(option.id) === formState.buildingId.trim())?.name ??
    (formState.buildingId.trim().length > 0 ? `Bina #${formState.buildingId.trim()}` : 'Bina secin');

  React.useEffect(() => {
    if (buildingOptions.length === 0 && isBuildingSelectOpen) {
      setIsBuildingSelectOpen(false);
    }
  }, [buildingOptions.length, isBuildingSelectOpen]);

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

  const onSelectScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (buildingLoadingMore || !buildingHasMore) {
        return;
      }

      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceToBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceToBottom < 48) {
        onLoadMoreBuildings();
      }
    },
    [buildingHasMore, buildingLoadingMore, onLoadMoreBuildings],
  );

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
                  <Blocks size={17} color={isDark ? '#7dd3fc' : '#0369a1'} strokeWidth={2.2} />
                </View>

                <View style={styles.detailHeaderTextWrap}>
                  <Text style={[styles.detailHeaderTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                    {editingItem ? 'Blok yenile' : 'Yeni blok elave et'}
                  </Text>
                  <Text style={[styles.detailHeaderSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    Blok melumatlarini doldurub yadda saxlayin.
                  </Text>
                </View>
              </View>

              <View style={styles.detailHeaderMetaRow}>
                <View
                  style={[
                    styles.detailHeaderBadge,
                    isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
                  ]}
                >
                  <BadgeCheck size={13} color={isActive ? '#15803d' : '#b91c1c'} strokeWidth={2.2} />
                  <Text
                    style={[
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
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Blok adi</Text>
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
                isBuildingSelectOpen ? localStyles.selectBlockOnTop : null,
              ]}
            >
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Bina ID</Text>

              <Pressable
                onPress={() => {
                  if (buildingOptions.length > 0) {
                    setIsBuildingSelectOpen(prev => !prev);
                    if (isBuildingSelectOpen) {
                      onBuildingQueryChange('');
                    }
                  }
                }}
                style={[
                  localStyles.selectTrigger,
                  isDark ? localStyles.selectTriggerDark : localStyles.selectTriggerLight,
                  buildingOptions.length === 0 ? localStyles.selectTriggerDisabled : null,
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    localStyles.selectValue,
                    { color: isDark ? '#f4f4f5' : '#0f172a' },
                  ]}
                >
                  {buildingLoading ? 'Yuklenir...' : selectedBuildingName}
                </Text>
                <Text style={[localStyles.selectCaret, { color: isDark ? '#a1a1aa' : '#64748b' }]}>
                  {isBuildingSelectOpen ? '▲' : '▼'}
                </Text>
              </Pressable>

              {isBuildingSelectOpen ? (
                <View style={[localStyles.selectOptions, isDark ? localStyles.selectOptionsDark : localStyles.selectOptionsLight]}>
                  <TextInput
                    value={buildingQuery}
                    onChangeText={onBuildingQueryChange}
                    placeholder="Bina axtar"
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
                    {buildingOptions.map(option => {
                      const isSelected = String(option.id) === formState.buildingId.trim();

                      return (
                        <Pressable
                          key={String(option.id)}
                          onPress={() => {
                            onChange({ buildingId: String(option.id) });
                            setIsBuildingSelectOpen(false);
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
                                color: isSelected
                                  ? (isDark ? '#dbeafe' : '#1d4ed8')
                                  : (isDark ? '#e4e4e7' : '#1f2937'),
                              },
                            ]}
                          >
                            {option.name}
                          </Text>
                        </Pressable>
                      );
                    })}

                    {buildingOptions.length === 0 ? (
                      <Text style={[localStyles.emptySelectText, { color: isDark ? '#a1a1aa' : '#64748b' }]}>Netice tapilmadi</Text>
                    ) : null}

                    {buildingLoadingMore ? (
                      <View style={localStyles.selectLoaderWrap}>
                        <ActivityIndicator size="small" color={isDark ? '#38bdf8' : '#0284c7'} />
                      </View>
                    ) : null}
                  </ScrollView>
                </View>
              ) : null}
            </View>

            <View style={[styles.formFieldBlock, styles.formFieldBlockModern, isDark ? styles.formFieldBlockDark : styles.formFieldBlockLight]}>
              <Text style={[styles.formFieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Tesvir</Text>
              <View style={styles.detailHeaderRow}>
                <FileText size={14} color={isDark ? '#a1a1aa' : '#64748b'} strokeWidth={2.1} />
              </View>
              <TextInput
                value={formState.description}
                onChangeText={value => onChange({ description: value })}
                placeholder="Qisa tesvir daxil edin"
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
  selectSearchInput: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  selectOptionsLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  selectOptionsDark: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
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
