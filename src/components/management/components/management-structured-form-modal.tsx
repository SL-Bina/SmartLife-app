import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import Config from '../../../Config';
import { managementStyles as styles } from '../management-styles';
import { CrudField, EntityItem } from '../management-types';
import { keyboardTypeForField } from '../management-utils';
import { ManagementMapPicker } from './management-map-picker';

type ManagementFormModalProps = {
  visible: boolean;
  isDark: boolean;
  entityLabel: string;
  fields: CrudField[];
  editingItem: EntityItem | null;
  formState: Record<string, string>;
  propertyIdInput: string;
  submitting: boolean;
  enablePropertyBinding: boolean;
  enableFieldReset?: boolean;
  canBindProperty: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onResetFields?: () => void;
  onFieldChange: (fieldKey: string, value: string) => void;
  onPropertyIdChange: (value: string) => void;
  onBind: () => void;
  onUnbind: () => void;
};

const STATUS_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: '#dcfce7', text: '#15803d' },
  inactive: { bg: '#fee2e2', text: '#b91c1c' },
};

export function ManagementFormModal({
  visible,
  isDark,
  entityLabel,
  fields,
  editingItem,
  formState,
  propertyIdInput,
  submitting,
  enablePropertyBinding,
  enableFieldReset = false,
  canBindProperty,
  onClose,
  onSubmit,
  onResetFields,
  onFieldChange,
  onPropertyIdChange,
  onBind,
  onUnbind,
}: ManagementFormModalProps) {
  const [mapPickerVisible, setMapPickerVisible] = React.useState(false);

  const latitudeField = React.useMemo(
    () =>
      fields.find(field => field.key === 'meta.lat') ??
      fields.find(field => field.key.endsWith('.lat')),
    [fields],
  );

  const longitudeField = React.useMemo(
    () =>
      fields.find(field => field.key === 'meta.lng') ??
      fields.find(field => field.key.endsWith('.lng')),
    [fields],
  );

  const latitudeValue = React.useMemo(() => {
    if (!latitudeField) {
      return undefined;
    }

    const parsed = Number(formState[latitudeField.key]);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [formState, latitudeField]);

  const longitudeValue = React.useMemo(() => {
    if (!longitudeField) {
      return undefined;
    }

    const parsed = Number(formState[longitudeField.key]);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [formState, longitudeField]);

  const regularFields = React.useMemo(() => {
    if (!latitudeField || !longitudeField) {
      return fields;
    }

    return fields.filter(
      field => field.key !== latitudeField.key && field.key !== longitudeField.key,
    );
  }, [fields, latitudeField, longitudeField]);

  const renderField = (field: CrudField) => {
    const value = formState[field.key] ?? '';

    if (field.type === 'select') {
      const options = field.options ?? [];

      return (
        <View style={styles.selectRow}>
          {options.map(option => {
            const active = value === option.value;
            const palette = STATUS_BADGE_COLORS[option.value] ?? {
              bg: '#dbeafe',
              text: '#1d4ed8',
            };

            return (
              <Pressable
                key={`${field.key}-${option.value}`}
                onPress={() => onFieldChange(field.key, option.value)}
                style={[
                  styles.selectChip,
                  active
                    ? { backgroundColor: palette.bg, borderColor: palette.text }
                    : isDark
                      ? styles.selectChipDark
                      : styles.selectChipLight,
                ]}
              >
                <Text
                  style={[
                    styles.selectChipText,
                    active
                      ? { color: palette.text }
                      : isDark
                        ? styles.selectChipTextDark
                        : styles.selectChipTextLight,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    if (field.type === 'color') {
      return (
        <View style={styles.colorRow}>
          <View
            style={[
              styles.colorPreview,
              { backgroundColor: value || '#94a3b8' },
            ]}
          />
          <TextInput
            value={value}
            onChangeText={nextValue => onFieldChange(field.key, nextValue)}
            placeholder={field.placeholder ?? '#237832'}
            placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
            style={[
              styles.formInput,
              styles.colorInput,
              isDark ? styles.formInputDark : styles.formInputLight,
            ]}
          />
        </View>
      );
    }

    return (
      <TextInput
        value={value}
        onChangeText={nextValue => onFieldChange(field.key, nextValue)}
        keyboardType={keyboardTypeForField(field.type)}
        multiline={Boolean(field.multiline)}
        placeholder={field.placeholder ?? `${field.label} daxil et`}
        placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
        style={[
          styles.formInput,
          field.multiline ? styles.formInputMultiline : null,
          isDark ? styles.formInputDark : styles.formInputLight,
        ]}
      />
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalPanel, isDark ? styles.modalPanelDark : styles.modalPanelLight]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalEyebrow, isDark ? styles.textAccentDark : styles.textAccentLight]}>
                {editingItem ? 'Update record' : 'Create record'}
              </Text>
              <Text style={[styles.modalTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                {editingItem ? `${entityLabel} yenilə` : `${entityLabel} əlavə et`}
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

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formGrid}>
              {regularFields.map(field => (
                <View key={field.key} style={styles.formBlock}>
                  <Text style={[styles.formLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    {field.label}
                    {field.required ? ' *' : ''}
                  </Text>
                  {renderField(field)}
                </View>
              ))}

              {latitudeField && longitudeField ? (
                <>
                  <View style={styles.latLngRow}>
                    <View style={styles.latLngColumn}>
                      <Text style={[styles.formLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                        {latitudeField.label}
                        {latitudeField.required ? ' *' : ''}
                      </Text>
                      <TextInput
                        value={formState[latitudeField.key] ?? ''}
                        onChangeText={nextValue => onFieldChange(latitudeField.key, nextValue)}
                        keyboardType={keyboardTypeForField(latitudeField.type)}
                        placeholder={latitudeField.placeholder ?? '40.4093'}
                        placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                        style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                      />
                    </View>

                    <View style={styles.latLngColumn}>
                      <Text style={[styles.formLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                        {longitudeField.label}
                        {longitudeField.required ? ' *' : ''}
                      </Text>
                      <TextInput
                        value={formState[longitudeField.key] ?? ''}
                        onChangeText={nextValue => onFieldChange(longitudeField.key, nextValue)}
                        keyboardType={keyboardTypeForField(longitudeField.type)}
                        placeholder={longitudeField.placeholder ?? '49.8671'}
                        placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                        style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                      />
                    </View>
                  </View>

                  <Pressable
                    onPress={() => setMapPickerVisible(true)}
                    style={[
                      styles.mapOpenButton,
                      isDark ? styles.mapOpenButtonDark : styles.mapOpenButtonLight,
                    ]}
                  >
                    <Text
                      style={[
                        styles.mapOpenButtonText,
                        isDark ? styles.mapOpenButtonTextDark : styles.mapOpenButtonTextLight,
                      ]}
                    >
                      Xəritədən seç
                    </Text>
                  </Pressable>
                </>
              ) : null}
            </View>

            {enablePropertyBinding && editingItem && canBindProperty ? (
              <View style={[styles.sectionCard, isDark ? styles.bindSectionDark : styles.bindSectionLight]}>
                <Text style={[styles.sectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                  Resident Property əməliyyatı
                </Text>

                <TextInput
                  value={propertyIdInput}
                  onChangeText={onPropertyIdChange}
                  keyboardType="numeric"
                  placeholder="Property ID"
                  placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                  style={[styles.formInput, isDark ? styles.formInputDark : styles.formInputLight]}
                />

                <View style={styles.inlineButtons}>
                  <Pressable onPress={onBind} style={[styles.actionButton, styles.primaryButton]}>
                    <Text style={styles.primaryButtonText}>Bind</Text>
                  </Pressable>

                  <Pressable onPress={onUnbind} style={[styles.actionButton, styles.dangerButton]}>
                    <Text style={styles.dangerButtonText}>Unbind</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable onPress={onClose} style={[styles.footerButton, styles.footerGhostButton]}>
              <Text style={styles.footerGhostText}>Bağla</Text>
            </Pressable>

            {enableFieldReset ? (
              <Pressable
                onPress={onResetFields}
                style={[styles.footerButton, styles.footerGhostButton]}
                disabled={submitting}
              >
                <Text style={styles.footerGhostText}>Sifirla</Text>
              </Pressable>
            ) : null}

            <Pressable onPress={onSubmit} style={[styles.footerButton, styles.footerPrimaryButton]}>
              <Text style={styles.footerPrimaryText}>{submitting ? 'Gözlə...' : 'Yadda saxla'}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {latitudeField && longitudeField ? (
        <ManagementMapPicker
          visible={mapPickerVisible}
          apiKey={Config.googleMapsApiKey}
          isDark={isDark}
          latitude={latitudeValue}
          longitude={longitudeValue}
          onClose={() => setMapPickerVisible(false)}
          onApply={(latitude, longitude) => {
            onFieldChange(latitudeField.key, latitude.toFixed(6));
            onFieldChange(longitudeField.key, longitude.toFixed(6));
            setMapPickerVisible(false);
          }}
        />
      ) : null}
    </Modal>
  );
}
