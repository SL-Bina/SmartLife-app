import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from './index';

type QuickNavigationTarget = 'resident' | 'dashboard';

type QuickNavigationState = {
  residentRouteKeys: string[];
  dashboardRouteKeys: string[];
};

type SetQuickNavigationRouteKeysPayload = {
  target: QuickNavigationTarget;
  routeKeys: string[];
};

const initialState: QuickNavigationState = {
  residentRouteKeys: [],
  dashboardRouteKeys: [],
};

const sanitizeRouteKeys = (routeKeys: string[]) =>
  Array.from(
    new Set(routeKeys.filter(routeKey => typeof routeKey === 'string' && routeKey.length > 0)),
  );

const quickNavigationSlice = createSlice({
  name: 'quickNavigation',
  initialState,
  reducers: {
    setQuickNavigationRouteKeys(state, action: PayloadAction<SetQuickNavigationRouteKeysPayload>) {
      const sanitizedKeys = sanitizeRouteKeys(action.payload.routeKeys);

      if (action.payload.target === 'resident') {
        state.residentRouteKeys = sanitizedKeys;
        return;
      }

      state.dashboardRouteKeys = sanitizedKeys;
    },
    clearQuickNavigationRouteKeys(state, action: PayloadAction<{ target: QuickNavigationTarget }>) {
      if (action.payload.target === 'resident') {
        state.residentRouteKeys = [];
        return;
      }

      state.dashboardRouteKeys = [];
    },
  },
});

export const {
  setQuickNavigationRouteKeys,
  clearQuickNavigationRouteKeys,
} = quickNavigationSlice.actions;

export const selectResidentQuickRouteKeys = (state: RootState) =>
  state.quickNavigation.residentRouteKeys;

export const selectDashboardQuickRouteKeys = (state: RootState) =>
  state.quickNavigation.dashboardRouteKeys;

export default quickNavigationSlice.reducer;