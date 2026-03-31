export const API_BASE_URL = 'https://api.smartlife.az/api/v1';

export type AuthRole = {
  id: number | null;
  name: string;
} | null;

export type UserModule = {
  id?: number | null;
  name?: string | null;
  can?: string[];
  [key: string]: unknown;
};

export type RoleAccessPermission = {
  permission: string;
} | string;

export type RoleAccessModule = {
  module_id?: number | null;
  module_name?: string | null;
  moduleId?: number | null;
  moduleName?: string | null;
  permissions?: RoleAccessPermission[];
  [key: string]: unknown;
};

export type AuthUser = {
  id: number | null;
  name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  status: string | boolean | null;
  profile_photo: string | null;
  birthday: string | null;
  personal_code: string | null;
  address: string | null;
  is_user: number | null;
  is_resident: boolean;
  role: AuthRole;
  modules: UserModule[];
  role_access_modules: RoleAccessModule[];
  devices: unknown;
  other_devices: unknown;
  active_device: unknown;
  notifications: {
    count: number;
    list: unknown[];
  };
  user_complex: unknown;
  user_data: Record<string, unknown>;
  fullName: string;
  firstName: string;
  lastName: string;
  properties?: unknown;
  [key: string]: unknown;
};

export type LoginApiResponse = {
  token: string;
  token_type?: string;
  type?: string;
  user?: Record<string, unknown> | null;
  is_resident?: boolean;
  message?: string;
};

export type LoginResponse = {
  token: string;
  token_type?: string;
  type?: string;
  user: AuthUser;
  is_resident: boolean;
};

export type LoginRequest = {
  login: string;
  password: string;
};

export type LogoutResponse = {
  message?: string;
};

export type MeResponseData = {
  user_data?: Record<string, unknown>;
  role?: {
    id?: number | null;
    name?: string | null;
  } | null;
  modules?: UserModule[];
  role_access_modules?: RoleAccessModule[];
  devices?: unknown;
  other_devices?: unknown;
  active_device?: unknown;
  notifications?: {
    count?: number;
    list?: unknown[];
  } | null;
  user_complex?: unknown;
  is_resident?: boolean;
  [key: string]: unknown;
};

export type ResidentMeResponseData = {
  id?: number | null;
  name?: string | null;
  surname?: string | null;
  email?: string | null;
  phone?: string | null;
  meta?: {
    gender?: string | null;
    birth_date?: string | null;
    personal_code?: string | null;
  } | null;
  properties?: unknown;
  [key: string]: unknown;
};

const toRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

export function normalizeUserData(data: MeResponseData, isResident = false): AuthUser {
  const userDataObj = toRecord(data.user_data);
  const role = data.role
    ? {
        id: toNumberOrNull(data.role.id),
        name: toNullableString(data.role.name) || '',
      }
    : null;
  const rawName = toNullableString(userDataObj.name) || '';

  return {
    id: toNumberOrNull(userDataObj.id),
    name: rawName,
    username: toNullableString(userDataObj.username),
    email: toNullableString(userDataObj.email),
    phone: toNullableString(userDataObj.phone),
    gender: toNullableString(userDataObj.gender),
    status: (userDataObj.status as string | boolean | null) ?? null,
    profile_photo: toNullableString(userDataObj.profile_photo),
    birthday: toNullableString(userDataObj.birthday),
    personal_code: toNullableString(userDataObj.personal_code),
    address: toNullableString(userDataObj.address),
    is_user: toNumberOrNull(userDataObj.is_user),
    is_resident: isResident,
    role,
    modules: Array.isArray(data.modules) ? data.modules : [],
    role_access_modules: Array.isArray(data.role_access_modules)
      ? data.role_access_modules
      : [],
    devices: data.devices ?? null,
    other_devices: data.other_devices ?? null,
    active_device: data.active_device ?? null,
    notifications: {
      count:
        typeof data.notifications?.count === 'number'
          ? data.notifications.count
          : 0,
      list: Array.isArray(data.notifications?.list)
        ? data.notifications.list
        : [],
    },
    user_complex: data.user_complex ?? null,
    user_data: userDataObj,
    fullName: rawName,
    firstName: rawName.split(' ')[0] || rawName,
    lastName: rawName.split(' ').slice(1).join(' ') || '',
  };
}

export function normalizeResidentData(data: ResidentMeResponseData): AuthUser {
  const firstName = toNullableString(data.name) || '';
  const lastName = toNullableString(data.surname) || '';
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;

  return {
    id: toNumberOrNull(data.id),
    name: fullName,
    username: toNullableString(data.email) || toNullableString(data.phone),
    email: toNullableString(data.email),
    phone: toNullableString(data.phone),
    gender: toNullableString(data.meta?.gender),
    status: 'active',
    profile_photo: null,
    birthday: toNullableString(data.meta?.birth_date),
    personal_code: toNullableString(data.meta?.personal_code),
    address: null,
    is_user: null,
    is_resident: true,
    role: {
      id: null,
      name: 'resident',
    },
    modules: [],
    role_access_modules: [],
    devices: null,
    other_devices: null,
    active_device: null,
    notifications: {
      count: 0,
      list: [],
    },
    user_complex: null,
    user_data: toRecord(data),
    fullName,
    firstName,
    lastName,
    properties: data.properties ?? [],
  };
}

export function getRoleName(user: AuthUser | null | undefined): string | null {
  if (!user?.role) {
    return null;
  }

  const roleName = toNullableString(user.role.name);
  return roleName ? roleName.toLowerCase() : null;
}
