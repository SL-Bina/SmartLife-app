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
  extraContent?: React.ReactNode;
};

export function ManagementDetailsModal({
  visible,
  isDark,
  entityLabel,
  detailsRows,
  onClose,
  onEdit,
  onDelete,
  extraContent,
}: ManagementDetailsModalProps) {
  const detailCount = detailsRows.length;
  const simplifiedRows = React.useMemo(() => {
    const primitives = detailsRows.filter(
      row => !row.value.startsWith('Obyekt (') && !row.value.startsWith('Array ('),
    );

    const source = primitives.length > 0 ? primitives : detailsRows;

    return source.map(row => {
      const pathParts = row.path.split('.').filter(Boolean);
      const lastPathPart = pathParts[pathParts.length - 1] || row.label;
      const compactLabel = lastPathPart
        .replace(/\[\d+\]/g, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
        .trim();

      const isLong = row.value.length > 42 || /desc|address|website|meta/i.test(row.path);

      return {
        ...row,
        compactLabel: compactLabel.length > 0 ? compactLabel : row.label,
        isLong,
      };
    });
  }, [detailsRows]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.detailsPanel, isDark ? styles.modalPanelDark : styles.modalPanelLight]}>
          <View style={styles.modalHeader}>
            <View style={styles.detailsTitleWrap}>
              <Text style={[styles.modalEyebrow, isDark ? styles.textAccentDark : styles.textAccentLight]}>
                Detailed View
              </Text>
              <Text style={[styles.modalTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                {entityLabel} detalları
              </Text>
              <Text style={[styles.detailsSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Məlumatları daha aydın görmək üçün aşağıdakı strukturdan istifadə edin.
              </Text>
            </View>

            <View style={styles.detailsHeaderActions}>
              <View
                style={[
                  styles.detailsCountBadge,
                  isDark ? styles.detailsCountBadgeDark : styles.detailsCountBadgeLight,
                ]}
              >
                <Text style={[styles.detailsCountText, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                  {detailCount}
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
          </View>

          <View style={styles.detailsBody}>
            <ScrollView
              style={[styles.modalScroll, styles.detailsScroll]}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {simplifiedRows.length === 0 ? (
                <View style={[styles.emptyDetailsCard, isDark ? styles.emptyDetailsCardDark : styles.emptyDetailsCardLight]}>
                  <Text style={[styles.emptyDetailsText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    Detal məlumat tapılmadı.
                  </Text>
                </View>
              ) : (
                <View style={styles.detailCardsWrap}>
                  {simplifiedRows.map(row => (
                    <View
                      key={row.key}
                      style={[
                        styles.detailCard,
                        row.isLong ? styles.detailCardFull : styles.detailCardHalf,
                        isDark ? styles.detailRowCardDark : styles.detailRowCardLight,
                      ]}
                    >
                      <Text style={[styles.detailCardLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                        {row.compactLabel}
                      </Text>

                      <Text selectable style={[styles.detailCardValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                        {row.value}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {extraContent ? extraContent : null}
            </ScrollView>
          </View>

          <View style={[styles.detailsFooter, isDark ? styles.detailsFooterDark : styles.detailsFooterLight]}>
            <Pressable onPress={onClose} style={[styles.footerButton, styles.footerGhostButton]}>
              <Text style={styles.footerGhostText}>Bağla</Text>
            </Pressable>

            <Pressable onPress={onEdit} style={[styles.footerButton, styles.footerPrimaryButton]}>
              <Text style={styles.footerPrimaryText}>Düzəliş et</Text>
            </Pressable>

            <Pressable onPress={onDelete} style={[styles.footerButton, styles.footerDangerButton]}>
              <Text style={styles.footerPrimaryText}>Sil</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
