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
import { mtkAPI } from '../../../../services/management';
import { MtkViewScreen } from './components/MtkViewScreen';
import { mtkStyles as styles } from './styles';
import { EntityItem } from './types';

type ViewRouteParams = {
  item: EntityItem;
};

export default function ManagementMtkViewRouteScreen() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const initialItem = (route.params as ViewRouteParams | undefined)?.item ?? null;

  const [item, setItem] = React.useState<EntityItem | null>(initialItem);
  const [loading, setLoading] = React.useState(Boolean(initialItem));
  const [submitting, setSubmitting] = React.useState(false);

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
          const response = await mtkAPI.getById(id);
          const detail = extractItem(response);
          if (isMounted) {
            setItem({ ...initialItem, ...detail });
          }
        } catch (loadError) {
          if (isMounted) {
            Alert.alert('Xeta', toErrorMessage(loadError, 'MTK detallari yuklenmedi'));
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
      Alert.alert('Xeta', 'MTK ID tapilmadi');
      return;
    }

    Alert.alert('Silme tesdiqi', 'Secilen MTK silinsin?', [
      { text: 'Xeyr', style: 'cancel' },
      {
        text: 'Beli',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              setSubmitting(true);
              await mtkAPI.delete(id);
              navigation.goBack();
            } catch (deleteError) {
              Alert.alert('Xeta', toErrorMessage(deleteError, 'MTK silinmedi'));
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
        <MtkViewScreen
          isDark={isDark}
          item={item}
          onClose={() => navigation.goBack()}
          onEdit={entry => {
            navigation.push('ManagementMtkForm', { editingItem: entry });
          }}
          onDelete={onDelete}
        />
      ) : (
        <View style={styles.centerStateWrap}>
          <Text style={[styles.emptyText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            MTK melumati tapilmadi
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
