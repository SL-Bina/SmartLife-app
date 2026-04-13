import { getEntityId, toRecord } from '../../../../components/management/management-utils';

import { EntityItem, PropertyFormState } from './types';

export const asText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

export const normalizeDateTime = (value: unknown): string => {
  const raw = asText(value).trim();
  if (!raw) return '-';

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat('az-AZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};

export const pickMeta = (item: EntityItem | null): EntityItem => {
  if (!item) {
    return {};
  }

  return toRecord(item.meta);
};

export const getPropertyName = (item: EntityItem): string => {
  const name = asText(item.name).trim();
  if (name.length > 0) {
    return name;
  }

  const apartmentNumber = asText(item.apartment_number).trim() || asText(pickMeta(item).apartment_number).trim();
  if (apartmentNumber.length > 0) {
    return `Menzil ${apartmentNumber}`;
  }

  const id = getEntityId(item);
  return id === null ? 'Adsiz menzil' : `Menzil #${id}`;
};

export const getPropertySecondary = (item: EntityItem): string => {
  const area = asText(item.area).trim() || asText(pickMeta(item).area).trim();
  if (area.length > 0) {
    return `${area} m2`;
  }

  const blockId = asText(item.block_id).trim();
  if (blockId.length > 0) {
    return `Blok #${blockId}`;
  }

  return 'Elave melumat yoxdur';
};

export const statusToLabel = (value: unknown): string => {
  const normalized = asText(value).trim().toLowerCase();
  return normalized === 'inactive' || normalized === '0' ? 'Passiv' : 'Aktiv';
};

export const buildPayload = (form: PropertyFormState): Record<string, unknown> => {
  const parsedBlockId = Number(form.blockId.trim());
  const parsedArea = Number(form.area.trim());

  return {
    name: form.name.trim(),
    block_id: Number.isFinite(parsedBlockId) ? parsedBlockId : form.blockId.trim(),
    apartment_number: form.apartmentNumber.trim(),
    area: Number.isFinite(parsedArea) ? parsedArea : form.area.trim(),
    status: form.status === 'inactive' ? 0 : 1,
  };
};
