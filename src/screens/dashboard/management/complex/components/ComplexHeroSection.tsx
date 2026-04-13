import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type ComplexHeroSectionProps = {
  isDark: boolean;
  totalItems: number;
  search: string;
  error: string | null;
  onSearchChange: (value: string) => void;
  onSearchPress: () => void;
  onClearPress: () => void;
  onCreatePress: () => void;
};

export function ComplexHeroSection({
  isDark,
  totalItems,
  search,
  error,
  onSearchChange,
  onSearchPress,
  onClearPress,
  onCreatePress,
}: ComplexHeroSectionProps) {
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
    <View style={[styles.shell, { backgroundColor: theme.shellBg, borderColor: theme.shellBorder }]}>
      <View style={[styles.body, { backgroundColor: theme.bodyBg, borderColor: theme.bodyBorder }]}>
        <View style={[styles.accentLine, { backgroundColor: theme.accent }]} />

        <View style={styles.headerRow}>
          <View style={styles.textWrap}>
            <Text style={[styles.eyebrow, { color: theme.label }]}>Management</Text>
            <Text style={[styles.title, { color: theme.title }]}>Kompleks</Text>
            <Text style={[styles.subtitle, { color: theme.subtitle }]}>Kompleks siyahısı, yarat / elave et / sil</Text>

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
          <TextInput
            value={search}
            onChangeText={onSearchChange}
            placeholder="Kompleks adi ile axtar"
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
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.primaryBtnBg },
                pressed ? styles.pressed : null,
              ]}
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
              {/* <Text style={[styles.actionButtonText, { color: theme.ghostBtnText }]}>Sifirla</Text> */}
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
  },
  body: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    overflow: 'hidden',
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
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 8,
  },
  searchGroup: {
    gap: 8,
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
