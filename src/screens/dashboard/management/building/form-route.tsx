import React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getEntityId, toErrorMessage } from '../../../../components/management/management-utils';
import { useThemeMode } from '../../../../hooks/use-theme';
import { buildingsAPI } from '../../../../services/management';
import { BuildingFormScreen } from './components/BuildingFormScreen';
import { buildingStyles as styles } from './styles';
import { EMPTY_FORM, EntityItem, BuildingFormState } from './types';
import { buildPayload } from './utils';

type FormRouteParams = {
  editingItem?: EntityItem;
};

const mapItemToForm = (item: EntityItem): BuildingFormState => {
  const meta = (item.meta && typeof item.meta === 'object' && !Array.isArray(item.meta))
    ? (item.meta as Record<string, unknown>)
    : {};
  const statusRaw = String(item.status).trim().toLowerCase();
  const normalizedStatus = statusRaw === 'inactive' || statusRaw === '0' ? 'inactive' : 'active';

  return {
    name: typeof item.name === 'string' ? item.name : '',
    complexId:
      typeof item.complex_id === 'string' || typeof item.complex_id === 'number'
        ? String(item.complex_id)
        : '',
    address: typeof item.address === 'string' ? item.address : (typeof meta.address === 'string' ? meta.address : ''),
    status: normalizedStatus,
  };
};

export default function ManagementBuildingFormRouteScreen() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const editingItem = (route.params as FormRouteParams | undefined)?.editingItem ?? null;

  const [submitting, setSubmitting] = React.useState(false);
  const [formState, setFormState] = React.useState<BuildingFormState>(
    editingItem ? mapItemToForm(editingItem) : EMPTY_FORM,
  );

  const onSubmit = React.useCallback(async () => {
    const name = formState.name.trim();
    if (name.length === 0) {
      Alert.alert('Xeta', 'Bina adi daxil edilmelidir');
      return;
    }

    if (formState.complexId.trim().length === 0) {
      Alert.alert('Xeta', 'Complex ID daxil edilmelidir');
      return;
    }

    if (!Number.isFinite(Number(formState.complexId.trim()))) {
      Alert.alert('Xeta', 'Complex ID reqem olmalidir');
      return;
    }

    const payload = buildPayload(formState);
    const editingId = editingItem ? getEntityId(editingItem) : null;

    try {
      setSubmitting(true);

      if (editingItem && editingId !== null) {
        await buildingsAPI.update(editingId, payload);
      } else {
        await buildingsAPI.add(payload);
      }

      navigation.goBack();
    } catch (submitError) {
      Alert.alert('Xeta', toErrorMessage(submitError, 'Bina yadda saxlanmadi'));
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, formState, navigation]);

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
      <BuildingFormScreen
        isDark={isDark}
        editingItem={editingItem}
        formState={formState}
        submitting={submitting}
        onChange={(patch: Partial<BuildingFormState>) => {
          setFormState(prev => ({ ...prev, ...patch }));
        }}
        onClose={() => navigation.goBack()}
        onSubmit={() => {
          void onSubmit();
        }}
      />

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
