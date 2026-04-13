import React from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type SelectOption = {
  id: string | number;
  name: string;
};

type BlockHeroSectionProps = {
  isDark: boolean;
  totalItems: number;
  complexOptions: SelectOption[];
  selectedComplexId: string | number | null;
  complexQuery: string;
  onComplexQueryChange: (value: string) => void;
  complexLoadingMore: boolean;
  complexHasMore: boolean;
  onLoadMoreComplexOptions: () => void;
  onComplexSelect: (id: string | number) => void;
  buildingOptions: SelectOption[];
  selectedBuildingId: string | number | null;
  buildingQuery: string;
  onBuildingQueryChange: (value: string) => void;
  buildingLoadingMore: boolean;
  buildingHasMore: boolean;
  onLoadMoreBuildingOptions: () => void;
  onBuildingSelect: (id: string | number) => void;
  search: string;
  error: string | null;
  onSearchChange: (value: string) => void;
  onSearchPress: () => void;
  onClearPress: () => void;
  onCreatePress: () => void;
};

export function BlockHeroSection({
  isDark,
  totalItems,
  complexOptions,
  selectedComplexId,
  complexQuery,
  onComplexQueryChange,
  complexLoadingMore,
  complexHasMore,
  onLoadMoreComplexOptions,
  onComplexSelect,
  buildingOptions,
  selectedBuildingId,
  buildingQuery,
  onBuildingQueryChange,
  buildingLoadingMore,
  buildingHasMore,
  onLoadMoreBuildingOptions,
  onBuildingSelect,
  search,
  error,
  onSearchChange,
  onSearchPress,
  onClearPress,
  onCreatePress,
}: BlockHeroSectionProps) {
  const [isComplexSelectOpen, setIsComplexSelectOpen] = React.useState(false);
  const [isBuildingSelectOpen, setIsBuildingSelectOpen] = React.useState(false);

  const selectedComplexName =
    complexOptions.find(option => String(option.id) === String(selectedComplexId))?.name ?? 'Complex secin';
  const selectedBuildingName =
    buildingOptions.find(option => String(option.id) === String(selectedBuildingId))?.name ?? 'Bina secin';

  React.useEffect(() => {
    if (complexOptions.length === 0 && isComplexSelectOpen) {
      setIsComplexSelectOpen(false);
    }
  }, [complexOptions.length, isComplexSelectOpen]);

  React.useEffect(() => {
    if (buildingOptions.length === 0 && isBuildingSelectOpen) {
      setIsBuildingSelectOpen(false);
    }
  }, [buildingOptions.length, isBuildingSelectOpen]);

  const onComplexScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (complexLoadingMore || !complexHasMore) {
        return;
      }

      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceToBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceToBottom < 48) {
        onLoadMoreComplexOptions();
      }
    },
    [complexHasMore, complexLoadingMore, onLoadMoreComplexOptions],
  );

  const onBuildingScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (buildingLoadingMore || !buildingHasMore) {
        return;
      }

      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceToBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceToBottom < 48) {
        onLoadMoreBuildingOptions();
      }
    },
    [buildingHasMore, buildingLoadingMore, onLoadMoreBuildingOptions],
  );

  const theme = isDark
    ? {
        shellBg: '#0b1528',
        shellBorder: 'rgba(110, 139, 194, 0.4)',
        bodyBg: '#111f39',
        bodyBorder: 'rgba(122, 151, 204, 0.3)',
        title: '#f8fbff',
        subtitle: '#c0d4f7',
        label: '#96b4e4',
        accent: '#38bdf8',
        countBg: 'rgba(34, 197, 94, 0.2)',
        countText: '#86efac',
        inputBg: 'rgba(255,255,255,0.05)',
        inputBorder: 'rgba(148, 163, 184, 0.28)',
        inputText: '#e2e8f0',
        primaryBtnBg: '#0f766e',
        primaryBtnText: '#ecfeff',
        ghostBtnBg: 'rgba(148, 163, 184, 0.22)',
        ghostBtnText: '#e2e8f0',
        createBtnBg: '#1d4ed8',
        createBtnText: '#eff6ff',
        errorBg: 'rgba(220, 38, 38, 0.17)',
        errorText: '#fecaca',
      }
    : {
        shellBg: '#eef5ff',
        shellBorder: '#c9dbf1',
        bodyBg: '#ffffff',
        bodyBorder: '#d5e5f7',
        title: '#142945',
        subtitle: '#345175',
        label: '#5c79a3',
        accent: '#0ea5e9',
        countBg: '#dcfce7',
        countText: '#15803d',
        inputBg: '#f8fbff',
        inputBorder: '#dbe4ef',
        inputText: '#0f172a',
        primaryBtnBg: '#0f766e',
        primaryBtnText: '#f0fdfa',
        ghostBtnBg: '#e2e8f0',
        ghostBtnText: '#334155',
        createBtnBg: '#2563eb',
        createBtnText: '#ffffff',
        errorBg: '#fee2e2',
        errorText: '#b91c1c',
      };

  return (
    <View
      style={[
        styles.shell,
        (isComplexSelectOpen || isBuildingSelectOpen) ? styles.shellOnTop : null,
        { backgroundColor: theme.shellBg, borderColor: theme.shellBorder },
      ]}
    >
      <View style={[styles.body, { backgroundColor: theme.bodyBg, borderColor: theme.bodyBorder }]}>
        <View style={[styles.accentLine, { backgroundColor: theme.accent }]} />

        <View style={styles.headerRow}>
          <View style={styles.textWrap}>
            <Text style={[styles.eyebrow, { color: theme.label }]}>Management</Text>
            <Text style={[styles.title, { color: theme.title }]}>Bloklar</Text>
            <Text style={[styles.subtitle, { color: theme.subtitle }]}>Blok siyahisi, yarat / elave et / sil</Text>

            <View style={[styles.countPill, { backgroundColor: theme.countBg }]}>
              <Text style={[styles.countText, { color: theme.countText }]}>{totalItems} qeyd</Text>
            </View>
          </View>

          <Pressable
            onPress={onCreatePress}
            style={({ pressed }) => [
              styles.createButton,
              { backgroundColor: theme.createBtnBg },
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={[styles.createButtonText, { color: theme.createBtnText }]}>+ Yeni</Text>
          </Pressable>
        </View>

        <View style={styles.searchGroup}>
          <View style={[styles.selectGroup, isComplexSelectOpen && styles.selectGroupOnTop]}>
            <Text style={[styles.selectLabel, { color: theme.label }]}>Aktiv Complex</Text>

            <Pressable
              onPress={() => {
                if (complexOptions.length > 0) {
                  setIsBuildingSelectOpen(false);
                  onBuildingQueryChange('');
                  setIsComplexSelectOpen(prev => !prev);
                }
              }}
              style={[
                styles.selectTrigger,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
                complexOptions.length === 0 ? styles.selectTriggerDisabled : null,
              ]}
            >
              <Text style={[styles.selectValue, { color: theme.inputText }]} numberOfLines={1}>
                {selectedComplexName}
              </Text>
              <Text style={[styles.selectCaret, { color: theme.label }]}>{isComplexSelectOpen ? '▲' : '▼'}</Text>
            </Pressable>

            {isComplexSelectOpen ? (
              <View style={[styles.selectOptions, { backgroundColor: theme.bodyBg, borderColor: theme.inputBorder }]}>
                <TextInput
                  value={complexQuery}
                  onChangeText={onComplexQueryChange}
                  placeholder="Complex axtar"
                  placeholderTextColor="#94a3b8"
                  style={[
                    styles.dropdownSearchInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.inputText,
                    },
                  ]}
                />

                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  style={styles.selectOptionsScroll}
                  contentContainerStyle={styles.selectOptionsScrollContent}
                  onScroll={onComplexScroll}
                  scrollEventThrottle={16}
                >
                  {complexOptions.map(option => {
                    const isSelected = String(option.id) === String(selectedComplexId);
                    return (
                      <Pressable
                        key={String(option.id)}
                        onPress={() => {
                          onComplexSelect(option.id);
                          setIsComplexSelectOpen(false);
                        }}
                        style={[
                          styles.selectOption,
                          isSelected ? { backgroundColor: isDark ? 'rgba(59,130,246,0.26)' : '#dbeafe' } : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            { color: isSelected ? (isDark ? '#dbeafe' : '#1d4ed8') : theme.inputText },
                          ]}
                        >
                          {option.name}
                        </Text>
                      </Pressable>
                    );
                  })}

                  {complexOptions.length === 0 ? (
                    <Text style={[styles.emptySelectText, { color: theme.label }]}>Netice tapilmadi</Text>
                  ) : null}

                  {complexLoadingMore ? (
                    <View style={styles.selectLoaderWrap}>
                      <ActivityIndicator size="small" color={isDark ? '#38bdf8' : '#0284c7'} />
                    </View>
                  ) : null}
                </ScrollView>
              </View>
            ) : null}
          </View>

          <View style={[styles.selectGroup, isBuildingSelectOpen && styles.selectGroupOnTop]}>
            <Text style={[styles.selectLabel, { color: theme.label }]}>Aktiv Bina</Text>

            <Pressable
              onPress={() => {
                if (buildingOptions.length > 0) {
                  setIsComplexSelectOpen(false);
                  onComplexQueryChange('');
                  setIsBuildingSelectOpen(prev => !prev);
                }
              }}
              style={[
                styles.selectTrigger,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
                buildingOptions.length === 0 ? styles.selectTriggerDisabled : null,
              ]}
            >
              <Text style={[styles.selectValue, { color: theme.inputText }]} numberOfLines={1}>
                {selectedBuildingName}
              </Text>
              <Text style={[styles.selectCaret, { color: theme.label }]}>{isBuildingSelectOpen ? '▲' : '▼'}</Text>
            </Pressable>

            {isBuildingSelectOpen ? (
              <View style={[styles.selectOptions, { backgroundColor: theme.bodyBg, borderColor: theme.inputBorder }]}>
                <TextInput
                  value={buildingQuery}
                  onChangeText={onBuildingQueryChange}
                  placeholder="Bina axtar"
                  placeholderTextColor="#94a3b8"
                  style={[
                    styles.dropdownSearchInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.inputText,
                    },
                  ]}
                />

                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  style={styles.selectOptionsScroll}
                  contentContainerStyle={styles.selectOptionsScrollContent}
                  onScroll={onBuildingScroll}
                  scrollEventThrottle={16}
                >
                  {buildingOptions.map(option => {
                    const isSelected = String(option.id) === String(selectedBuildingId);
                    return (
                      <Pressable
                        key={String(option.id)}
                        onPress={() => {
                          onBuildingSelect(option.id);
                          setIsBuildingSelectOpen(false);
                        }}
                        style={[
                          styles.selectOption,
                          isSelected ? { backgroundColor: isDark ? 'rgba(59,130,246,0.26)' : '#dbeafe' } : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            { color: isSelected ? (isDark ? '#dbeafe' : '#1d4ed8') : theme.inputText },
                          ]}
                        >
                          {option.name}
                        </Text>
                      </Pressable>
                    );
                  })}

                  {buildingOptions.length === 0 ? (
                    <Text style={[styles.emptySelectText, { color: theme.label }]}>Netice tapilmadi</Text>
                  ) : null}

                  {buildingLoadingMore ? (
                    <View style={styles.selectLoaderWrap}>
                      <ActivityIndicator size="small" color={isDark ? '#38bdf8' : '#0284c7'} />
                    </View>
                  ) : null}
                </ScrollView>
              </View>
            ) : null}
          </View>

          <TextInput
            value={search}
            onChangeText={onSearchChange}
            placeholder="Blok adi ile axtar"
            placeholderTextColor="#94a3b8"
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText,
              },
            ]}
            returnKeyType="search"
            onSubmitEditing={onSearchPress}
          />

          <View style={styles.actionsRow}>
            <Pressable
              onPress={onSearchPress}
              style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.primaryBtnBg }, pressed ? styles.pressed : null]}
            >
              <Text style={[styles.actionButtonText, { color: theme.primaryBtnText }]}>Axtar</Text>
            </Pressable>

            <Pressable
              onPress={onClearPress}
              style={({ pressed }) => [
                styles.actionButton,
                styles.ghostButton,
                { backgroundColor: theme.ghostBtnBg },
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={[styles.actionButtonText, { color: theme.ghostBtnText }]}>Sifirla</Text>
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: theme.errorBg }]}>
            <Text style={[styles.errorText, { color: theme.errorText }]}>{error}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    zIndex: 20,
  },
  shellOnTop: {
    zIndex: 120,
    elevation: 30,
  },
  body: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    overflow: 'visible',
  },
  accentLine: {
    height: 4,
    width: '100%',
    borderRadius: 999,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  textWrap: {
    flex: 1,
    gap: 2,
    paddingRight: 6,
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: 'WorkSans-Bold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    lineHeight: 27,
    fontFamily: 'WorkSans-Bold',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'WorkSans-Medium',
  },
  countPill: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
  },
  createButton: {
    minHeight: 38,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  searchGroup: {
    gap: 8,
  },
  selectGroup: {
    position: 'relative',
    gap: 6,
    zIndex: 10,
  },
  selectGroupOnTop: {
    zIndex: 40,
  },
  selectLabel: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  selectTrigger: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectTriggerDisabled: {
    opacity: 0.6,
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
    top: 62,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    padding: 6,
    gap: 4,
    shadowColor: '#0f172a',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 40,
    zIndex: 220,
  },
  dropdownSearchInput: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  selectOptionsScroll: {
    maxHeight: 220,
  },
  selectOptionsScrollContent: {
    gap: 4,
  },
  selectOption: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectOptionText: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
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
  searchInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  ghostButton: {
    flex: 0.85,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  errorBox: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
});
