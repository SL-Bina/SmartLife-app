import api, { requestApi, type ApiError } from './api';

type QueryParams = Record<string, unknown>;
type Dictionary = Record<string, unknown>;

type UserUpsertPayload = {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  password_confirmation?: string;
  birthday?: string;
  personal_code?: string;
  type?: number;
  is_user?: number;
  role_id?: number | string;
  modules?: Array<number | string>;
  mtk?: Array<number | string>;
  complex?: Array<number | string>;
  apartments?: Array<number | string>;
  permissions?: Array<number | string>;
  profile_photo?: unknown;
};

type InvoiceFilters = {
  status?: string;
  type?: string;
  invoice_id?: string | number;
  paid_at?: string;
  amount?: string;
  amount_paid?: string;
  service_ids?: Array<number | string>;
  property_ids?: Array<number | string>;
  mtk_ids?: Array<number | string>;
  complex_ids?: Array<number | string>;
  building_ids?: Array<number | string>;
  block_ids?: Array<number | string>;
};

type InvoicePayItem = {
  id: number | string;
  amount_paid: number | string;
  payment_method_id: number | string;
  desc?: string;
  paid_at?: string;
};

const isRecord = (value: unknown): value is Dictionary => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const pick = <T = unknown>(obj: unknown, key: string): T | undefined => {
  if (!isRecord(obj)) {
    return undefined;
  }

  return obj[key] as T | undefined;
};

const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
};

const buildQueryString = (params: QueryParams = {}): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item !== null && item !== undefined && item !== '') {
          const paramKey = key.endsWith('[]') ? key : `${key}[]`;
          searchParams.append(paramKey, String(item));
        }
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  return searchParams.toString();
};

const withQuery = (path: string, params: QueryParams = {}): string => {
  const query = buildQueryString(params);
  if (!query) {
    return path;
  }

  return `${path}?${query}`;
};

const toValidationMessage = (error: unknown, fallback = 'Validation error'): string => {
  const apiError = error as ApiError;
  if (isRecord(apiError?.errors)) {
    const messages = Object.values(apiError.errors)
      .flatMap(value => (Array.isArray(value) ? value : [value]))
      .filter(Boolean)
      .map(item => String(item));

    if (messages.length > 0) {
      return messages.join(', ');
    }
  }

  if (typeof apiError?.message === 'string' && apiError.message.length > 0) {
    return apiError.message;
  }

  return fallback;
};

const extractDeepList = <T = unknown>(payload: unknown): T[] => {
  const first = pick<unknown>(payload, 'data');
  const second = pick<unknown>(first, 'data');
  const third = pick<unknown>(second, 'data');

  if (Array.isArray(third)) {
    return third as T[];
  }

  if (Array.isArray(second)) {
    return second as T[];
  }

  if (Array.isArray(first)) {
    return first as T[];
  }

  return [];
};

const isUploadablePhoto = (value: unknown): boolean => {
  if (!value) {
    return false;
  }

  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return true;
  }

  if (isRecord(value) && typeof value.uri === 'string') {
    return true;
  }

  return false;
};

const appendFormArray = (formData: FormData, key: string, values: unknown): void => {
  if (!Array.isArray(values)) {
    return;
  }

  values.forEach(item => {
    if (item !== null && item !== undefined && item !== '') {
      formData.append(`${key}[]`, String(item));
    }
  });
};

const createUserPayload = (userData: UserUpsertPayload, includePassword: boolean): Dictionary => {
  const payload: Dictionary = {
    name: userData.name || '',
    username: userData.username || '',
    email: userData.email || '',
    phone: userData.phone || '',
    birthday: userData.birthday || '',
    personal_code: userData.personal_code || '',
    type: userData.type || 1,
    is_user: userData.is_user || 1,
    role_id: userData.role_id || '',
    modules: userData.modules || [],
    mtk: userData.mtk || [],
    complex: userData.complex || [],
    apartments: userData.apartments || [],
    permissions: userData.permissions || [],
  };

  if (includePassword) {
    payload.password = userData.password || '';
    payload.password_confirmation = userData.password_confirmation || '';
  }

  return payload;
};

