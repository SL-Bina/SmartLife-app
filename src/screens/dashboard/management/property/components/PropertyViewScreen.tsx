import React from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, BadgeCheck, Banknote, Building2, CalendarDays, FilePenLine, Hash, House, ListChecks, ReceiptText, Ruler, Trash2 } from 'lucide-react-native';

import { getValueByPath } from '../../../../../components/management/management-utils';
import { propertyStyles as styles } from '../styles';
import { EntityItem } from '../types';
import { asText, getPropertyName, normalizeDateTime, statusToLabel } from '../utils';

type PropertyViewScreenProps = {
  isDark: boolean;
  item: EntityItem | null;
  onClose: () => void;
  onEdit: (item: EntityItem) => void;
  onInvoices: (item: EntityItem) => void;
  onServiceFees: (item: EntityItem) => void;
  onAddBalance: (item: EntityItem) => void;
  onDelete: (item: EntityItem) => void;
};

type ViewRow = {
  key: string;
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

export function PropertyViewScreen({ isDark, item, onClose, onEdit, onInvoices, onServiceFees, onAddBalance, onDelete }: PropertyViewScreenProps) {
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

  const apartmentNumber =
    asText(item?.apartment_number).trim() ||
    asText(getValueByPath(item, 'meta.apartment_number')).trim() ||
    '-';
  const floorNumber =
    asText(item?.floor_number).trim() ||
    asText(getValueByPath(item, 'meta.floor_number')).trim() ||
    '-';
  const areaValue =
    asText(item?.area).trim() ||
    asText(getValueByPath(item, 'meta.area')).trim() ||
    '-';
  const blockId = asText(item?.block_id).trim() || asText(getValueByPath(item, 'sub_data.block.id')).trim() || '-';

  const mtkName =
    asText(getValueByPath(item, 'sub_data.mtk.name')).trim() ||
    asText(getValueByPath(item, 'meta.mtk_name')).trim() ||
    '-';
  const complexName =
    asText(getValueByPath(item, 'sub_data.complex.name')).trim() ||
    asText(getValueByPath(item, 'complex.name')).trim() ||
    asText(getValueByPath(item, 'complex_name')).trim() ||
    asText(getValueByPath(item, 'meta.complex_name')).trim() ||
    '-';
  const buildingName =
    asText(getValueByPath(item, 'sub_data.building.name')).trim() ||
    asText(getValueByPath(item, 'building.name')).trim() ||
    asText(getValueByPath(item, 'building_name')).trim() ||
    asText(getValueByPath(item, 'meta.building_name')).trim() ||
    '-';
  const blockName =
    asText(getValueByPath(item, 'sub_data.block.name')).trim() ||
    asText(getValueByPath(item, 'block.name')).trim() ||
    asText(getValueByPath(item, 'block_name')).trim() ||
    asText(getValueByPath(item, 'meta.block_name')).trim() ||
    '-';
  const balanceRaw =
    asText(item?.balance).trim() ||
    asText(getValueByPath(item, 'meta.balance')).trim() ||
    asText(getValueByPath(item, 'meta.current_balance')).trim() ||
    asText(getValueByPath(item, 'sub_data.balance')).trim() ||
    asText(getValueByPath(item, 'sub_data.property.balance')).trim() ||
    '';
  const parsedBalance = Number(balanceRaw.replace(',', '.'));
  const balanceText = balanceRaw.length > 0
    ? Number.isFinite(parsedBalance)
      ? `${parsedBalance.toFixed(2)} AZN`
      : balanceRaw
    : '-';

  const identityRows: ViewRow[] = [
    { key: 'name', label: 'Ad', value: item ? getPropertyName(item) : '-', icon: House },
    { key: 'status', label: 'Status', value: statusLabel, icon: BadgeCheck },
    { key: 'created', label: 'Yaradilma tarixi', value: createdAt, icon: CalendarDays },
  ];

  const detailRows: ViewRow[] = [
    { key: 'apartment_number', label: 'Menzil no', value: apartmentNumber, icon: Hash },
    { key: 'floor_number', label: 'Mertebe', value: floorNumber, icon: Building2 },
    { key: 'area', label: 'Sahe', value: areaValue !== '-' ? `${areaValue} m2` : '-', icon: Ruler },
    { key: 'block_id', label: 'Blok ID', value: blockId, icon: Building2 },
  ];

  const relationRows: ViewRow[] = [
    {
      key: 'mtk_name',
      label: 'MTK',
      value: mtkName,
      icon: Building2,
    },
    {
      key: 'block_name',
      label: 'Blok',
      value: blockName,
      icon: Building2,
    },
    {
      key: 'building_name',
      label: 'Bina',
      value: buildingName,
      icon: Building2,
    },
    {
      key: 'complex_name',
      label: 'Complex',
      value: complexName,
      icon: Building2,
    },
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
                  <House size={17} color={isDark ? '#7dd3fc' : '#0369a1'} strokeWidth={2.2} />
                </View>

                <View style={styles.detailHeaderTextWrap}>
                  <Text style={[styles.detailHeaderTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                    Menzil melumatlari
                  </Text>
                  <Text style={[styles.detailHeaderSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    {item ? getPropertyName(item) : '-'}
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
            <Text style={[styles.viewSectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>Balans</Text>

            <View style={[styles.detailBalanceCard, isDark ? styles.detailBalanceCardDark : styles.detailBalanceCardLight]}>
              <View style={styles.detailBalanceRow}>
                <View style={[styles.detailBalanceIconWrap, isDark ? styles.detailBalanceIconWrapDark : styles.detailBalanceIconWrapLight]}>
                  <Banknote size={18} color={isDark ? '#86efac' : '#15803d'} strokeWidth={2.2} />
                </View>

                <View style={styles.detailBalanceTextWrap}>
                  <Text style={[styles.detailBalanceLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    Cari menzil balansi
                  </Text>
                  <Text style={[styles.detailBalanceValue, isDark ? styles.detailBalanceValueDark : styles.detailBalanceValueLight]}>
                    {balanceText}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  if (item) {
                    onAddBalance(item);
                  }
                }}
                style={[styles.screenActionButton, styles.screenActionSuccessButton]}
              >
                <Banknote size={14} color="#ffffff" strokeWidth={2.3} />
                <Text style={styles.screenActionPrimaryText}>Balansi artir</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.viewSectionCard, isDark ? styles.viewSectionCardDark : styles.viewSectionCardLight]}>
            <Text style={[styles.viewSectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>Elaqeler</Text>
            {relationRows.map(row => (
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

            <View style={[styles.screenActionsRow, styles.screenActionsRowCompact]}>
              <Pressable
                onPress={onClose}
                style={[
                  styles.screenActionButton,
                  styles.screenActionBackButton,
                  isDark ? styles.screenActionBackButtonDark : styles.screenActionBackButtonLight,
                ]}
              >
                <ArrowLeft size={14} color={isDark ? '#e4e4e7' : '#334155'} strokeWidth={2.5} />
                <Text style={[styles.screenActionGhostText, isDark && styles.screenActionGhostTextDark]}>Geri</Text>
              </Pressable>
            </View>

            <View style={styles.detailActionSubRow}>
            <Pressable
              onPress={() => {
                if (item) {
                  onEdit(item);
                }
              }}
              style={[styles.screenActionButton, styles.screenActionPrimaryButton]}
            >
              <FilePenLine size={14} color="#ffffff" strokeWidth={2.3} />
              <Text style={styles.screenActionPrimaryText}>Duzelis et</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (item) {
                  onInvoices(item);
                }
              }}
              style={[styles.screenActionButton, styles.screenActionInfoButton]}
            >
              <ReceiptText size={14} color="#ffffff" strokeWidth={2.3} />
              <Text style={styles.screenActionPrimaryText}>Fakturalar</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (item) {
                  onServiceFees(item);
                }
              }}
              style={[styles.screenActionButton, styles.screenActionInfoButton]}
            >
              <ListChecks size={14} color="#ffffff" strokeWidth={2.3} />
              <Text style={styles.screenActionPrimaryText}>Servis haqqilari</Text>
            </Pressable>

            
            </View>

            <View style={[styles.screenActionsRow, styles.screenActionsRowCompact]}>
            <Pressable
              onPress={() => {
                if (item) {
                  onDelete(item);
                }
              }}
              style={[styles.screenActionButton, styles.screenActionDangerButton, styles.screenActionWide]}
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
