import React from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, BadgeCheck, CalendarDays, Hash, Home, Mail, Phone, Trash2, User, UserRoundCheck, UserRoundPen } from 'lucide-react-native';

import { getValueByPath } from '../../../../../components/management/management-utils';
import { residentStyles as styles } from '../styles';
import { EntityItem } from '../types';
import { asText, genderToLabel, getResidentName, normalizeDateTime, pickMeta, statusToLabel, typeToLabel } from '../utils';

type ResidentViewScreenProps = {
  isDark: boolean;
  item: EntityItem | null;
  onProperties: (item: EntityItem) => void;
  onClose: () => void;
  onEdit: (item: EntityItem) => void;
  onDelete: (item: EntityItem) => void;
};

type ViewRow = {
  key: string;
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

export function ResidentViewScreen({
  isDark,
  item,
  onProperties,
  onClose,
  onEdit,
  onDelete,
}: ResidentViewScreenProps) {
  const entryAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const entry = Animated.timing(entryAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    });
    entry.start();

    return () => entry.stop();
  }, [entryAnim]);

  const createdAt = normalizeDateTime(getValueByPath(item, 'created_at'));
  const statusLabel = statusToLabel(item?.status);
  const isStatusActive = statusLabel !== 'Passiv';
  const meta = pickMeta(item);

  const identityRows: ViewRow[] = [
    { key: 'name', label: 'Ad soyad', value: item ? getResidentName(item) : '-', icon: User },
    { key: 'type', label: 'Nov', value: typeToLabel(item?.type), icon: UserRoundCheck },
    { key: 'status', label: 'Status', value: statusLabel, icon: BadgeCheck },
    { key: 'created', label: 'Yaradilma tarixi', value: createdAt, icon: CalendarDays },
  ];

  const contactRows: ViewRow[] = [
    { key: 'phone', label: 'Telefon', value: asText(item?.phone) || '-', icon: Phone },
    { key: 'email', label: 'Email', value: asText(item?.email) || '-', icon: Mail },
  ];

  const detailRows: ViewRow[] = [
    { key: 'father_name', label: 'Ata adi', value: asText(meta.father_name) || '-', icon: User },
    { key: 'personal_code', label: 'FIN kod', value: asText(meta.personal_code) || '-', icon: Hash },
    { key: 'birth_date', label: 'Dogum tarixi', value: asText(meta.birth_date) || '-', icon: CalendarDays },
    { key: 'gender', label: 'Cins', value: genderToLabel(meta.gender), icon: UserRoundPen },
  ];

  return (
    <Animated.View
      style={[
        styles.viewScreenContainer,
        isDark ? styles.viewScreenContainerDark : styles.viewScreenContainerLight,
        styles.detailEntryContainer,
        {
          opacity: entryAnim,
          transform: [{ translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        },
      ]}
    >
      <View style={styles.viewScreenHeader}>
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
        <ScrollView style={styles.modalScroll} contentContainerStyle={[styles.modalScrollContent, styles.detailScreenScrollContent]}>
          <View style={styles.detailHeroBlock}>
            <View style={[styles.detailHeaderCard, isDark ? styles.detailHeaderCardDark : styles.detailHeaderCardLight]}>
              <View style={styles.detailHeaderRow}>
                <View style={[styles.detailHeaderIconWrap, isDark ? styles.detailHeaderIconWrapDark : styles.detailHeaderIconWrapLight]}>
                  <User size={17} color={isDark ? '#7dd3fc' : '#0369a1'} strokeWidth={2.2} />
                </View>

                <View style={styles.detailHeaderTextWrap}>
                  <Text style={[styles.detailHeaderTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                    Sakin melumatlari
                  </Text>
                  <Text style={[styles.detailHeaderSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    {item ? getResidentName(item) : '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailHeaderMetaRow}>
                <View style={[styles.detailHeaderBadge, isStatusActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                  <BadgeCheck size={13} color={isStatusActive ? '#15803d' : '#b91c1c'} strokeWidth={2.2} />
                  <Text style={[styles.detailHeaderBadgeText, isStatusActive ? styles.statusTextActive : styles.statusTextInactive]}>
                    {statusLabel}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.viewSectionCard, isDark ? styles.viewSectionCardDark : styles.viewSectionCardLight]}>
            <Text style={[styles.viewSectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>Esas melumat</Text>
            {identityRows.map(row => (
              <View key={row.key} style={[styles.viewInfoRow, styles.viewInfoRowModern]}>
                <View style={[styles.viewInfoIconWrap, isDark ? styles.viewInfoIconWrapDark : styles.viewInfoIconWrapLight]}>
                  <row.icon size={15} color={isDark ? '#a1a1aa' : '#475569'} strokeWidth={2.1} />
                </View>
                <View style={styles.viewInfoContent}>
                  <Text style={[styles.viewInfoLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>{row.label}</Text>
                  <Text style={[styles.viewInfoValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.viewSectionCard, isDark ? styles.viewSectionCardDark : styles.viewSectionCardLight]}>
            <Text style={[styles.viewSectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>Elaqe</Text>
            {contactRows.map(row => (
              <View key={row.key} style={[styles.viewInfoRow, styles.viewInfoRowModern]}>
                <View style={[styles.viewInfoIconWrap, isDark ? styles.viewInfoIconWrapDark : styles.viewInfoIconWrapLight]}>
                  <row.icon size={15} color={isDark ? '#a1a1aa' : '#475569'} strokeWidth={2.1} />
                </View>
                <View style={styles.viewInfoContent}>
                  <Text style={[styles.viewInfoLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>{row.label}</Text>
                  <Text style={[styles.viewInfoValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.viewSectionCard, isDark ? styles.viewSectionCardDark : styles.viewSectionCardLight]}>
            <Text style={[styles.viewSectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>Detallar</Text>
            {detailRows.map(row => (
              <View key={row.key} style={[styles.viewInfoRow, styles.viewInfoRowModern]}>
                <View style={[styles.viewInfoIconWrap, isDark ? styles.viewInfoIconWrapDark : styles.viewInfoIconWrapLight]}>
                  <row.icon size={15} color={isDark ? '#a1a1aa' : '#475569'} strokeWidth={2.1} />
                </View>
                <View style={styles.viewInfoContent}>
                  <Text style={[styles.viewInfoLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>{row.label}</Text>
                  <Text style={[styles.viewInfoValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.detailActionPanel, isDark ? styles.detailActionPanelDark : styles.detailActionPanelLight]}>
            <Text style={[styles.detailActionPanelTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>Emeliyyatlar</Text>

            <View style={styles.detailActionSubRow}>
              <Pressable
                onPress={() => {
                  if (item) {
                    onProperties(item);
                  }
                }}
                style={[styles.screenActionButton, styles.screenActionInfoButton]}
              >
                <Home size={14} color="#ffffff" strokeWidth={2.3} />
                <Text style={styles.screenActionPrimaryText}>Menziller</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (item) {
                    onEdit(item);
                  }
                }}
                style={[styles.screenActionButton, styles.screenActionPrimaryButton]}
              >
                <UserRoundPen size={14} color="#ffffff" strokeWidth={2.3} />
                <Text style={styles.screenActionPrimaryText}>Duzelis et</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (item) {
                    onDelete(item);
                  }
                }}
                style={[styles.screenActionButton, styles.screenActionDangerButton]}
              >
                <Trash2 size={14} color="#ffffff" strokeWidth={2.3} />
                <Text style={styles.screenActionPrimaryText}>Sil</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Animated.View>
  );
}