const createUserFormData = (userData: UserUpsertPayload, includePassword: boolean): FormData => {
  const formData = new FormData();
  formData.append('name', userData.name || '');
  formData.append('username', userData.username || '');
  formData.append('email', userData.email || '');
  formData.append('phone', userData.phone || '');
  formData.append('birthday', userData.birthday || '');
  formData.append('personal_code', userData.personal_code || '');
  formData.append('type', String(userData.type || 1));
  formData.append('is_user', String(userData.is_user || 1));
  formData.append('role_id', String(userData.role_id || ''));

  if (includePassword) {
    formData.append('password', userData.password || '');
    formData.append('password_confirmation', userData.password_confirmation || '');
  }

  appendFormArray(formData, 'modules', userData.modules);
  appendFormArray(formData, 'mtk', userData.mtk);
  appendFormArray(formData, 'complex', userData.complex);
  appendFormArray(formData, 'apartments', userData.apartments);
  appendFormArray(formData, 'permissions', userData.permissions);

  if (isUploadablePhoto(userData.profile_photo)) {
    formData.append('profile_photo', userData.profile_photo as never);
  }

  return formData;
};

const normalizeDate = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  return value.includes('T') ? value.split('T')[0] : value;
};

const BASES = {
  mtk: '/module/mtk',
  complexes: '/module/complexes',
  buildings: '/module/buildings',
  blocks: '/module/blocks',
  properties: '/module/properties',
  resident: '/module/resident',
  propertyServiceFee: '/module/service-configure/property',
  users: '/user',
  devices: '/module/devices',
  services: '/module/services',
  roles: '/module/roles',
  permissions: '/module/permissions',
  invoice: '/module/finance/invoice',
} as const;

const SEARCH_BASES = {
  mtk: '/search/module/mtk',
  complex: '/search/module/complex',
  building: '/search/module/building',
  block: '/search/module/block',
  property: '/search/module/property',
  resident: '/search/module/resident',
  invoice: '/search/module/finance/invoice',
} as const;

export const mtkAPI = {
  getLookupList: async (params: QueryParams = {}) => {
    const payload = await api.get(BASES.mtk + '/list', { params });
    return extractDeepList(payload);
  },

  getAll: async (params: QueryParams = {}) => api.get(BASES.mtk + '/list', { params }),

  search: async (searchParams: QueryParams = {}) => api.get(withQuery(SEARCH_BASES.mtk, searchParams)),

  getById: async (id: number | string) => api.get(`${BASES.mtk}/${id}`),

  add: async (mtkData: Dictionary) => {
    try {
      return await api.put(`${BASES.mtk}/add`, mtkData, { preferValidationObject: true });
    } catch (error) {
      throw new Error(toValidationMessage(error));
    }
  },

  update: async (id: number | string, mtkData: Dictionary) => {
    try {
      return await api.patch(`${BASES.mtk}/${id}`, mtkData, { preferValidationObject: true });
    } catch (error) {
      throw new Error(toValidationMessage(error));
    }
  },

  delete: async (id: number | string) => api.delete(`${BASES.mtk}/${id}`),
};

export const complexesAPI = {
  getLookupList: async (params: QueryParams = {}) => {
    const payload = await api.get(BASES.complexes + '/list', { params });
    return extractDeepList(payload);
  },

  getModules: async (params: QueryParams = {}) => {
    const payload = await api.get('/module/permissions/list', { params });
    const list = extractDeepList(payload);
    if (list.length > 0) {
      return list;
    }

    const nestedData = pick<unknown>(pick<unknown>(payload, 'data'), 'data');
    return Array.isArray(nestedData) ? nestedData : [];
  },

  getAll: async (params: QueryParams = {}) => api.get(withQuery(SEARCH_BASES.complex, params)),

  getById: async (id: number | string) => api.get(`${BASES.complexes}/${id}`),

  add: async (complexData: Dictionary) => {
    try {
      return await api.put(`${BASES.complexes}/add`, complexData, { preferValidationObject: true });
    } catch (error) {
      throw new Error(toValidationMessage(error));
    }
  },

  update: async (id: number | string, complexData: Dictionary) => {
    try {
      return await api.patch(`${BASES.complexes}/${id}`, complexData, { preferValidationObject: true });
    } catch (error) {
      throw new Error(toValidationMessage(error));
    }
  },

  delete: async (id: number | string) => api.delete(`${BASES.complexes}/${id}`),

  search: async (params: QueryParams = {}) => api.get(withQuery(SEARCH_BASES.complex, params)),

  updateConfig: async (id: number | string, configData: Dictionary) =>
    api.patch(`${BASES.complexes}/config/${id}`, configData),
};

