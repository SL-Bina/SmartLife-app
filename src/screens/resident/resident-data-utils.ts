import type { AuthUser } from '../../utils/auth';

type Dictionary = Record<string, unknown>;

export type ResidentListItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  amount?: string;
  status?: string;
};

export type ResidentPropertyOption = {
  id: string | number;
  name: string;
};

export const toRecord = (value: unknown): Dictionary => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Dictionary;
  }

  return {};
};

export const asString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
};

export const asNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

export const pickText = (...values: unknown[]): string => {
  for (const value of values) {
    const text = asString(value).trim();
    if (text.length > 0) {
      return text;
    }
  }

  return '';
};

export const extractList = <T = Dictionary>(payload: unknown): T[] => {
  const root = toRecord(payload);
  const first = root.data;
  const second = toRecord(first).data;
  const third = toRecord(second).data;

  const candidates = [payload, first, second, third, toRecord(first).items, toRecord(second).items];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }

  return [];
};

export const resolveResidentProperties = (user: AuthUser | null): Dictionary[] => {
  if (!user) {
    return [];
  }

  const direct = user.properties;
  if (Array.isArray(direct)) {
    return direct.map(item => toRecord(item));
  }

  const userData = toRecord(user.user_data);
  const fromUserData = userData.properties;
  if (Array.isArray(fromUserData)) {
    return fromUserData.map(item => toRecord(item));
  }

  const directRecord = toRecord(direct);
  if (Array.isArray(directRecord.data)) {
    return directRecord.data.map(item => toRecord(item));
  }

  return [];
};

export const resolveResidentPropertyOptions = (
  user: AuthUser | null,
): ResidentPropertyOption[] => {
  const source = resolveResidentProperties(user);
  const options: ResidentPropertyOption[] = [];
  const usedNames = new Set<string>();

  source.forEach((item, index) => {
    const id = item.id;
    if (typeof id !== 'number' && typeof id !== 'string') {
      return;
    }

    const meta = toRecord(item.meta);
    const subData = toRecord(item.sub_data);
    const apartmentNumber = pickText(meta.apartment_number, subData.apartment_number);
    const rawName = pickText(
      item.name,
      item.title,
      apartmentNumber,
      `Mənzil ${index + 1}`,
    );

    let uniqueName = rawName;
    if (usedNames.has(uniqueName)) {
      uniqueName = `${rawName} #${id}`;
    }

    usedNames.add(uniqueName);
    options.push({
      id,
      name: uniqueName,
    });
  });

  return options;
};

export const resolveResidentPropertyId = (
  user: AuthUser | null,
): number | string | null => {
  const first = resolveResidentProperties(user)[0];
  const id = first?.id;

  if (typeof id === 'number' || typeof id === 'string') {
    return id;
  }

  return null;
};

export const formatCurrency = (value: unknown): string => {
  const amount = asNumber(value);
  return `${amount.toFixed(2)} AZN`;
};

export const formatDate = (value: unknown): string => {
  const text = asString(value);
  if (!text) {
    return '-';
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return date.toLocaleDateString('az-AZ', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};
