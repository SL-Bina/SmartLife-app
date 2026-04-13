import { getEntityId, toRecord } from '../../../../components/management/management-utils';

import { EntityItem, BlockFormState } from './types';

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

export const getBlockName = (item: EntityItem): string => {
  const name = asText(item.name).trim();
  if (name.length > 0) {
    return name;
  }

  const id = getEntityId(item);
  return id === null ? 'Adsiz blok' : `Blok #${id}`;
};

export const getBlockSecondary = (item: EntityItem): string => {
  const meta = pickMeta(item);
  const candidates = [item.description, meta.description, item.building_id];

  for (const candidate of candidates) {
    const text = asText(candidate).trim();
    if (text.length > 0) {
      return text;
    }
  }

  return 'Elave melumat yoxdur';
};

export const statusToLabel = (value: unknown): string => {
  const normalized = asText(value).trim().toLowerCase();
  return normalized === 'inactive' || normalized === '0' ? 'Passiv' : 'Aktiv';
};

export const buildPayload = (form: BlockFormState): Record<string, unknown> => {
  const parsedBuildingId = Number(form.buildingId.trim());

  return {
    name: form.name.trim(),
    building_id: Number.isFinite(parsedBuildingId) ? parsedBuildingId : form.buildingId.trim(),
    description: form.description.trim(),
    status: form.status === 'inactive' ? 0 : 1,
  };
};
