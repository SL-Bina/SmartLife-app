import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { managementStyles as styles } from '../management-styles';

type ManagementHeroSectionProps = {
  isDark: boolean;
  entityLabel: string;
  totalItems: number;
  selectedMtkName?: string;
  selectedComplexName?: string;
  complexOptions?: string[];
  selectedBuildingName?: string;
  buildingOptions?: string[];
  selectedBlockName?: string;
  blockOptions?: string[];
  search: string;
  searchPlaceholder: string;
  error: string | null;
  onSearchChange: (value: string) => void;
  onComplexSelect?: (complexName: string) => void;
  onBuildingSelect?: (buildingName: string) => void;
  onBlockSelect?: (blockName: string) => void;
  showFilterReset?: boolean;
  onResetFilters?: () => void;
  onSearchPress: () => void;
  onRefreshPress: () => void;
  onCreatePress: () => void;
};

export function ManagementHeroSection({
  isDark,
  entityLabel,
  totalItems,
  selectedMtkName,
  selectedComplexName,
  complexOptions,
  selectedBuildingName,
  buildingOptions,
  selectedBlockName,
  blockOptions,
  search,
  searchPlaceholder,
  error,
  onSearchChange,
  onComplexSelect,
  onBuildingSelect,
  onBlockSelect,
  showFilterReset,
  onResetFilters,
  onSearchPress,
  onRefreshPress,
  onCreatePress,
}: ManagementHeroSectionProps) {
  const [isComplexSelectOpen, setIsComplexSelectOpen] = React.useState(false);
  const [isBuildingSelectOpen, setIsBuildingSelectOpen] = React.useState(false);
  const [isBlockSelectOpen, setIsBlockSelectOpen] = React.useState(false);
  const complexCount = complexOptions?.length ?? 0;
  const canOpenComplexSelect = Boolean(onComplexSelect && complexCount > 0);
  const buildingCount = buildingOptions?.length ?? 0;
  const canOpenBuildingSelect = Boolean(onBuildingSelect && buildingCount > 0);
  const blockCount = blockOptions?.length ?? 0;
  const canOpenBlockSelect = Boolean(onBlockSelect && blockCount > 0);

  React.useEffect(() => {
    if (!canOpenComplexSelect && isComplexSelectOpen) {
      setIsComplexSelectOpen(false);
    }
  }, [canOpenComplexSelect, isComplexSelectOpen]);

  React.useEffect(() => {
    if (!canOpenBuildingSelect && isBuildingSelectOpen) {
      setIsBuildingSelectOpen(false);
    }
  }, [canOpenBuildingSelect, isBuildingSelectOpen]);

  React.useEffect(() => {
    if (!canOpenBlockSelect && isBlockSelectOpen) {
      setIsBlockSelectOpen(false);
    }
  }, [canOpenBlockSelect, isBlockSelectOpen]);

  const onComplexSelectPress = React.useCallback(() => {
    if (!canOpenComplexSelect) {
      return;
    }

    setIsBuildingSelectOpen(false);
    setIsBlockSelectOpen(false);
    setIsComplexSelectOpen(prev => !prev);
  }, [canOpenComplexSelect]);

  const onComplexOptionPress = React.useCallback(
    (complexName: string) => {
      onComplexSelect?.(complexName);
      setIsComplexSelectOpen(false);
    },
    [onComplexSelect],
  );

  const onBuildingSelectPress = React.useCallback(() => {
    if (!canOpenBuildingSelect) {
      return;
    }

    setIsComplexSelectOpen(false);
    setIsBlockSelectOpen(false);
    setIsBuildingSelectOpen(prev => !prev);
  }, [canOpenBuildingSelect]);

  const onBuildingOptionPress = React.useCallback(
    (buildingName: string) => {
      onBuildingSelect?.(buildingName);
      setIsBuildingSelectOpen(false);
    },
    [onBuildingSelect],
  );

  const onBlockSelectPress = React.useCallback(() => {
    if (!canOpenBlockSelect) {
      return;
    }

    setIsComplexSelectOpen(false);
    setIsBuildingSelectOpen(false);
    setIsBlockSelectOpen(prev => !prev);
  }, [canOpenBlockSelect]);

  const onBlockOptionPress = React.useCallback(
    (blockName: string) => {
      onBlockSelect?.(blockName);
      setIsBlockSelectOpen(false);
    },
    [onBlockSelect],
  );

  return (
    <View style={[styles.heroCard, isDark ? styles.heroCardDark : styles.heroCardLight]}>
      <View style={styles.heroGlowOne} />
      <View style={styles.heroGlowTwo} />

      {/* <View style={styles.heroHeader}>
        <View style={styles.heroTextWrap}>
          <Text style={[styles.heroEyebrow, isDark ? styles.textAccentDark : styles.textAccentLight]}>
            Management Panel
          </Text>
          <Text style={[styles.heroTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
            {entityLabel}
          </Text>
          <Text style={[styles.heroDescription, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            Məlumatları daha rahat idarə et, axtar, əlavə et və yenilə.
          </Text>
        </View>

        <View style={[styles.statsCard, isDark ? styles.statsCardDark : styles.statsCardLight]}>
          <Text style={[styles.statsLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            Cəmi qeyd
          </Text>
          <Text style={[styles.statsValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
            {totalItems}
          </Text>
        </View>
      </View> */}

      {/* {selectedMtkName ? (
        <View style={[styles.activeMtkBadge, isDark ? styles.activeMtkBadgeDark : styles.activeMtkBadgeLight]}>
          <Text style={[styles.activeMtkText, isDark ? styles.activeMtkTextDark : styles.activeMtkTextLight]}>
            Aktiv MTK: {selectedMtkName}
          </Text>
        </View>
      ) : null} */}

      {complexOptions !== undefined ? (
        <View style={styles.complexFilterSection}>
          <Text style={[styles.complexFilterTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            Aktiv Complex seçimi
          </Text>

          <Pressable
            onPress={onComplexSelectPress}
            disabled={!canOpenComplexSelect}
            style={[
              styles.complexSelectTrigger,
              isDark ? styles.complexSelectTriggerDark : styles.complexSelectTriggerLight,
              !canOpenComplexSelect ? styles.complexSelectTriggerDisabled : null,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.complexSelectValue,
                isDark ? styles.textPrimaryDark : styles.textPrimaryLight,
              ]}
            >
              {selectedComplexName ?? 'Complex seçin'}
            </Text>

            <Text
              style={[
                styles.complexSelectCaret,
                isDark ? styles.textMutedDark : styles.textMutedLight,
              ]}
            >
              {canOpenComplexSelect ? (isComplexSelectOpen ? '▲' : '▼') : ''}
            </Text>
          </Pressable>

          {isComplexSelectOpen ? (
            <View style={[styles.complexOptionsList, isDark ? styles.panelDark : styles.panelLight]}>
              {complexOptions.map((complexName, index) => {
                const isSelected = complexName === selectedComplexName;

                return (
                  <Pressable
                    key={`${complexName}-${index}`}
                    style={[
                      styles.complexOptionRow,
                      isSelected
                        ? isDark
                          ? styles.complexOptionRowSelectedDark
                          : styles.complexOptionRowSelectedLight
                        : isDark
                          ? styles.complexOptionRowDark
                          : styles.complexOptionRowLight,
                    ]}
                    onPress={() => onComplexOptionPress(complexName)}
                  >
                    <Text
                      style={[
                        styles.complexOptionText,
                        isSelected
                          ? isDark
                            ? styles.complexOptionTextSelectedDark
                            : styles.complexOptionTextSelectedLight
                          : isDark
                            ? styles.selectChipTextDark
                            : styles.selectChipTextLight,
                      ]}
                    >
                      {complexName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}

      {buildingOptions !== undefined ? (
        <View style={styles.complexFilterSection}>
          <Text style={[styles.complexFilterTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            Aktiv Bina seçimi
          </Text>

          <Pressable
            onPress={onBuildingSelectPress}
            disabled={!canOpenBuildingSelect}
            style={[
              styles.complexSelectTrigger,
              isDark ? styles.complexSelectTriggerDark : styles.complexSelectTriggerLight,
              !canOpenBuildingSelect ? styles.complexSelectTriggerDisabled : null,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.complexSelectValue,
                isDark ? styles.textPrimaryDark : styles.textPrimaryLight,
              ]}
            >
              {selectedBuildingName ?? 'Bina seçin'}
            </Text>

            <Text
              style={[
                styles.complexSelectCaret,
                isDark ? styles.textMutedDark : styles.textMutedLight,
              ]}
            >
              {canOpenBuildingSelect ? (isBuildingSelectOpen ? '▲' : '▼') : ''}
            </Text>
          </Pressable>

          {isBuildingSelectOpen ? (
            <View style={[styles.complexOptionsList, isDark ? styles.panelDark : styles.panelLight]}>
              {buildingOptions.map((buildingName, index) => {
                const isSelected = buildingName === selectedBuildingName;

                return (
                  <Pressable
                    key={`${buildingName}-${index}`}
                    style={[
                      styles.complexOptionRow,
                      isSelected
                        ? isDark
                          ? styles.complexOptionRowSelectedDark
                          : styles.complexOptionRowSelectedLight
                        : isDark
                          ? styles.complexOptionRowDark
                          : styles.complexOptionRowLight,
                    ]}
                    onPress={() => onBuildingOptionPress(buildingName)}
                  >
                    <Text
                      style={[
                        styles.complexOptionText,
                        isSelected
                          ? isDark
                            ? styles.complexOptionTextSelectedDark
                            : styles.complexOptionTextSelectedLight
                          : isDark
                            ? styles.selectChipTextDark
                            : styles.selectChipTextLight,
                      ]}
                    >
                      {buildingName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}

      {blockOptions !== undefined ? (
        <View style={styles.complexFilterSection}>
          <Text style={[styles.complexFilterTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            Aktiv Blok seçimi
          </Text>

          <Pressable
            onPress={onBlockSelectPress}
            disabled={!canOpenBlockSelect}
            style={[
              styles.complexSelectTrigger,
              isDark ? styles.complexSelectTriggerDark : styles.complexSelectTriggerLight,
              !canOpenBlockSelect ? styles.complexSelectTriggerDisabled : null,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.complexSelectValue,
                isDark ? styles.textPrimaryDark : styles.textPrimaryLight,
              ]}
            >
              {selectedBlockName ?? 'Blok seçin'}
            </Text>

            <Text
              style={[
                styles.complexSelectCaret,
                isDark ? styles.textMutedDark : styles.textMutedLight,
              ]}
            >
              {canOpenBlockSelect ? (isBlockSelectOpen ? '▲' : '▼') : ''}
            </Text>
          </Pressable>

          {isBlockSelectOpen ? (
            <View style={[styles.complexOptionsList, isDark ? styles.panelDark : styles.panelLight]}>
              {blockOptions.map((blockName, index) => {
                const isSelected = blockName === selectedBlockName;

                return (
                  <Pressable
                    key={`${blockName}-${index}`}
                    style={[
                      styles.complexOptionRow,
                      isSelected
                        ? isDark
                          ? styles.complexOptionRowSelectedDark
                          : styles.complexOptionRowSelectedLight
                        : isDark
                          ? styles.complexOptionRowDark
                          : styles.complexOptionRowLight,
                    ]}
                    onPress={() => onBlockOptionPress(blockName)}
                  >
                    <Text
                      style={[
                        styles.complexOptionText,
                        isSelected
                          ? isDark
                            ? styles.complexOptionTextSelectedDark
                            : styles.complexOptionTextSelectedLight
                          : isDark
                            ? styles.selectChipTextDark
                            : styles.selectChipTextLight,
                      ]}
                    >
                      {blockName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}

      {showFilterReset ? (
        <View style={styles.complexFilterSection}>
          <Pressable
            onPress={onResetFilters}
            style={[styles.actionButton, styles.ghostButton]}
          >
            <Text style={styles.ghostButtonText}>Sifirla</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.toolbarCard}>
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
          style={[styles.searchInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
        />

        <View style={styles.actionsRow}>
          <Pressable onPress={onSearchPress} style={[styles.actionButton, styles.ghostButton]}>
            <Text style={styles.ghostButtonText}>Axtar</Text>
          </Pressable>

          <Pressable onPress={onRefreshPress} style={[styles.actionButton, styles.ghostButton]}>
            <Text style={styles.ghostButtonText}>Yenilə</Text>
          </Pressable>

          <Pressable onPress={onCreatePress} style={[styles.actionButton, styles.primaryButton]}>
            <Text style={styles.primaryButtonText}>+ Yeni qeyd</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </View>
  );
}
