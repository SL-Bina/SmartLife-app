import { CrudField, DetailRow, EntityItem } from './management-types';

export const toRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

export const getValueByPath = (source: unknown, path: string): unknown => {
  if (!path) {
    return source;
  }

  const root = toRecord(source);
  const parts = path.split('.').filter(Boolean);

  let current: unknown = root;
  for (const part of parts) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
};

export const setValueByPath = (
  target: Record<string, unknown>,
  path: string,
  value: unknown,
) => {
  const parts = path.split('.').filter(Boolean);
  if (parts.length === 0) {
    return;
  }

  let cursor: Record<string, unknown> = target;

  for (let index = 0; index < parts.length; index += 1) {
    const key = parts[index];
    const isLast = index === parts.length - 1;

    if (isLast) {
      cursor[key] = value;
      return;
    }

    const next = cursor[key];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cursor[key] = {};
    }

    cursor = cursor[key] as Record<string, unknown>;
  }
};

export const extractItems = (payload: unknown): EntityItem[] => {
  if (Array.isArray(payload)) {
    return payload.filter(item => item && typeof item === 'object') as EntityItem[];
  }

  const root = toRecord(payload);
  const rootData = toRecord(root.data);
  const nestedData = rootData.data;

  if (Array.isArray(nestedData)) {
    return nestedData.filter(item => item && typeof item === 'object') as EntityItem[];
  }

  const deeplyNested = toRecord(nestedData).data;
  if (Array.isArray(deeplyNested)) {
    return deeplyNested.filter(item => item && typeof item === 'object') as EntityItem[];
  }

  if (Array.isArray(rootData)) {
    return (rootData as unknown[]).filter(item => item && typeof item === 'object') as EntityItem[];
  }

  return [];
};

type PaginationMeta = {
  page: number;
  perPage: number;
  total: number | null;
  totalPages: number | null;
  hasMore: boolean;
};

const toPositiveNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const hasPaginationKey = (value: Record<string, unknown>): boolean => {
  const keys = [
    'current_page',
    'page',
    'last_page',
    'total_pages',
    'per_page',
    'total',
    'next_page_url',
    'has_more_pages',
  ];

  return keys.some(key => value[key] !== undefined && value[key] !== null);
};

export const extractPaginationMeta = (
  payload: unknown,
  fallback: {
    requestedPage: number;
    requestedPerPage: number;
    receivedCount: number;
  },
): PaginationMeta => {
  const root = toRecord(payload);
  const level1 = toRecord(root.data);
  const level2 = toRecord(level1.data);
  const level3 = toRecord(level2.data);

  const source = [level1, level2, level3, root].find(candidate => hasPaginationKey(candidate)) ?? {};

  const page = toPositiveNumber(source.current_page ?? source.page) ?? fallback.requestedPage;
  const perPage = toPositiveNumber(source.per_page ?? source.items_per_page ?? source.limit) ?? fallback.requestedPerPage;
  const total = toPositiveNumber(source.total ?? source.total_count ?? source.count);
  const totalPages = toPositiveNumber(source.last_page ?? source.total_pages);
  const hasNextUrl =
    typeof source.next_page_url === 'string' && source.next_page_url.trim().length > 0;

  let hasMore = false;

  if (typeof source.has_more_pages === 'boolean') {
    hasMore = source.has_more_pages;
  } else if (hasNextUrl) {
    hasMore = true;
  } else if (totalPages !== null) {
    hasMore = page < totalPages;
  } else if (total !== null) {
    hasMore = page * perPage < total;
  } else {
    hasMore = fallback.receivedCount >= perPage && fallback.receivedCount > 0;
  }

  return {
    page,
    perPage,
    total,
    totalPages,
    hasMore,
  };
};

export const extractItem = (payload: unknown): EntityItem => {
  const root = toRecord(payload);
  const rootData = root.data;

  if (rootData && typeof rootData === 'object' && !Array.isArray(rootData)) {
    const nested = toRecord(rootData).data;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as EntityItem;
    }

    return rootData as EntityItem;
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as EntityItem;
  }

  return {};
};

export const toErrorMessage = (
  error: unknown,
  fallback = 'Əməliyyat zamanı xəta baş verdi',
): string => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || fallback;

  const record = toRecord(error);

  if (typeof record.message === 'string' && record.message.length > 0) {
    return record.message;
  }

  const errors = toRecord(record.errors);
  const first = Object.values(errors)[0];

  if (Array.isArray(first) && first[0]) return String(first[0]);
  if (first) return String(first);

  return fallback;
};

