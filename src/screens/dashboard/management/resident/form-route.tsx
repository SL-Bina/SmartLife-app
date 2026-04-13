import React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getEntityId, toErrorMessage } from '../../../../components/management/management-utils';
import { useThemeMode } from '../../../../hooks/use-theme';
import { residentsAPI } from '../../../../services/management';
import { ResidentFormScreen } from './components/ResidentFormScreen';
import { residentStyles as styles } from './styles';
import { EMPTY_FORM, EntityItem, ResidentFormState } from './types';
import { asText, buildPayload, pickMeta } from './utils';

type FormRouteParams = {
  editingItem?: EntityItem;
};

const mapItemToForm = (item: EntityItem): ResidentFormState => {
  const meta = pickMeta(item);
  const statusRaw = asText(item.status).trim().toLowerCase();
  const normalizedStatus = statusRaw === 'inactive' || statusRaw === '0' ? 'inactive' : 'active';

  const rawType = asText(item.type).trim().toLowerCase();
  const normalizedType = rawType === 'tenant' ? 'tenant' : 'owner';

  const rawGender = asText(meta.gender).trim().toLowerCase();
  const normalizedGender = rawGender === 'male' || rawGender === 'female' ? rawGender : '';

  return {
    name: asText(item.name),
    surname: asText(item.surname),
    type: normalizedType,
    email: asText(item.email),
    phone: asText(item.phone),
    fatherName: asText(meta.father_name),
    personalCode: asText(meta.personal_code),
    birthDate: asText(meta.birth_date),
    gender: normalizedGender,
    status: normalizedStatus,
  };
};

export default function ManagementResidentFormRouteScreen() {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const editingItem = (route.params as FormRouteParams | undefined)?.editingItem ?? null;

  const [submitting, setSubmitting] = React.useState(false);
  const [formState, setFormState] = React.useState<ResidentFormState>(
    editingItem ? mapItemToForm(editingItem) : EMPTY_FORM,
  );

  const onSubmit = React.useCallback(async () => {
    if (formState.name.trim().length === 0) {
      Alert.alert('Xeta', 'Ad daxil edilmelidir');
      return;
    }

    if (formState.surname.trim().length === 0) {
      Alert.alert('Xeta', 'Soyad daxil edilmelidir');
      return;
    }

    const payload = buildPayload(formState);
    const editingId = editingItem ? getEntityId(editingItem) : null;

    try {
      setSubmitting(true);

      if (editingItem && editingId !== null) {
        await residentsAPI.update(editingId, payload);
      } else {
        await residentsAPI.add(payload);
      }

      navigation.goBack();
    } catch (submitError) {
      Alert.alert('Xeta', toErrorMessage(submitError, 'Sakin yadda saxlanmadi'));
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
      <ResidentFormScreen
        isDark={isDark}
        editingItem={editingItem}
        formState={formState}
        submitting={submitting}
        onChange={(patch: Partial<ResidentFormState>) => {
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
