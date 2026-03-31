import {
  type AuthUser,
  type LoginApiResponse,
  type LoginRequest,
  type LoginResponse,
  type MeResponseData,
  normalizeResidentData,
  normalizeUserData,
  type ResidentMeResponseData,
  type LogoutResponse,
} from '../utils/auth';
import { api, type ApiError } from './api';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
} & Partial<T>;

const toRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
};

const extractMessage = (error: unknown, fallback: string): string => {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  const apiError = error as ApiError;
  if (typeof apiError.message === 'string' && apiError.message.length > 0) {
    return apiError.message;
  }

  return fallback;
};

const unwrapEnvelope = <T>(payload: ApiEnvelope<T> | T): T => {
  const maybeEnvelope = payload as ApiEnvelope<T>;
  if (maybeEnvelope && typeof maybeEnvelope === 'object' && 'data' in maybeEnvelope) {
    return (maybeEnvelope.data as T) || ({} as T);
  }

  return payload as T;
};

const toMePayloadFromLogin = (loginUser: Record<string, unknown>): MeResponseData => {
  const userRole = toRecord(loginUser.role);

  return {
    user_data: loginUser,
    role:
      Object.keys(userRole).length > 0
        ? {
            id:
              typeof userRole.id === 'number'
                ? userRole.id
                : null,
            name:
              typeof userRole.name === 'string'
                ? userRole.name
                : null,
          }
        : null,
    modules: Array.isArray(loginUser.modules)
      ? (loginUser.modules as MeResponseData['modules'])
      : [],
    role_access_modules: Array.isArray(loginUser.role_access_modules)
      ? (loginUser.role_access_modules as MeResponseData['role_access_modules'])
      : [],
    devices: loginUser.devices,
    other_devices: loginUser.other_devices,
    active_device: loginUser.active_device,
    notifications: {
      count: 0,
      list: [],
    },
  };
};

const toResidentPayloadFromLogin = (
  loginUser: Record<string, unknown>,
): ResidentMeResponseData => {
  return {
    id: typeof loginUser.id === 'number' ? loginUser.id : null,
    name: typeof loginUser.name === 'string' ? loginUser.name : '',
    surname: null,
    email: typeof loginUser.email === 'string' ? loginUser.email : null,
    phone: typeof loginUser.phone === 'string' ? loginUser.phone : null,
    meta: {
      gender: null,
      birth_date: null,
      personal_code: null,
    },
    properties: loginUser.properties ?? [],
  };
};

type RawMeEnvelope = ApiEnvelope<MeResponseData>;
type RawResidentEnvelope = ApiEnvelope<ResidentMeResponseData>;

export async function meService(token?: string | null): Promise<MeResponseData> {
  const payload = await api.get<RawMeEnvelope | MeResponseData>('/user/me', {
    token: token ?? undefined,
  });
  return unwrapEnvelope(payload);
}

export async function residentMeService(
  token?: string | null,
): Promise<ResidentMeResponseData> {
  const payload = await api.get<RawResidentEnvelope | ResidentMeResponseData>(
    '/module/resident/config/me',
    {
      token: token ?? undefined,
    },
  );
  return unwrapEnvelope(payload);
}

export async function refreshUserService(options?: {
  preferResident?: boolean;
}): Promise<AuthUser> {
  if (options?.preferResident) {
    try {
      const residentData = await residentMeService();
      return normalizeResidentData(residentData);
    } catch (residentError) {
      const meData = await meService();
      const isResident =
        meData.is_resident === true || meData.user_data?.is_resident === true;
      return normalizeUserData(meData, isResident);
    }
  }

  try {
    const meData = await meService();
    const isResident =
      meData.is_resident === true || meData.user_data?.is_resident === true;

    if (isResident) {
      try {
        const residentData = await residentMeService();
        return normalizeResidentData(residentData);
      } catch (residentError) {
        return normalizeUserData(meData, true);
      }
    }

    return normalizeUserData(meData, false);
  } catch (meError) {
    const residentData = await residentMeService();
    return normalizeResidentData(residentData);
  }
}

export async function loginService(payload: LoginRequest): Promise<LoginResponse> {
  const loginPayload = await api.post<ApiEnvelope<LoginApiResponse> | LoginApiResponse, LoginRequest>(
    '/auth/login',
    payload,
    {
      skipAuth: true,
      preferValidationObject: true,
    },
  );

  const loginData = unwrapEnvelope(loginPayload);

  if (!loginData?.token) {
    throw new Error('Login ugursuz oldu');
  }

  const loginUser = toRecord(loginData.user);
  const isResidentFromLogin = loginData.is_resident === true;

  if (isResidentFromLogin) {
    try {
      const residentData = await residentMeService(loginData.token);
      return {
        token: loginData.token,
        token_type: loginData.token_type,
        type: loginData.type,
        user: normalizeResidentData(residentData),
        is_resident: true,
      };
    } catch (residentError) {
      return {
        token: loginData.token,
        token_type: loginData.token_type,
        type: loginData.type,
        user: normalizeResidentData(toResidentPayloadFromLogin(loginUser)),
        is_resident: true,
      };
    }
  }

  try {
    const meData = await meService(loginData.token);
    const isResident =
      meData.is_resident === true || meData.user_data?.is_resident === true;

    if (isResident) {
      try {
        const residentData = await residentMeService(loginData.token);
        return {
          token: loginData.token,
          token_type: loginData.token_type,
          type: loginData.type,
          user: normalizeResidentData(residentData),
          is_resident: true,
        };
      } catch (residentError) {
        return {
          token: loginData.token,
          token_type: loginData.token_type,
          type: loginData.type,
          user: normalizeUserData(meData, true),
          is_resident: true,
        };
      }
    }

    return {
      token: loginData.token,
      token_type: loginData.token_type,
      type: loginData.type,
      user: normalizeUserData(meData, false),
      is_resident: false,
    };
  } catch (meError) {
    return {
      token: loginData.token,
      token_type: loginData.token_type,
      type: loginData.type,
      user: normalizeUserData(toMePayloadFromLogin(loginUser), false),
      is_resident: false,
    };
  }
}

export async function logoutService(token?: string | null): Promise<LogoutResponse> {
  try {
    return await api.post<LogoutResponse>('/auth/logout', undefined, {
      token: token ?? undefined,
    });
  } catch (error) {
    throw new Error(extractMessage(error, 'Logout ugursuz oldu'));
  }
}
