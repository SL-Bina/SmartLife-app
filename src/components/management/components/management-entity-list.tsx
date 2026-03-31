import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { managementStyles as styles } from '../management-styles';
import { CrudField, EntityItem } from '../management-types';
import {
  getCardPreviewData,
  getEntityId,
  getPrimaryText,
  getSecondaryText,
} from '../management-utils';

type ManagementEntityListProps = {
  isDark: boolean;
  loading: boolean;
  loadingMore?: boolean;
  items: EntityItem[];
  fields: CrudField[];
  emptyMessage: string;
  onView: (item: EntityItem) => void;
};

export function ManagementEntityList({
  isDark,
  loading,
  loadingMore = false,
  items,
  fields,
  emptyMessage,
  onView,
}: ManagementEntityListProps) {
  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.emptyStateCard, isDark ? styles.panelDark : styles.panelLight]}>
        <Text style={[styles.emptyStateTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
          Boş görünür
        </Text>
        <Text style={[styles.emptyStateText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.cardsList}>
      {items.map((item, index) => {
        const id = getEntityId(item);
        const previewData = getCardPreviewData(item, fields);

        return (
          <Pressable
            onPress={() => onView(item)}
            key={id === null ? `${index}` : String(id)}
            style={[styles.entityCard, isDark ? styles.panelDark : styles.panelLight]}
          >
            <View style={styles.entityCardTop}>
              <View style={styles.avatarBubble}>
                <Text style={styles.avatarText}>
                  {getPrimaryText(item).charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.entityMainContent}>
                <Text style={[styles.entityTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                  {getPrimaryText(item)}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[styles.entitySubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}
                >
                  {getSecondaryText(item)}
                </Text>
              </View>

              <View style={[styles.idPill, isDark ? styles.idPillDark : styles.idPillLight]}>
                <Text style={[styles.idPillText, isDark ? styles.idPillTextDark : styles.idPillTextLight]}>
                  {id ? `#${id}` : 'Qeyd'}
                </Text>
              </View>
            </View>

            <View style={styles.entityDivider} />

            {previewData.length > 0 ? (
              <View style={styles.previewGrid}>
                {previewData.map(meta => (
                  <View
                    key={`${meta.label}-${meta.value}`}
                    style={[styles.previewItem, isDark ? styles.previewItemDark : styles.previewItemLight]}
                  >
                    <Text style={[styles.previewLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                      {meta.label}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.previewValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}
                    >
                      {meta.value}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.cardHintRow}>
              <Text style={[styles.cardHintText, isDark ? styles.textAccentDark : styles.textAccentLight]}>
                Detalları aç
              </Text>
              <Text style={[styles.cardHintArrow, isDark ? styles.textAccentDark : styles.textAccentLight]}>›</Text>
            </View>
          </Pressable>
        );
      })}

      {loadingMore ? (
        <View style={styles.loadMoreFooter}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={[styles.loadMoreText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            Yüklənir...
          </Text>
        </View>
      ) : null}
    </View>
  );
}
