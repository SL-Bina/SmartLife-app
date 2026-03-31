import React from 'react';
import { useIsFocused } from '@react-navigation/native';

import notificationsAPI from '../services/notifications-api';

type Dictionary = Record<string, unknown>;

const toRecord = (value: unknown): Dictionary => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Dictionary;
  }

  return {};
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const toString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
};

const isReadNotification = (item: Dictionary): boolean => {
  if (typeof item.read === 'boolean') {
    return item.read;
  }

  if (item.read_at !== null && item.read_at !== undefined && toString(item.read_at)) {
    return true;
  }

  if (item.readAt !== null && item.readAt !== undefined && toString(item.readAt)) {
    return true;
  }

  const status = toString(item.status).toLowerCase();
  return status === 'read' || status === 'seen';
};

const extractList = (payload: unknown): Dictionary[] => {
  const root = toRecord(payload);
  const first = root.data;
  const second = toRecord(first).data;

  const candidates = [payload, first, second, toRecord(first).items, toRecord(second).items];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map(item => toRecord(item));
    }
  }

  return [];
};

const extractUnreadCount = (payload: unknown): number => {
  const root = toRecord(payload);
  const first = toRecord(root.data);
  const second = toRecord(first.data);

  const directCount =
    toNumber(root.unread_count)
    ?? toNumber(root.unreadCount)
    ?? toNumber(first.unread_count)
    ?? toNumber(first.unreadCount)
    ?? toNumber(second.unread_count)
    ?? toNumber(second.unreadCount);

  if (typeof directCount === 'number') {
    return Math.max(0, directCount);
  }

  const list = extractList(payload);
  return list.filter(item => !isReadNotification(item)).length;
};

export function useNotificationUnreadCount() {
  const isFocused = useIsFocused();
  const [unreadCount, setUnreadCount] = React.useState(0);

  const refreshUnreadCount = React.useCallback(async () => {
    try {
      const response = await notificationsAPI.getMyNotifications(1);
      const count = extractUnreadCount(response);
      setUnreadCount(count);
    } catch {
      setUnreadCount(prev => prev);
    }
  }, []);

  React.useEffect(() => {
    if (!isFocused) {
      return;
    }

    void refreshUnreadCount();
    const timer = setInterval(() => {
      void refreshUnreadCount();
    }, 25000);

    return () => clearInterval(timer);
  }, [isFocused, refreshUnreadCount]);

  return {
    unreadCount,
    setUnreadCount,
    refreshUnreadCount,
  };
}

export default useNotificationUnreadCount;