export const getEntityId = (item: EntityItem): string | number | null => {
  const id = item.id;
  if (typeof id === 'string' || typeof id === 'number') return id;
  return null;
};

export const getPrimaryText = (item: EntityItem): string => {
  const candidates = [item.name, item.title, item.fullName, item.username, item.email];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }

  const id = getEntityId(item);
  return id ? `#${id}` : 'Qeyd';
};

export const getSecondaryText = (item: EntityItem): string => {
  const candidates = [
    item.description,
    item.address,
    item.phone,
    item.status,
    item.email,
    getValueByPath(item, 'meta.desc'),
    getValueByPath(item, 'meta.address'),
    getValueByPath(item, 'meta.phone'),
    getValueByPath(item, 'meta.email'),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }

    if (typeof candidate === 'number') {
      return String(candidate);
    }
  }

  return 'Əlavə məlumat yoxdur';
};

const toPreviewValue = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return null;
};

export const getCardPreviewData = (
  item: EntityItem,
  fields: CrudField[],
): Array<{ label: string; value: string }> => {
  const result: Array<{ label: string; value: string }> = [];

  fields.forEach(field => {
    const loweredKey = field.key.toLowerCase();
    if (['name', 'title', 'full_name', 'fullname', 'username'].includes(loweredKey)) {
      return;
    }

    const value = toPreviewValue(getValueByPath(item, field.key));
    if (!value) {
      return;
    }

    result.push({ label: field.label, value });
  });

  if (result.length === 0) {
    const fallbackKeys = [
      { key: 'status', label: 'Status' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Telefon' },
      { key: 'address', label: 'Ünvan' },
    ];

    fallbackKeys.forEach(itemKey => {
      const value = toPreviewValue(getValueByPath(item, itemKey.key));
      if (!value) {
        return;
      }

      result.push({ label: itemKey.label, value });
    });
  }

  return result.slice(0, 4);
};

const toDetailLabel = (path: string): string =>
  path
    .replace(/\[(\d+)\]/g, ' [$1]')
    .split('.')
    .map(part => part.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()))
    .join(' / ');

const toDetailValue = (value: unknown): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  if (typeof value === 'string') {
    return value.length > 0 ? value : '(boş mətn)';
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const pushDetailRow = (
  rows: DetailRow[],
  path: string,
  value: string,
  depth: number,
) => {
  const safePath = path.length > 0 ? path : 'root';
  rows.push({
    key: `${safePath}::${rows.length}`,
    path: safePath,
    label: toDetailLabel(safePath),
    value,
    depth,
  });
};

const appendDetailRows = (
  rows: DetailRow[],
  value: unknown,
  path: string,
  depth: number,
) => {
  if (Array.isArray(value)) {
    pushDetailRow(rows, path, `Array (${value.length})`, depth);

    value.forEach((entry, index) => {
      appendDetailRows(rows, entry, `${path}[${index}]`, depth + 1);
    });
    return;
  }

  if (value && typeof value === 'object') {
    const record = toRecord(value);
    const keys = Object.keys(record);
    pushDetailRow(rows, path, `Obyekt (${keys.length})`, depth);

    keys.forEach(key => {
      const nextPath = path.length > 0 ? `${path}.${key}` : key;
      appendDetailRows(rows, record[key], nextPath, depth + 1);
    });
    return;
  }

  pushDetailRow(rows, path, toDetailValue(value), depth);
};

export const toDetailRows = (
  item: EntityItem | null,
  fields: CrudField[],
): DetailRow[] => {
  if (!item) {
    return [];
  }

  const rows: DetailRow[] = [];

  const preferredKeys = fields
    .map(field => field.key)
    .filter(key => getValueByPath(item, key) !== undefined);

  const remainingKeys = Object.keys(item).filter(key => !preferredKeys.includes(key));
  const orderedKeys = [...preferredKeys, ...remainingKeys];

  orderedKeys.forEach(key => {
    appendDetailRows(rows, getValueByPath(item, key), key, 0);
  });

  return rows;
};

export const toInputValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

export const keyboardTypeForField = (fieldType: CrudField['type']) => {
  if (fieldType === 'number') return 'numeric' as const;
  if (fieldType === 'email') return 'email-address' as const;
  if (fieldType === 'phone') return 'phone-pad' as const;
  return 'default' as const;
};
