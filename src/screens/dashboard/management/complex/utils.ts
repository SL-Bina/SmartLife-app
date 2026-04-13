import { getEntityId, toRecord } from '../../../../components/management/management-utils';

import { EntityItem, ComplexFormState } from './types';

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

export const getComplexName = (item: EntityItem): string => {
  const name = asText(item.name).trim();
  if (name.length > 0) {
    return name;
  }

  const id = getEntityId(item);
  return id === null ? 'Adsiz Kompleks' : `Kompleks #${id}`;
};

export const getComplexSecondary = (item: EntityItem): string => {
  const meta = pickMeta(item);
  const candidates = [meta.address, meta.phone, meta.email, meta.website, meta.desc];

  for (const candidate of candidates) {
    const text = asText(candidate).trim();
    if (text.length > 0) {
      return text;
    }
  }

  return 'Elave melumat yoxdur';
};

export const statusToLabel = (value: unknown): string => {
  return asText(value).toLowerCase() === 'inactive' ? 'Passiv' : 'Aktiv';
};

export const buildPayload = (form: ComplexFormState): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    status: form.status,
    meta: {
      desc: form.description.trim(),
      address: form.address.trim(),
      color_code: form.colorCode.trim() || '#0ea5e9',
      phone: form.phone.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
    },
  };

  const lat = Number(form.lat);
  if (Number.isFinite(lat)) {
    (payload.meta as Record<string, unknown>).lat = lat;
  }

  const lng = Number(form.lng);
  if (Number.isFinite(lng)) {
    (payload.meta as Record<string, unknown>).lng = lng;
  }

  return payload;
};
