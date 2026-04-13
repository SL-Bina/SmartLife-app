import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { residentStyles as styles } from '../styles';

type ResidentHeroSectionProps = {
  isDark: boolean;
  totalItems: number;
  search: string;
  error: string | null;
  onSearchChange: (value: string) => void;
  onSearchPress: () => void;
  onClearPress: () => void;
  onCreatePress: () => void;
};

export function ResidentHeroSection({
  isDark,
  totalItems,
  search,
  error,
  onSearchChange,
  onSearchPress,
  onClearPress,
  onCreatePress,
}: ResidentHeroSectionProps) {
  return (
    <View style={styles.heroLayer}>
      <View style={[styles.heroCard, isDark ? styles.heroCardDark : styles.heroCardLight]}>
        <View style={styles.heroGradient}>
          <View style={styles.heroRow}>
            <View style={styles.heroTextWrap}>
              <Text style={[styles.heroEyebrow, isDark ? styles.textAccentDark : styles.textAccentLight]}>
                Management
              </Text>
              <Text style={[styles.heroTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                Sakinler
              </Text>
              <Text style={[styles.heroSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Sakin siyahisi, yarat / duzelis et / sil
              </Text>
            </View>

            <Pressable onPress={onCreatePress} style={styles.createButton}>
              <Text style={styles.createButtonText}>+ Yeni</Text>
            </Pressable>
          </View>

          <Text style={[styles.cardMetaLine, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            Cemi qeyd: {totalItems}
          </Text>

          <View style={styles.searchRow}>
            <TextInput
              value={search}
              onChangeText={onSearchChange}
              placeholder="Ad ve ya soyad ile axtar"
              placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
              style={[styles.searchInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
            />

            <Pressable onPress={onSearchPress} style={[styles.searchButton, styles.searchButtonPrimary]}>
              <Text style={styles.searchButtonText}>Axtar</Text>
            </Pressable>

            <Pressable onPress={onClearPress} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Temizle</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>
    </View>
  );
}
