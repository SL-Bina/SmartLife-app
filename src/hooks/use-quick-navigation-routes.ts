import React from 'react';

import { AppRouteItem, getDrawerMenuRoutes } from '../routes/routes';
import {
  selectAuthRoleName,
  selectAuthUser,
  selectIsResident,
} from '../store/auth-slice';
import {
  selectDashboardQuickRouteKeys,
  selectResidentQuickRouteKeys,
  setQuickNavigationRouteKeys,
} from '../store/quick-navigation-slice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

type QuickRouteOption = {
  routeKey: string;
  label: string;
};

const EXCLUDED_QUICK_ROUTE_KEYS = new Set([
  'profile',
  'settings',
  'my_devices',
  'qr_scanner',
  'resident_profile',
  'resident_settings',
  'resident_my_devices',
  'resident_qr_scanner',
]);

const RESIDENT_SELECTION_LIMIT = 3;
const DASHBOARD_SELECTION_LIMIT = 5;

const flattenRoutes = (items: AppRouteItem[]): AppRouteItem[] =>
  items.flatMap(item => [item, ...(item.children ? flattenRoutes(item.children) : [])]);

const areArraysEqual = (left: string[], right: string[]) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
};

const sanitizeRouteKeys = (
  routeKeys: string[],
  allowedRouteKeys: Set<string>,
  limit: number,
) => {
  const unique = Array.from(
    new Set(
      routeKeys.filter(routeKey =>
        typeof routeKey === 'string' &&
        routeKey.length > 0 &&
        allowedRouteKeys.has(routeKey),
      ),
    ),
  );

  return unique.slice(0, limit);
};

export function useQuickNavigationRoutes() {
  const dispatch = useAppDispatch();
  const isResident = useAppSelector(selectIsResident);
  const user = useAppSelector(selectAuthUser);
  const roleName = useAppSelector(selectAuthRoleName);
  const residentRouteKeys = useAppSelector(selectResidentQuickRouteKeys);
  const dashboardRouteKeys = useAppSelector(selectDashboardQuickRouteKeys);

  const target = isResident ? 'resident' : 'dashboard';
  const selectionLimit = isResident
    ? RESIDENT_SELECTION_LIMIT
    : DASHBOARD_SELECTION_LIMIT;

  const availableRouteOptions = React.useMemo<QuickRouteOption[]>(() => {
    const layout = isResident ? 'resident' : 'dashboard';
    const drawerRoutes = getDrawerMenuRoutes(layout, user, roleName || undefined);
    const flattenedRoutes = flattenRoutes(drawerRoutes);

    return flattenedRoutes
      .filter(route => route.routeKey && !EXCLUDED_QUICK_ROUTE_KEYS.has(route.routeKey))
      .map(route => ({
        routeKey: route.routeKey as string,
        label: route.label,
      }));
  }, [isResident, roleName, user]);

  const availableRouteKeySet = React.useMemo(
    () => new Set(availableRouteOptions.map(option => option.routeKey)),
    [availableRouteOptions],
  );

  const persistedRouteKeys = isResident ? residentRouteKeys : dashboardRouteKeys;

  const normalizedPersistedRouteKeys = React.useMemo(
    () => sanitizeRouteKeys(persistedRouteKeys, availableRouteKeySet, selectionLimit),
    [availableRouteKeySet, persistedRouteKeys, selectionLimit],
  );

  const fallbackRouteKeys = React.useMemo(
    () => availableRouteOptions.slice(0, selectionLimit).map(option => option.routeKey),
    [availableRouteOptions, selectionLimit],
  );

  const selectedRouteKeys =
    normalizedPersistedRouteKeys.length > 0
      ? normalizedPersistedRouteKeys
      : fallbackRouteKeys;

  React.useEffect(() => {
    if (areArraysEqual(persistedRouteKeys, selectedRouteKeys)) {
      return;
    }

    dispatch(
      setQuickNavigationRouteKeys({
        target,
        routeKeys: selectedRouteKeys,
      }),
    );
  }, [dispatch, persistedRouteKeys, selectedRouteKeys, target]);

  const selectedRouteOptions = React.useMemo(() => {
    const routeMap = new Map(
      availableRouteOptions.map(option => [option.routeKey, option]),
    );

    return selectedRouteKeys
      .map(routeKey => routeMap.get(routeKey))
      .filter((option): option is QuickRouteOption => Boolean(option));
  }, [availableRouteOptions, selectedRouteKeys]);

  const setSelectedRouteKeys = React.useCallback(
    (routeKeys: string[]) => {
      const sanitizedRouteKeys = sanitizeRouteKeys(
        routeKeys,
        availableRouteKeySet,
        selectionLimit,
      );

      dispatch(
        setQuickNavigationRouteKeys({
          target,
          routeKeys: sanitizedRouteKeys,
        }),
      );

      return sanitizedRouteKeys;
    },
    [availableRouteKeySet, dispatch, selectionLimit, target],
  );

  const toggleRouteSelection = React.useCallback(
    (routeKey: string) => {
      const alreadySelected = selectedRouteKeys.includes(routeKey);

      if (alreadySelected) {
        setSelectedRouteKeys(
          selectedRouteKeys.filter(selectedRouteKey => selectedRouteKey !== routeKey),
        );
        return {
          success: true,
          reason: 'removed' as const,
        };
      }

      if (selectedRouteKeys.length >= selectionLimit) {
        return {
          success: false,
          reason: 'limit' as const,
        };
      }

      setSelectedRouteKeys([...selectedRouteKeys, routeKey]);
      return {
        success: true,
        reason: 'added' as const,
      };
    },
    [selectedRouteKeys, selectionLimit, setSelectedRouteKeys],
  );

  return {
    isResident,
    selectionLimit,
    availableRouteOptions,
    selectedRouteKeys,
    selectedRouteOptions,
    setSelectedRouteKeys,
    toggleRouteSelection,
  };
}

export type { QuickRouteOption };