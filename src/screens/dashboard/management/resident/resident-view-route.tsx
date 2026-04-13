import React from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  extractItem,
  getEntityId,
  toErrorMessage,
} from '../../../../components/management/management-utils';
import { useThemeMode } from '../../../../hooks/use-theme';
import { residentsAPI } from '../../../../services/management';
import { ResidentViewScreen } from './components/ResidentViewScreen';
import { residentStyles as styles } from './styles';
import { EntityItem } from './types';

type ViewRouteParams = {
  item: EntityItem;
};

export default function ManagementResidentViewRouteScreen() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const initialItem = (route.params as ViewRouteParams | undefined)?.item ?? null;
  const residentId = React.useMemo(() => (initialItem ? getEntityId(initialItem) : null), [initialItem]);

  const [item, setItem] = React.useState<EntityItem | null>(initialItem);
  const [loading, setLoading] = React.useState(Boolean(initialItem));
  const [submitting, setSubmitting] = React.useState(false);

  const loadResidentDetail = React.useCallback(async (): Promise<boolean> => {
    if (residentId === null) {
      return false;
    }

    try {
      const response = await residentsAPI.getById(residentId);
      const detail = extractItem(response);
      setItem(prev => (prev ? { ...prev, ...detail } : { ...(initialItem ?? {}), ...detail }));
      return true;
    } catch (loadError) {
      Alert.alert('Xeta', toErrorMessage(loadError, 'Sakin detallari yuklenmedi'));
      return false;
    }
  }, [initialItem, residentId]);

  useFocusEffect(
    React.useCallback(() => {
      if (residentId === null) {
        setLoading(false);
        return undefined;
      }

      let isMounted = true;

      void (async () => {
        try {
          setLoading(true);
          const ok = await loadResidentDetail();
          if (!ok && isMounted) {
            setItem(initialItem);
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
    }, [initialItem, loadResidentDetail, residentId]),
  );

  const onDelete = React.useCallback((target: EntityItem) => {
    const id = getEntityId(target);
    if (id === null) {
      Alert.alert('Xeta', 'Sakin ID tapilmadi');
      return;
    }

    Alert.alert('Silme tesdiqi', 'Secilen sakin silinsin?', [
      { text: 'Xeyr', style: 'cancel' },
      {
        text: 'Beli',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              setSubmitting(true);
              await residentsAPI.delete(id);
              navigation.goBack();
            } catch (deleteError) {
              Alert.alert('Xeta', toErrorMessage(deleteError, 'Sakin silinmedi'));
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
        <ResidentViewScreen
          isDark={isDark}
          item={item}
          onProperties={entry => {
            navigation.push('ManagementResidentProperties', { item: entry });
          }}
          onClose={() => navigation.goBack()}
          onEdit={entry => {
            navigation.push('ManagementResidentForm', { editingItem: entry });
          }}
          onDelete={onDelete}
        />
      ) : (
        <View style={styles.centerStateWrap}>
          <Text style={[styles.emptyText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            Sakin melumati tapilmadi
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
    </View>
  );
}