export const buildingsAPI = {
  getLookupList: async (params: QueryParams = {}) => {
    const payload = await api.get(BASES.buildings + '/list', { params });
    return extractDeepList(payload);
  },

  getAll: async (params: QueryParams = {}) => api.get(withQuery(SEARCH_BASES.building, params)),

  getById: async (id: number | string) => api.get(`${BASES.buildings}/${id}`),

  add: async (buildingData: Dictionary) => {
    try {
      return await api.put(`${BASES.buildings}/add`, buildingData, { preferValidationObject: true });
    } catch (error) {
      throw new Error(toValidationMessage(error));
    }
  },

  update: async (id: number | string, buildingData: Dictionary) => {
    try {
      return await api.patch(`${BASES.buildings}/${id}`, buildingData, { preferValidationObject: true });
    } catch (error) {
      throw new Error(toValidationMessage(error));
    }
  },

  delete: async (id: number | string) => api.delete(`${BASES.buildings}/${id}`),

  search: async (params: QueryParams = {}) => api.get(withQuery(SEARCH_BASES.building, params)),
};

export const blocksAPI = {
  getLookupList: async (params: QueryParams = {}) => {
    const payload = await api.get(BASES.blocks + '/list', { params });
    return extractDeepList(payload);
  },

  getAll: async (params: QueryParams = {}) => api.get(withQuery(SEARCH_BASES.block, params)),

  getById: async (id: number | string) => api.get(`${BASES.blocks}/${id}`),

  add: async (blockData: Dictionary) => {
    try {
      return await api.put(`${BASES.blocks}/add`, blockData, { preferValidationObject: true });
    } catch (error) {
      throw new Error(toValidationMessage(error));
    }
  },

  update: async (id: number | string, blockData: Dictionary) => {
    try {
      return await api.patch(`${BASES.blocks}/${id}`, blockData, { preferValidationObject: true });
    } catch (error) {
      throw new Error(toValidationMessage(error));
    }
  },

  delete: async (id: number | string) => api.delete(`${BASES.blocks}/${id}`),

  search: async (params: QueryParams = {}) => api.get(withQuery(SEARCH_BASES.block, params)),
};

export const propertiesAPI = {
  getLookupList: async (params: QueryParams = {}) => {
    const payload = await api.get(BASES.properties + '/list', { params });
    return extractDeepList(payload);
  },

  getAll: async (params: QueryParams = {}) => api.get(withQuery(SEARCH_BASES.property, params)),

  getById: async (id: number | string) => api.get(`${BASES.properties}/${id}`),

  add: async (propertyData: Dictionary) => {
    try {
      return await api.put(`${BASES.properties}/add`, propertyData, { preferValidationObject: true });
    } catch (error) {
      throw new Error(toValidationMessage(error));
    }
  },

  update: async (id: number | string, propertyData: Dictionary) => {
    try {
      return await api.patch(`${BASES.properties}/${id}`, propertyData, { preferValidationObject: true });
    } catch (error) {
      throw new Error(toValidationMessage(error));
    }
  },

  delete: async (id: number | string) => api.delete(`${BASES.properties}/${id}`),

  search: async (params: QueryParams = {}) => api.get(withQuery(SEARCH_BASES.property, params)),

  getTypes: async (params: QueryParams = {}) => {
    const payload = await api.get(BASES.properties + '/type/list', { params });
    return extractDeepList(payload);
  },

  getPropertyTypes: async (params: QueryParams = {}) => {
    const payload = await api.get(BASES.properties + '/type/list', { params });
    return extractDeepList(payload);
  },

  getSearchData: async (type: string, ids: Array<number | string> = []) => {
    const payload = await api.get(withQuery(SEARCH_BASES.property, { type, ids }));
    const data = pick<unknown>(pick<unknown>(payload, 'data'), 'data');
    return Array.isArray(data) ? data : [];
  },
};

export const propertyServiceFeeAPI = {
  getList: async (propertyId: number | string, params: QueryParams = {}) =>
    api.get(`${BASES.propertyServiceFee}/list/${propertyId}`, { params }),

  getById: async (propertyId: number | string, id: number | string) =>
    api.get(`${BASES.propertyServiceFee}/${propertyId}/${id}`),

  add: async (propertyId: number | string, serviceFeeData: Dictionary) => {
    try {
      return await api.put(`${BASES.propertyServiceFee}/${propertyId}/add`, serviceFeeData, {
        preferValidationObject: true,
      });
    } catch (error) {
      throw new Error(toValidationMessage(error));
    }
  },

  update: async (propertyId: number | string, id: number | string, serviceFeeData: Dictionary) => {
    try {
      return await api.patch(`${BASES.propertyServiceFee}/${propertyId}/${id}`, serviceFeeData, {
        preferValidationObject: true,
      });
    } catch (error) {
      throw new Error(toValidationMessage(error));
    }
  },

  delete: async (propertyId: number | string, id: number | string) =>
    api.delete(`${BASES.propertyServiceFee}/${propertyId}/${id}`),
};

