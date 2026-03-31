import api from './api';

type QueryParams = Record<string, unknown>;

type Dictionary = Record<string, unknown>;

const BASE = '/module/resident/config';
const MY_BASE = `${BASE}/my`;

export const residentHomeAPI = {
  getInfo: async () => api.get(`${BASE}/me`),
};

export const residentProfileAPI = {
  getMe: async () => api.get(`${BASE}/me`),

  updateMe: async (data: {
    name?: string;
    surname?: string;
    email?: string;
    phone?: string;
    gender?: string | null;
    birth_date?: string | null;
    birthday?: string | null;
    personal_code?: string | null;
  }) => {
    const normalizeDate = (value?: string | null): string | null => {
      if (!value || typeof value !== 'string') {
        return null;
      }

      return value.includes('T') ? value.split('T')[0] : value;
    };

    const payload = {
      name: data.name || '',
      surname: data.surname || '',
      email: data.email || '',
      phone: data.phone || '',
      meta: {
        gender: data.gender || null,
        birth_date: normalizeDate(data.birth_date || data.birthday || null),
        personal_code: data.personal_code || null,
      },
    };

    return api.patch(`${BASE}/me`, payload, {
      preferValidationObject: true,
    });
  },

  updatePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const payload = {
      current_password: data.currentPassword,
      password: data.newPassword,
      password_confirmation: data.confirmPassword,
    };

    return api.put(`${BASE}/me/password`, payload, {
      preferValidationObject: true,
    });
  },
};

export const residentInvoicesAPI = {
  getAll: async (params: QueryParams = {}) => api.get(`${MY_BASE}/invoices`, { params }),

  getByProperty: async (propertyId: number | string, params: QueryParams = {}) =>
    api.get(`${MY_BASE}/invoice/${propertyId}`, { params }),

  getDetail: async (invoiceId: number | string) => api.get(`${MY_BASE}/invoice/detail/${invoiceId}`),
};

export const residentNotificationsAPI = {
  getAll: async (params: QueryParams = {}) =>
    api.get(`${MY_BASE}/notifications`, { params }),

  markAsRead: async (notificationId: number | string) =>
    api.put(`${MY_BASE}/notification/${notificationId}/read`),
};

export const residentPropertiesAPI = {
  getAll: async () => api.get(`${MY_BASE}/properties`),

  getById: async (propertyId: number | string) => api.get(`${MY_BASE}/property/${propertyId}`),
};

export const residentServicesAPI = {
  getAll: async (params: QueryParams = {}) => api.get(`${MY_BASE}/services`, { params }),

  getById: async (serviceId: number | string) => api.get(`${MY_BASE}/service/${serviceId}`),

  requestService: async (serviceData: Dictionary) => api.post(`${MY_BASE}/service/request`, serviceData),

  cancelService: async (serviceId: number | string) => api.delete(`${MY_BASE}/service/${serviceId}`),
};

export const residentTicketsAPI = {
  getAll: async (params: QueryParams = {}) => api.get(`${MY_BASE}/tickets`, { params }),

  getById: async (ticketId: number | string) => api.get(`${MY_BASE}/ticket/${ticketId}`),

  create: async (data: Dictionary) => api.post(`${MY_BASE}/ticket`, data),
};

export const residentEDocumentsAPI = {
  getAll: async (params: QueryParams = {}) => api.get(`${MY_BASE}/documents`, { params }),

  getById: async (documentId: number | string) => api.get(`${MY_BASE}/document/${documentId}`),

  download: async (documentId: number | string) => api.get(`${MY_BASE}/document/${documentId}/download`),
};

export const residentComplexDashboardAPI = {
  getMyProperties: async () => api.get(`${MY_BASE}/properties`),

  getPosts: async (params: QueryParams = {}) =>
    api.get(`${BASE}/complex/feed`, { params }),

  likePost: async (postId: number | string) => api.post(`${BASE}/complex/feed/${postId}/like`),

  getComments: async (postId: number | string) =>
    api.get(`${BASE}/complex/feed/${postId}/comments`),

  addComment: async (postId: number | string, text: string) =>
    api.post(`${BASE}/complex/feed/${postId}/comments`, { body: text }),
};
