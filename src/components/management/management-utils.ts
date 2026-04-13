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

const DETAIL_DATE_FORMATTER = new Intl.DateTimeFormat('az-AZ', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const hasDateSemantic = (path: string): boolean => {
  const normalized = path.toLowerCase();
  return /(^|\.)(created_at|updated_at|deleted_at|date|time|start_at|end_at|expires_at|birth_date|dob)$/.test(
    normalized,
  );
};

const toDateObject = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const millis = value < 1_000_000_000_000 ? value * 1000 : value;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed);
      if (Number.isFinite(numeric)) {
        const millis = numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
        const numericDate = new Date(millis);
        if (!Number.isNaN(numericDate.getTime())) {
          return numericDate;
        }
      }
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
};

const formatDateTime = (value: unknown): string | null => {
  const date = toDateObject(value);
  if (!date) {
    return null;
  }

  return DETAIL_DATE_FORMATTER.format(date);
};

const toPathLeaf = (path: string): { parentPath: string; leaf: string } => {
  const parts = path.split('.').filter(Boolean);
  const leaf = parts[parts.length - 1] || '';
  const parentPath = parts.slice(0, -1).join('.');
  return { parentPath, leaf };
};

const toCandidatePath = (parentPath: string, key: string): string => {
  return parentPath ? `${parentPath}.${key}` : key;
};

const getTextFromPath = (item: EntityItem, path: string): string | null => {
  const value = getValueByPath(item, path);

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return null;
};

const resolveRelationName = (item: EntityItem, path: string): string | null => {
  const { parentPath, leaf } = toPathLeaf(path);
  if (!leaf.endsWith('_id')) {
    return null;
  }

  const relation = leaf.slice(0, -3);
  if (!relation) {
    return null;
  }

  const candidates = [
    toCandidatePath(parentPath, `${relation}.name`),
    toCandidatePath(parentPath, `${relation}.title`),
    toCandidatePath(parentPath, `${relation}.full_name`),
    toCandidatePath(parentPath, `${relation}.fullname`),
    toCandidatePath(parentPath, `${relation}.username`),
    toCandidatePath(parentPath, `${relation}.email`),
    toCandidatePath(parentPath, `${relation}_name`),
    toCandidatePath(parentPath, `${relation}Name`),
  ];

  for (const candidate of candidates) {
    const text = getTextFromPath(item, candidate);
    if (text) {
      return text;
    }
  }

  return null;
};

const toDetailValue = (value: unknown): string => {
  if (value === null || value === undefined) return 'Məlumat daxil edilməyib';

  if (typeof value === 'string') {
    return value.trim().length > 0 ? value : 'Məlumat daxil edilməyib';
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? `Siyahı məlumatı (${value.length} element)`
      : 'Siyahı məlumatı yoxdur';
  }

  if (value && typeof value === 'object') {
    const record = toRecord(value);
    const preferred = [record.name, record.title, record.full_name, record.username, record.email];

    for (const candidate of preferred) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate;
      }
    }

    return 'Əlavə struktur məlumatı mövcuddur';
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const toDisplayDetailValue = (item: EntityItem, path: string, value: unknown): string => {
  const relationName = resolveRelationName(item, path);
  if (relationName) {
    return relationName;
  }

  if (hasDateSemantic(path)) {
    const formatted = formatDateTime(value);
    if (formatted) {
      return formatted;
    }
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    const looksLikeDateValue = /^\d{4}-\d{2}-\d{2}/.test(normalized) || normalized.includes('T');

    if (looksLikeDateValue) {
      const formatted = formatDateTime(normalized);
      if (formatted) {
        return formatted;
      }
    }
  }

  return toDetailValue(value);
};

const pushDetailRow = (rows: DetailRow[], path: string, label: string, value: string) => {
  const safePath = path.length > 0 ? path : 'root';
  rows.push({
    key: `${safePath}::${rows.length}`,
    path: safePath,
    label,
    value,
    depth: 0,
  });
};

const shouldRenderAsDetail = (value: unknown): boolean => {
  if (value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

const tryAppendDetail = (
  rows: DetailRow[],
  item: EntityItem,
  path: string,
  label: string,
  seen: Set<string>,
) => {
  if (!path || seen.has(path)) {
    return;
  }

  const value = getValueByPath(item, path);
  if (!shouldRenderAsDetail(value)) {
    return;
  }

  pushDetailRow(rows, path, label, toDisplayDetailValue(item, path, value));
  seen.add(path);
};

export const toDetailRows = (
  item: EntityItem | null,
  fields: CrudField[],
): DetailRow[] => {
  if (!item) {
    return [];
  }

  const rows: DetailRow[] = [];
  const seen = new Set<string>();

  fields.forEach(field => {
    const label = field.label?.trim() || toDetailLabel(field.key);
    tryAppendDetail(rows, item, field.key, label, seen);
  });

  const fallbackFields: Array<{ key: string; label: string }> = [
    { key: 'id', label: 'ID' },
    { key: 'status', label: 'Status' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefon' },
    { key: 'address', label: 'Ünvan' },
    { key: 'created_at', label: 'Yaradılma tarixi' },
    { key: 'updated_at', label: 'Yenilənmə tarixi' },
  ];

  fallbackFields.forEach(field => {
    tryAppendDetail(rows, item, field.key, field.label, seen);
  });

  if (rows.length === 0) {
    Object.keys(item).forEach(key => {
      const value = item[key];
      if (value && typeof value === 'object') {
        return;
      }

      const label = toDetailLabel(key);
      tryAppendDetail(rows, item, key, label, seen);
    });
  }

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