export const residentsAPI = {
  getAll: async (params: QueryParams = {}) => api.get(withQuery(SEARCH_BASES.resident, params)),

  search: async (params: QueryParams = {}) => api.get(withQuery(SEARCH_BASES.resident, params)),

  getById: async (id: number | string) => api.get(`${BASES.resident}/${id}`),

  getMe: async () => api.get(`${BASES.resident}/config/me`),

  add: async (residentData: Dictionary) => {
    try {
      return await api.put(`${BASES.resident}/add`, residentData, { preferValidationObject: true });
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 426) {
        const duplicateError = new Error(apiError.message || 'Resident already exists') as Error & {
          status?: number;
        };
        duplicateError.status = 426;
        throw duplicateError;
      }

      throw new Error(toValidationMessage(error));
    }
  },

  update: async (id: number | string, residentData: Dictionary) => {
    try {
      return await api.patch(`${BASES.resident}/${id}`, residentData, { preferValidationObject: true });
    } catch (error) {
      throw new Error(toValidationMessage(error));
    }
  },

  delete: async (id: number | string) => api.delete(`${BASES.resident}/${id}`),

  bindProperty: async (residentId: number | string, propertyData: Dictionary) => {
    const payload = await api.post(`${BASES.resident}/bind-property/${residentId}`, propertyData);
    if (pick<boolean>(payload, 'success') === false) {
      throw payload;
    }

    return payload;
  },

  unbindProperty: async (residentId: number | string, propertyData: Dictionary) => {
    const payload = await api.post(`${BASES.resident}/unbind-property/${residentId}`, propertyData);
    if (pick<boolean>(payload, 'success') === false) {
      throw payload;
    }

    return payload;
  },
};

export const usersAPI = {
  getAll: async (params: QueryParams = {}) => api.get(`${BASES.users}/list`, { params }),

  getById: async (id: number | string) => api.get(`${BASES.users}/${id}`),

  addUser: async (userData: UserUpsertPayload) => {
    try {
      if (isUploadablePhoto(userData.profile_photo)) {
        const formData = createUserFormData(userData, true);
        return await requestApi(`${BASES.users}/add`, {
          method: 'PUT',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        });
      }

      const payload = createUserPayload(userData, true);
      return await api.put(`${BASES.users}/add`, payload, { preferValidationObject: true });
    } catch (error) {
      throw new Error(toValidationMessage(error));
    }
  },

  update: async (id: number | string, userData: UserUpsertPayload) => {
    try {
      if (isUploadablePhoto(userData.profile_photo)) {
        const formData = createUserFormData(userData, Boolean(userData.password));
        return await requestApi(`${BASES.users}/${id}`, {
          method: 'PATCH',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        });
      }

      const payload = createUserPayload(userData, Boolean(userData.password));
      return await api.patch(`${BASES.users}/${id}`, payload, { preferValidationObject: true });
    } catch (error) {
      throw new Error(toValidationMessage(error));
    }
  },

  delete: async (id: number | string) => api.delete(`${BASES.users}/${id}`),

  getRoles: async () => api.get('/module/roles/list', { params: { per_page: 1000 } }),

  getModules: async () => api.get('/module/permissions/list', { params: { per_page: 1000 } }),

  getMtks: async () => api.get('/module/mtk/list'),

  getComplexes: async (params: QueryParams = {}) => api.get('/module/complexes/list', { params }),

  getRoleById: async (roleId: number | string) => api.get(`/module/roles/${roleId}`),

  getComplexesByMtk: async (mtkIds: Array<number | string> = []) => {
    const params: QueryParams = {};
    if (mtkIds.length > 0) {
      params.mtk_ids = mtkIds;
    }

    return api.get('/search/module/complex', { params });
  },
};

export const addUser = usersAPI.addUser;

