import api from './api';

type QueryParams = Record<string, unknown>;

export const notificationsAPI = {
  getMyNotifications: async (page = 1, params: QueryParams = {}) =>
    api.get('/user/my/notifications', {
      params: {
        page,
        ...params,
      },
    }),

  markRead: async (id: number | string) => api.post(`/module/notifications/${id}/read`),

  markAllRead: async () => api.post('/module/notifications/read-all'),
};

export default notificationsAPI;