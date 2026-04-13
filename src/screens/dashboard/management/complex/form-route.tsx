import React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getEntityId, toErrorMessage } from '../../../../components/management/management-utils';
import { useThemeMode } from '../../../../hooks/use-theme';
import { complexesAPI } from '../../../../services/management';
import { ComplexFormScreen } from './components/ComplexFormScreen';
import { complexStyles as styles } from './styles';
import { EMPTY_FORM, EntityItem, ComplexFormState } from './types';
import { buildPayload } from './utils';

type FormRouteParams = {
  editingItem?: EntityItem;
};

const mapItemToForm = (item: EntityItem): ComplexFormState => {
  const meta = (item.meta && typeof item.meta === 'object' && !Array.isArray(item.meta))
    ? (item.meta as Record<string, unknown>)
    : {};

  return {
    name: typeof item.name === 'string' ? item.name : '',
    status: String(item.status).toLowerCase() === 'inactive' ? 'inactive' : 'active',
    description: typeof meta.desc === 'string' ? meta.desc : '',
    address: typeof meta.address === 'string' ? meta.address : '',
    colorCode: typeof meta.color_code === 'string' ? meta.color_code : '#0ea5e9',
    phone: typeof meta.phone === 'string' ? meta.phone : '',
    email: typeof meta.email === 'string' ? meta.email : '',
    website: typeof meta.website === 'string' ? meta.website : '',
    lat: typeof meta.lat === 'string' || typeof meta.lat === 'number' ? String(meta.lat) : '',
    lng: typeof meta.lng === 'string' || typeof meta.lng === 'number' ? String(meta.lng) : '',
  };
};

export default function ManagementComplexFormRouteScreen() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const editingItem = (route.params as FormRouteParams | undefined)?.editingItem ?? null;

  const [submitting, setSubmitting] = React.useState(false);
  const [formState, setFormState] = React.useState<ComplexFormState>(
    editingItem ? mapItemToForm(editingItem) : EMPTY_FORM,
  );

  const onSubmit = React.useCallback(async () => {
    const name = formState.name.trim();
    if (name.length === 0) {
      Alert.alert('Xeta', 'Kompleks adi daxil edilmelidir');
      return;
    }

    const payload = buildPayload(formState);
    const editingId = editingItem ? getEntityId(editingItem) : null;

    try {
      setSubmitting(true);

      if (editingItem && editingId !== null) {
        await complexesAPI.update(editingId, payload);
      } else {
        await complexesAPI.add(payload);
      }

      navigation.goBack();
    } catch (submitError) {
      Alert.alert('Xeta', toErrorMessage(submitError, 'Kompleks yadda saxlanmadi'));
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
      <ComplexFormScreen
        isDark={isDark}
        editingItem={editingItem}
        formState={formState}
        submitting={submitting}
        onChange={(patch: Partial<ComplexFormState>) => {
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