export const devicesAPI = {
  getAll: async (params: QueryParams = {}) => api.get(`${BASES.devices}/list`, { params }),

  getById: async (id: number | string) => api.get(`${BASES.devices}/${id}`),

  create: async (data: Dictionary) => api.put(`${BASES.devices}/add`, data, { preferValidationObject: true }),

  update: async (id: number | string, data: Dictionary) =>
    api.patch(`${BASES.devices}/${id}`, data, { preferValidationObject: true }),

  delete: async (id: number | string) => api.delete(`${BASES.devices}/${id}`),

  getAccessRules: async (params: QueryParams = {}) => api.get(`${BASES.devices}/access-rules`, { params }),

  getDeviceUsers: async (deviceId: number | string, params: QueryParams = {}) =>
    api.get(`${BASES.devices}/${deviceId}/users`, { params }),

  getDeviceIdentifiers: async (deviceId: number | string, params: QueryParams = {}) =>
    api.get(`${BASES.devices}/${deviceId}/identifiers`, { params }),

  getDeviceLogs: async (deviceId: number | string, params: QueryParams = {}) =>
    api.get(`${BASES.devices}/${deviceId}/logs`, { params }),

  getBasipDevices: async (params: QueryParams = {}) =>
    api.get('/integration/device/basip-project/devices', { params }),

  getBasipDevice: async (id: number | string, params: QueryParams = {}) =>
    api.get(`/integration/device/basip-project/devices/${id}`, { params }),

  getBasipLogs: async (params: QueryParams = {}) =>
    api.get('/integration/device/basip-project/log-list', { params }),

  openBasipDoor: async (data: Dictionary) =>
    api.post('/integration/device/basip-project/devices/open-door', data),

  openBasipElevator: async (data: Dictionary) =>
    api.post('/integration/device/basip-project/devices/open-elevator', data),

  getBasipUsers: async ({
    complex_id,
    page = 1,
    size = 20,
    search = '',
  }: {
    complex_id: number | string;
    page?: number;
    size?: number;
    search?: string;
  }) =>
    api.post('/integration/device/basip-project/users', {
      complex_id,
      page,
      size,
      ...(search ? { search } : {}),
    }),

  getBasipUser: async ({
    id,
    complex_id,
  }: {
    id: number | string;
    complex_id: number | string;
  }) =>
    api.post(`/integration/device/basip-project/users/${id}`, {
      complex_id,
    }),

  addBasipUser: async (data: Dictionary) =>
    api.patch('/integration/device/basip-project/users/add', data),

  deleteBasipUser: async ({
    user_id,
    complex_id,
  }: {
    user_id: number | string;
    complex_id: number | string;
  }) =>
    requestApi(`/integration/device/basip-project/users/${user_id}`, {
      method: 'DELETE',
      body: { complex_id },
    }),

  getBasipAccessRules: async ({
    complex_id,
    page = 1,
    size = 20,
  }: {
    complex_id: number | string;
    page?: number;
    size?: number;
  }) =>
    api.post('/integration/device/basip-project/access-rules/list', {
      complex_id,
      page,
      size,
    }),

  getBasipAccessRule: async (id: number | string) =>
    api.get(`/integration/device/basip-project/access-rules/${id}`),

  addEditBasipAccessRule: async (data: Dictionary) =>
    api.put('/integration/device/basip-project/access-rules/add-edit', data, {
      preferValidationObject: true,
    }),

  getBasipIdentifiers: async ({
    complex_id,
    page = 1,
    size = 20,
  }: {
    complex_id: number | string;
    page?: number;
    size?: number;
  }) =>
    api.post('/integration/device/basip-project/identifiers', {
      complex_id,
      page,
      size,
    }),

  getBasipIdentifier: async ({
    id,
    complex_id,
  }: {
    id: number | string;
    complex_id: number | string;
  }) =>
    api.post(`/integration/device/basip-project/identifiers/${id}`, {
      complex_id,
    }),

  addBasipIdentifier: async (data: Dictionary) =>
    api.put('/integration/device/basip-project/identifiers/add', data),

  updateBasipIdentifier: async ({ id, ...data }: { id: number | string } & Dictionary) =>
    api.patch(`/integration/device/basip-project/identifiers/${id}`, data),

  deleteBasipIdentifier: async ({
    id,
    complex_id,
  }: {
    id: number | string;
    complex_id: number | string;
  }) =>
    requestApi(`/integration/device/basip-project/identifiers/${id}`, {
      method: 'DELETE',
      body: { complex_id },
    }),
};

