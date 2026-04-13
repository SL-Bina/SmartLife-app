import React from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  extractItem,
  getEntityId,
  toErrorMessage,
} from '../../../../components/management/management-utils';
import { useThemeMode } from '../../../../hooks/use-theme';
import { financeInvoicesAPI, propertiesAPI } from '../../../../services/management';
import { PropertyViewScreen } from './components/PropertyViewScreen';
import { propertyStyles as styles } from './styles';
import { EntityItem } from './types';

type ViewRouteParams = {
  item: EntityItem;
};

export default function ManagementPropertyViewRouteScreen() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const initialItem = (route.params as ViewRouteParams | undefined)?.item ?? null;

  const [item, setItem] = React.useState<EntityItem | null>(initialItem);
  const [loading, setLoading] = React.useState(Boolean(initialItem));
  const [submitting, setSubmitting] = React.useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = React.useState(false);
  const [balanceAmount, setBalanceAmount] = React.useState('');
  const [addingBalance, setAddingBalance] = React.useState(false);

  const normalizeAmountInput = React.useCallback((value: string): string => {
    const normalized = String(value || '')
      .replace(/,/g, '.')
      .replace(/[^\d.]/g, '');

    const [intPart = '', ...decimalParts] = normalized.split('.');
    const decimalPart = decimalParts.join('').slice(0, 2);
    return decimalPart.length > 0 ? `${intPart}.${decimalPart}` : intPart;
  }, []);

  const closeBalanceModal = React.useCallback(() => {
    if (addingBalance) {
      return;
    }

    setBalanceModalVisible(false);
    setBalanceAmount('');
  }, [addingBalance]);

  const onBalanceTopup = React.useCallback(async () => {
    const target = item;
    const id = target ? getEntityId(target) : null;

    if (id === null) {
      Alert.alert('Xeta', 'Menzil ID tapilmadi');
      return;
    }

    const parsedAmount = Number(balanceAmount.replace(',', '.').trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Xeta', 'Duzgun mebleg daxil edin');
      return;
    }

    try {
      setAddingBalance(true);
      await financeInvoicesAPI.addBalanceInCash(id, parsedAmount, 'cash');

      const response = await propertiesAPI.getById(id);
      const detail = extractItem(response);
      setItem(prev => (prev ? { ...prev, ...detail } : detail));

      setBalanceModalVisible(false);
      setBalanceAmount('');
      Alert.alert('Ugurlu', 'Balans ugurla artirildi');
    } catch (topupError) {
      Alert.alert('Xeta', toErrorMessage(topupError, 'Balans artirma ugursuz oldu'));
    } finally {
      setAddingBalance(false);
    }
  }, [balanceAmount, item]);

  useFocusEffect(
    React.useCallback(() => {
      const id = initialItem ? getEntityId(initialItem) : null;

      if (initialItem === null || id === null) {
        setLoading(false);
        return undefined;
      }

      let isMounted = true;

      void (async () => {
        try {
          setLoading(true);
          const response = await propertiesAPI.getById(id);
          const detail = extractItem(response);
          if (isMounted) {
            setItem({ ...initialItem, ...detail });
          }
        } catch (loadError) {
          if (isMounted) {
            Alert.alert('Xeta', toErrorMessage(loadError, 'Menzil detallari yuklenmedi'));
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      })();

      return () => {
        isMounted = false;
      };
    }, [initialItem]),
  );

  const onDelete = React.useCallback((target: EntityItem) => {
    const id = getEntityId(target);
    if (id === null) {
      Alert.alert('Xeta', 'Menzil ID tapilmadi');
      return;
    }

    Alert.alert('Silme tesdiqi', 'Secilen menzil silinsin?', [
      { text: 'Xeyr', style: 'cancel' },
      {
        text: 'Beli',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              setSubmitting(true);
              await propertiesAPI.delete(id);
              navigation.goBack();
            } catch (deleteError) {
              Alert.alert('Xeta', toErrorMessage(deleteError, 'Menzil silinmedi'));
            } finally {
              setSubmitting(false);
            }
          })();
        },
      },
    ]);
  }, [navigation]);

  return (
    <View
      style={[
        styles.detailRouteRoot,
        isDark ? styles.detailRouteRootDark : styles.detailRouteRootLight,
        {
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {loading ? (
        <View style={styles.centerStateWrap}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : item ? (
        <PropertyViewScreen
          isDark={isDark}
          item={item}
          onClose={() => navigation.goBack()}
          onEdit={entry => {
            navigation.push('ManagementPropertyForm', { editingItem: entry });
          }}
          onInvoices={entry => {
            navigation.push('ManagementPropertyInvoices', { item: entry });
          }}
          onServiceFees={entry => {
            navigation.push('ManagementPropertyServiceFees', { item: entry });
          }}
          onAddBalance={() => {
            setBalanceAmount('');
            setBalanceModalVisible(true);
          }}
          onDelete={onDelete}
        />
      ) : (
        <View style={styles.centerStateWrap}>
          <Text style={[styles.emptyText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            Menzil melumati tapilmadi
          </Text>
        </View>
      )}

      {submitting ? (
        <View style={styles.submittingOverlay} pointerEvents="none">
          <View style={styles.submittingLoader}>
            <ActivityIndicator size="large" color="#0ea5e9" />
          </View>
        </View>
      ) : null}

      <Modal
        visible={balanceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeBalanceModal}
      >
        <View style={localStyles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeBalanceModal} />

          <View style={[localStyles.modalCard, isDark ? localStyles.modalCardDark : localStyles.modalCardLight]}>
            <Text style={[localStyles.modalTitle, isDark ? localStyles.modalTitleDark : localStyles.modalTitleLight]}>
              Balans artir
            </Text>

            <Text style={[localStyles.modalSubtitle, isDark ? localStyles.modalSubtitleDark : localStyles.modalSubtitleLight]}>
              {item ? String(item.name ?? item.apartment_number ?? 'Menzil') : 'Menzil'}
            </Text>

            <Text style={[localStyles.fieldLabel, isDark ? localStyles.fieldLabelDark : localStyles.fieldLabelLight]}>
              Mebleg
            </Text>
            <TextInput
              value={balanceAmount}
              onChangeText={value => setBalanceAmount(normalizeAmountInput(value))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              style={[localStyles.input, isDark ? localStyles.inputDark : localStyles.inputLight]}
            />

            <View style={localStyles.quickRow}>
              {[10, 20, 50, 100, 200].map(amount => (
                <Pressable
                  key={String(amount)}
                  onPress={() => setBalanceAmount(String(amount))}
                  style={[localStyles.quickChip, isDark ? localStyles.quickChipDark : localStyles.quickChipLight]}
                >
                  <Text style={[localStyles.quickChipText, isDark ? localStyles.quickChipTextDark : localStyles.quickChipTextLight]}>
                    +{amount}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={localStyles.actionsRow}>
              <Pressable
                onPress={closeBalanceModal}
                style={[localStyles.actionButton, localStyles.cancelButton]}
                disabled={addingBalance}
              >
                <Text style={localStyles.actionText}>Legv et</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void onBalanceTopup();
                }}
                style={[localStyles.actionButton, localStyles.submitButton, addingBalance ? localStyles.disabledButton : null]}
                disabled={addingBalance}
              >
                {addingBalance ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={localStyles.actionText}>Balansi artir</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  modalCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  modalCardDark: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'WorkSans-Bold',
  },
  modalTitleLight: {
    color: '#0f172a',
  },
  modalTitleDark: {
    color: '#f8fafc',
  },
  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  modalSubtitleLight: {
    color: '#334155',
  },
  modalSubtitleDark: {
    color: '#cbd5e1',
  },
  fieldLabel: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  fieldLabelLight: {
    color: '#334155',
  },
  fieldLabelDark: {
    color: '#cbd5e1',
  },
  input: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
  },
  inputLight: {
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  inputDark: {
    borderColor: '#3f3f46',
    backgroundColor: '#0b1220',
    color: '#f8fafc',
  },
  quickRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickChipLight: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  quickChipDark: {
    borderColor: '#3f3f46',
    backgroundColor: '#18181b',
  },
  quickChipText: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
  },
  quickChipTextLight: {
    color: '#334155',
  },
  quickChipTextDark: {
    color: '#cbd5e1',
  },
  actionsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#334155',
  },
  submitButton: {
    backgroundColor: '#0f766e',
  },
  disabledButton: {
    opacity: 0.7,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
});
