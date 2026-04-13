import { getEntityId, toRecord } from '../../../../components/management/management-utils';

import { EntityItem, ResidentFormState } from './types';

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

export const getResidentName = (item: EntityItem): string => {
  const first = asText(item.name).trim();
  const last = asText(item.surname).trim();
  const full = `${first} ${last}`.trim();

  if (full.length > 0) {
    return full;
  }

  const id = getEntityId(item);
  return id === null ? 'Adsiz sakin' : `Sakin #${id}`;
};

export const getResidentSecondary = (item: EntityItem): string => {
  const phone = asText(item.phone).trim();
  if (phone.length > 0) {
    return phone;
  }

  const email = asText(item.email).trim();
  if (email.length > 0) {
    return email;
  }

  return 'Elaqe melumati yoxdur';
};

export const statusToLabel = (value: unknown): string => {
  const normalized = asText(value).trim().toLowerCase();
  return normalized === 'inactive' || normalized === '0' ? 'Passiv' : 'Aktiv';
};

export const typeToLabel = (value: unknown): string => {
  const normalized = asText(value).trim().toLowerCase();
  if (normalized === 'tenant') return 'Icareci';
  return 'Mulkedar';
};

export const genderToLabel = (value: unknown): string => {
  const normalized = asText(value).trim().toLowerCase();
  if (normalized === 'male') return 'Kisi';
  if (normalized === 'female') return 'Qadin';
  return '-';
};

export const buildPayload = (form: ResidentFormState): Record<string, unknown> => {
  const meta: Record<string, unknown> = {};

  if (form.fatherName.trim().length > 0) {
    meta.father_name = form.fatherName.trim();
  }
  if (form.personalCode.trim().length > 0) {
    meta.personal_code = form.personalCode.trim();
  }
  if (form.birthDate.trim().length > 0) {
    meta.birth_date = form.birthDate.trim();
  }
  if (form.gender.trim().length > 0) {
    meta.gender = form.gender;
  }

  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    surname: form.surname.trim(),
    type: form.type,
    email: form.email.trim(),
    phone: form.phone.trim(),
    status: form.status,
  };

  if (Object.keys(meta).length > 0) {
    payload.meta = meta;
  }

  return payload;
};