export const notificationsAPI = {
  getMyNotifications: (page = 1) => api.get('/user/my/notifications', { params: { page } }),

  markRead: (id: number | string) => api.post(`/module/notifications/${id}/read`),

  markAllRead: () => api.post('/module/notifications/read-all'),
};

export const rolesAPI = {
  getAll: async (params: QueryParams = {}) => api.get(`${BASES.roles}/list`, { params }),

  getById: async (id: number | string) => api.get(`${BASES.roles}/${id}`),

  create: async (data: { name?: string; role_name?: string }) =>
    api.put(`${BASES.roles}/add`, { role_name: data.name || data.role_name || '' }, {
      preferValidationObject: true,
    }),

  update: async (id: number | string, data: { name?: string; role_name?: string }) =>
    api.patch(`${BASES.roles}/${id}`, { role_name: data.name || data.role_name || '' }, {
      preferValidationObject: true,
    }),

  delete: async (id: number | string) => api.delete(`${BASES.roles}/${id}`),

  bindPermissions: async (roleId: number | string, permissionIds: Array<number | string>) =>
    api.patch(`${BASES.roles}/assign-permissions`, {
      role_id: roleId,
      permissions: Array.isArray(permissionIds)
        ? permissionIds.filter(id => id !== null && id !== undefined && id !== '')
        : [],
    }, {
      preferValidationObject: true,
    }),
};

export const permissionsAPI = {
  getAll: async (params: QueryParams = {}) => api.get(`${BASES.permissions}/list`, { params }),

  getById: async (id: number | string) => api.get(`${BASES.permissions}/${id}`),

  create: async (data: Dictionary) => api.put(`${BASES.permissions}/add`, data, {
    preferValidationObject: true,
  }),

  update: async (id: number | string, data: Dictionary) => api.patch(`${BASES.permissions}/${id}`, data, {
    preferValidationObject: true,
  }),

  delete: async (id: number | string) => api.delete(`${BASES.permissions}/${id}`),
};

export const userPermissionsAPI = {
  getAll: async (params: QueryParams = {}) => api.get('/permissions/list', { params }),

  getById: async (id: number | string) => api.get(`/permissions/${id}`),

  create: async (data: Dictionary) => api.put('/permissions/add', data, {
    preferValidationObject: true,
  }),

  update: async (id: number | string, data: Dictionary) => api.patch(`/permissions/${id}`, data, {
    preferValidationObject: true,
  }),

  delete: async (id: number | string) => api.delete(`/permissions/${id}`),
};

export const servicesAPI = {
  getAll: async (params: QueryParams = {}) => api.get(`${BASES.services}/list`, { params }),

  getById: async (id: number | string) => api.get(`${BASES.services}/${id}`),

  create: async (data: {
    name?: string;
    description?: string;
    price?: string | number;
    complex_id?: string | number | null;
  }) => {
    const cleanedData = {
      name: data.name || '',
      description: data.description || '',
      price: data.price ? Number(data.price) : 0,
      complex_id: data.complex_id ? Number(data.complex_id) : null,
    };

    return api.put(`${BASES.services}/add`, cleanedData, { preferValidationObject: true });
  },

  update: async (
    id: number | string,
    data: {
      name?: string;
      description?: string;
      price?: string | number;
      complex_id?: string | number | null;
    },
  ) => {
    const cleanedData = {
      name: data.name || '',
      description: data.description || '',
      price: data.price ? Number(data.price) : 0,
      complex_id: data.complex_id ? Number(data.complex_id) : null,
    };

    return api.patch(`${BASES.services}/${id}`, cleanedData, { preferValidationObject: true });
  },

  delete: async (id: number | string) => api.delete(`${BASES.services}/${id}`),
};

export const servicesLookupsAPI = {
  getMtks: async () => api.get('/module/mtk/list'),

  getComplexes: async (params: QueryParams = {}) => api.get('/module/complexes/list', { params }),
};

