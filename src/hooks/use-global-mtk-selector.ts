import React from 'react';

import { mtkAPI } from '../services/management-api';
import {
  asString,
  extractList,
  pickText,
  toRecord,
} from '../screens/resident/resident-data-utils';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectGlobalMtkHasLoaded,
  selectGlobalMtkIsLoading,
  selectGlobalMtkOptions,
  selectSelectedGlobalMtkId,
  setGlobalMtkLoading,
  setGlobalMtkOptions,
  setSelectedGlobalMtkId,
} from '../store/global-mtk-slice';

type MtkOption = {
  id: string | number;
  name: string;
};

const sameId = (
  left: string | number | null,
  right: string | number | null,
): boolean => {
  if (left === null || right === null) {
    return left === right;
  }

  return String(left) === String(right);
};

const normalizeMtkOptions = (payload: unknown): MtkOption[] => {
  const source = extractList(payload);
  const usedIds = new Set<string>();
  const normalized: MtkOption[] = [];

  source.forEach(item => {
    const record = toRecord(item);
    const id = record.id;
    if (typeof id !== 'string' && typeof id !== 'number') {
      return;
    }

    const name = pickText(record.name, record.title).trim();
    if (!name) {
      return;
    }

    const key = String(id);
    if (usedIds.has(key)) {
      return;
    }

    usedIds.add(key);
    normalized.push({ id, name });
  });

  return normalized;
};

export function useGlobalMtkSelector(enabled: boolean) {
  const dispatch = useAppDispatch();
  const selectedMtkId = useAppSelector(selectSelectedGlobalMtkId);
  const options = useAppSelector(selectGlobalMtkOptions);
  const isLoading = useAppSelector(selectGlobalMtkIsLoading);
  const hasLoaded = useAppSelector(selectGlobalMtkHasLoaded);

  const loadMtkOptions = React.useCallback(async () => {
    dispatch(setGlobalMtkLoading(true));

    try {
      const response = await mtkAPI.getLookupList({ per_page: 1000 });
      const normalized = normalizeMtkOptions(response);
      dispatch(setGlobalMtkOptions(normalized));
    } catch {
      // Keep last cached options and retry on next mount when needed.
    } finally {
      dispatch(setGlobalMtkLoading(false));
    }
  }, [dispatch]);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    if (isLoading) {
      return;
    }

    if (options.length > 0 || hasLoaded) {
      return;
    }

    void loadMtkOptions();
  }, [enabled, hasLoaded, isLoading, loadMtkOptions, options.length]);

  const effectiveSelectedMtkId = React.useMemo(() => {
    if (options.length === 0) {
      return selectedMtkId;
    }

    const hasSelected =
      selectedMtkId !== null
      && options.some(option => String(option.id) === String(selectedMtkId));

    if (hasSelected) {
      return selectedMtkId;
    }

    return options[0]?.id ?? null;
  }, [options, selectedMtkId]);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!sameId(effectiveSelectedMtkId, selectedMtkId)) {
      dispatch(setSelectedGlobalMtkId(effectiveSelectedMtkId));
    }
  }, [dispatch, effectiveSelectedMtkId, enabled, selectedMtkId]);

  const selectedMtkName = React.useMemo(() => {
    if (options.length === 0) {
      return '';
    }

    const selected = options.find(
      option => effectiveSelectedMtkId !== null && String(option.id) === String(effectiveSelectedMtkId),
    );

    return selected?.name ?? options[0]?.name ?? '';
  }, [effectiveSelectedMtkId, options]);

  const onMtkChange = React.useCallback(
    (mtkName: string) => {
      const normalizedName = asString(mtkName).trim();
      if (!normalizedName || options.length === 0) {
        return;
      }

      const matched = options.find(option => option.name === normalizedName);
      if (matched) {
        dispatch(setSelectedGlobalMtkId(matched.id));
      }
    },
    [dispatch, options],
  );

  return {
    mtkOptions: options.map(option => option.name),
    selectedMtkName,
    selectedMtkId: effectiveSelectedMtkId,
    onMtkChange,
    refreshMtkOptions: loadMtkOptions,
  };
}
