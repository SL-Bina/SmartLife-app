import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { managementStyles as styles } from '../management-styles';
import { DetailRow } from '../management-types';

type ManagementDetailsModalProps = {
  visible: boolean;
  isDark: boolean;
  entityLabel: string;
  detailsRows: DetailRow[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ManagementDetailsModal({
  visible,
  isDark,
  entityLabel,
  detailsRows,
  onClose,
  onEdit,
  onDelete,
}: ManagementDetailsModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.detailsPanel, isDark ? styles.modalPanelDark : styles.modalPanelLight]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalEyebrow, isDark ? styles.textAccentDark : styles.textAccentLight]}>
                Detailed View
              </Text>
              <Text style={[styles.modalTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                {entityLabel} detalları
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={[styles.closeIconButton, isDark ? styles.closeIconButtonDark : styles.closeIconButtonLight]}
            >
              <Text style={[styles.closeIconText, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                ✕
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {detailsRows.length === 0 ? (
              <View style={[styles.emptyDetailsCard, isDark ? styles.emptyDetailsCardDark : styles.emptyDetailsCardLight]}>
                <Text style={[styles.emptyDetailsText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  Detal məlumat tapılmadı.
                </Text>
              </View>
            ) : (
              <View style={styles.detailsGrid}>
                {detailsRows.map(row => (
                  <View
                    key={row.key}
                    style={[
                      styles.detailRowCard,
                      isDark ? styles.detailRowCardDark : styles.detailRowCardLight,
                      row.depth > 0 ? { marginLeft: Math.min(row.depth * 10, 30) } : null,
                    ]}
                  >
                    <Text style={[styles.detailRowPath, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                      {row.path}
                    </Text>
                    <Text style={[styles.detailRowLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                      {row.label}
                    </Text>
                    <Text style={[styles.detailRowValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.detailsActionRow}>
              <Pressable onPress={onEdit} style={[styles.actionButton, styles.primaryButton]}>
                <Text style={styles.primaryButtonText}>Düzəliş et</Text>
              </Pressable>

              <Pressable onPress={onDelete} style={[styles.actionButton, styles.dangerButton]}>
                <Text style={styles.dangerButtonText}>Sil</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