export const profileAPI = {
  getMe: async () => api.get('/user/me'),

  updateMe: async (data: Dictionary, currentUser?: Dictionary) => {
    const payload: Dictionary = {
      name: toStringValue(data.name ?? currentUser?.name ?? ''),
      username: toStringValue(data.username ?? currentUser?.username ?? ''),
      email: toStringValue(data.email ?? currentUser?.email ?? ''),
      phone: toStringValue(data.phone ?? currentUser?.phone ?? ''),
      is_user: Number(data.is_user ?? currentUser?.is_user ?? 1),
      role_id: Number(
        data.role_id
          ?? currentUser?.role_id
          ?? pick<number | string>(pick<Dictionary>(currentUser, 'role'), 'id')
          ?? 1,
      ),
      modules: (data.modules as unknown[]) ?? (currentUser?.modules as unknown[]) ?? ['*'],
      grant_permissions:
        (data.grant_permissions as unknown[])
        ?? (currentUser?.grant_permissions as unknown[])
        ?? ['*'],
      birthday: normalizeDate(data.birthday ?? currentUser?.birthday ?? null),
    };

    if ((data.personal_code ?? currentUser?.personal_code) !== undefined) {
      payload.personal_code = toStringValue(data.personal_code ?? currentUser?.personal_code);
    }

    if (typeof data.password === 'string' && data.password.length > 0) {
      payload.password = data.password;
      payload.password_confirmation = toStringValue(data.password_confirmation || '');
    }

    return api.patch('/user/me', payload, { preferValidationObject: true });
  },
};

const buildInvoiceParams = (filters: InvoiceFilters = {}, page = 1, perPage = 20): URLSearchParams => {
  const p = new URLSearchParams();
  p.append('page', String(page));
  p.append('per_page', String(perPage));

  if (filters.status) {
    p.append('status', filters.status);
  }

  if (filters.type) {
    p.append('type', filters.type);
  }

  if (filters.invoice_id !== undefined && filters.invoice_id !== null && filters.invoice_id !== '') {
    p.append('invoice_id', String(filters.invoice_id));
  }

  (filters.service_ids || []).forEach(id => p.append('service_ids[]', String(id)));
  (filters.property_ids || []).forEach(id => p.append('property_ids[]', String(id)));
  (filters.mtk_ids || []).forEach(id => p.append('mtk_ids[]', String(id)));
  (filters.complex_ids || []).forEach(id => p.append('complex_ids[]', String(id)));
  (filters.building_ids || []).forEach(id => p.append('building_ids[]', String(id)));
  (filters.block_ids || []).forEach(id => p.append('block_ids[]', String(id)));

  if (filters.paid_at) {
    p.append('paid_at', filters.paid_at);
  }

  if (filters.amount) {
    p.append('amount', filters.amount);
  }

  if (filters.amount_paid) {
    p.append('amount_paid', filters.amount_paid);
  }

  return p;
};

const getPropertyName = (propertyValue: unknown): string | null => {
  if (!isRecord(propertyValue)) {
    return null;
  }

  const directName = toStringValue(propertyValue.name);
  if (directName) {
    return directName;
  }

  const meta = pick<Dictionary>(propertyValue, 'meta');
  const apartmentNumber = toStringValue(meta?.apartment_number ?? propertyValue.apartment_number);
  if (apartmentNumber) {
    return apartmentNumber;
  }

  const propertyId = propertyValue.id;
  if (typeof propertyId === 'number' || typeof propertyId === 'string') {
    return `Property #${propertyId}`;
  }

  return null;
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const financeInvoicesAPI = {
  fetchPaymentMethods: async (page = 1, perPage = 100) => {
    const payload = await api.get('/module/finance/payment/methods', {
      params: { page, per_page: perPage },
    });

    if (pick<boolean>(payload, 'success')) {
      const methods = pick<unknown>(payload, 'data');
      if (Array.isArray(methods)) {
        return methods;
      }

      const nested = pick<unknown>(methods, 'data');
      return Array.isArray(nested) ? nested : [];
    }

    throw new Error(toStringValue(pick<unknown>(payload, 'message')) || 'Failed to fetch payment methods');
  },

  payInvoices: async (invoices: InvoicePayItem[]) => {
    const payload = await api.post('/module/finance/invoice/pay', { invoices });
    if (pick<boolean>(payload, 'success')) {
      return payload;
    }

    throw new Error(toStringValue(pick<unknown>(payload, 'message')) || 'Failed to pay invoices');
  },

  addBalanceInCash: async (
    propertyId: number | string,
    amount: number | string,
    balanceType: 'cash' | string = 'cash',
  ) => {
    const payload = await api.post('/module/finance/add-balance-in-cash', {
      property_id: propertyId,
      amount,
      balance_type: balanceType,
    });

    if (pick<boolean>(payload, 'success') === false) {
      throw new Error(toStringValue(pick<unknown>(payload, 'message')) || 'Failed to add balance');
    }

    return payload;
  },

  fetchInvoices: async (filters: InvoiceFilters = {}, page = 1, itemsPerPage = 20) => {
    const query = buildInvoiceParams(filters, page, itemsPerPage);
    const payload = await api.get(`${SEARCH_BASES.invoice}?${query.toString()}`);

    if (!pick<boolean>(payload, 'success')) {
      throw new Error(toStringValue(pick<unknown>(payload, 'message')) || 'Failed to fetch invoices');
    }

    const rootData = pick<unknown>(payload, 'data');
    const list = Array.isArray(rootData)
      ? rootData
      : (
          pick<unknown[]>(rootData, 'data')
          || pick<unknown[]>(rootData, 'invoices')
          || pick<unknown[]>(rootData, 'items')
          || []
        );

    const normalized = list.map(item => {
      if (!isRecord(item)) {
        return item;
      }

      const prop = item.property || item.apartment || item.flat || item.unit || item.real_estate;
      if (isRecord(prop)) {
        return {
          ...item,
          property: {
            ...prop,
            name: getPropertyName(prop) || toStringValue(prop.name),
          },
        };
      }

      if (item.property_id !== undefined && item.property_id !== null) {
        return {
          ...item,
          property: {
            id: item.property_id,
            name: `Property #${item.property_id}`,
          },
        };
      }

      return item;
    });

    const paginationSource = Array.isArray(rootData) ? {} : (rootData as Dictionary);

    return {
      data: normalized,
      pagination: {
        page: toNumber(paginationSource.current_page) || page,
        itemsPerPage: toNumber(paginationSource.per_page) || itemsPerPage,
        total: toNumber(paginationSource.total) || normalized.length,
        totalPages: toNumber(paginationSource.last_page) || 1,
      },
    };
  },

  fetchTotalPaid: async (filters: InvoiceFilters = {}) => {
    const { data } = await financeInvoicesAPI.fetchInvoices(filters, 1, 9999);
    const total = data
      .map(item => (isRecord(item) ? toNumber(item.amount_paid) : 0))
      .reduce((sum, value) => sum + value, 0);

    return Number(total.toFixed(2));
  },

  fetchTotalConsumption: async (filters: InvoiceFilters = {}) => {
    const { data } = await financeInvoicesAPI.fetchInvoices(filters, 1, 9999);
    const total = data
      .map(item => (isRecord(item) ? toNumber(item.amount) : 0))
      .reduce((sum, value) => sum + value, 0);

    return Number(total.toFixed(2));
  },

  createInvoice: async (invoiceData: Dictionary) => {
    const payload = await api.put(`${BASES.invoice}/add`, invoiceData);
    if (pick<boolean>(payload, 'success')) {
      return pick<unknown>(payload, 'data');
    }

    throw new Error(toStringValue(pick<unknown>(payload, 'message')) || 'Failed to create invoice');
  },

  updateInvoice: async (id: number | string, invoiceData: Dictionary) => {
    const payload = await api.patch(`${BASES.invoice}/${id}`, invoiceData);
    if (pick<boolean>(payload, 'success')) {
      return pick<unknown>(payload, 'data');
    }

    throw new Error(toStringValue(pick<unknown>(payload, 'message')) || 'Failed to update invoice');
  },

  deleteInvoice: async (id: number | string) => {
    const payload = await api.delete(`${BASES.invoice}/${id}`);
    if (!pick<boolean>(payload, 'success')) {
      throw new Error(toStringValue(pick<unknown>(payload, 'message')) || 'Failed to delete invoice');
    }
  },

  fetchInvoiceById: async (id: number | string) => {
    const payload = await api.get(`${BASES.invoice}/${id}`);
    if (!pick<boolean>(payload, 'success')) {
      throw new Error(toStringValue(pick<unknown>(payload, 'message')) || 'Failed to fetch invoice');
    }

    const data = pick<Dictionary>(payload, 'data') || {};
    return {
      ...data,
      property: data.property || data.apartment || null,
    };
  },
};

export const managementAPI = {
  mtkAPI,
  complexesAPI,
  buildingsAPI,
  blocksAPI,
  propertiesAPI,
  propertyServiceFeeAPI,
  residentsAPI,
  usersAPI,
  devicesAPI,
  notificationsAPI,
  rolesAPI,
  permissionsAPI,
  userPermissionsAPI,
  servicesAPI,
  servicesLookupsAPI,
  profileAPI,
  financeInvoicesAPI,
};

export default managementAPI;
