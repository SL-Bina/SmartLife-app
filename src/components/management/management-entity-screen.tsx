import React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import AppPageLayout from '../common/app-page-layout';
import { useThemeMode } from '../../hooks/use-theme';
import { blocksAPI, buildingsAPI, complexesAPI, mtkAPI } from '../../services/management';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setSelectedManagementBlockId,
  setSelectedManagementBuildingId,
  setSelectedManagementComplexId,
  setSelectedManagementMtkId,
} from '../../store/management-filter-slice';

import { ManagementDetailsModal } from './components/management-details-modal';
import { ManagementEntityList } from './components/management-entity-list';
import { ManagementFormModal } from './components/management-structured-form-modal';
import { ManagementHeroSection } from './components/management-hero-section';
import { managementStyles as styles } from './management-styles';
import {
  EntityItem,
  ManagementEntityScreenProps,
  MtkOption,
  QueryParams,
} from './management-types';
import {
  extractItem,
  extractItems,
  extractPaginationMeta,
  getEntityId,
  getValueByPath,
  setValueByPath,
  toDetailRows,
  toErrorMessage,
  toInputValue,
  toRecord,
} from './management-utils';

export default function ManagementEntityScreen({
  title,
  entityLabel,
  api,
  fields,
  searchKey = 'name',
  searchPlaceholder = 'Axtar...',
  emptyMessage = 'Məlumat yoxdur',
  enablePropertyBinding = false,
  enableFieldReset = false,
}: ManagementEntityScreenProps) {
  const ITEMS_PER_PAGE = 50;
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';
  const dispatch = useAppDispatch();
  const selectedMtkId = useAppSelector(state => state.managementFilter.selectedMtkId);
  const selectedComplexId = useAppSelector(state => state.managementFilter.selectedComplexId);
  const selectedBuildingId = useAppSelector(state => state.managementFilter.selectedBuildingId);
  const selectedBlockId = useAppSelector(state => state.managementFilter.selectedBlockId);

  const [items, setItems] = React.useState<EntityItem[]>([]);
  const [totalItems, setTotalItems] = React.useState<number | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [hasMorePages, setHasMorePages] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [appliedSearch, setAppliedSearch] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const [formVisible, setFormVisible] = React.useState(false);
  const [detailsVisible, setDetailsVisible] = React.useState(false);
  const [detailsItem, setDetailsItem] = React.useState<EntityItem | null>(null);
  const [editingItem, setEditingItem] = React.useState<EntityItem | null>(null);
  const [formState, setFormState] = React.useState<Record<string, string>>({});
  const [propertyIdInput, setPropertyIdInput] = React.useState('');
  const [mtkOptions, setMtkOptions] = React.useState<MtkOption[]>([]);
  const [complexOptions, setComplexOptions] = React.useState<MtkOption[]>([]);
  const [buildingOptions, setBuildingOptions] = React.useState<MtkOption[]>([]);
  const [blockOptions, setBlockOptions] = React.useState<MtkOption[]>([]);
  const [manualResetComplex, setManualResetComplex] = React.useState(false);
  const [manualResetBuilding, setManualResetBuilding] = React.useState(false);
  const [manualResetBlock, setManualResetBlock] = React.useState(false);
  const loadMoreLockRef = React.useRef(false);
  const isMountedRef = React.useRef(true);
  const lastMtkIdForComplexRef = React.useRef<string | number | null>(selectedMtkId);
  const currentMtkIdRef = React.useRef<string | number | null>(selectedMtkId);
  const lastComplexIdForBuildingRef = React.useRef<string | number | null>(selectedComplexId);
  const currentComplexIdRef = React.useRef<string | number | null>(selectedComplexId);
  const lastBuildingIdForBlockRef = React.useRef<string | number | null>(selectedBuildingId);
  const currentBuildingIdRef = React.useRef<string | number | null>(selectedBuildingId);
  const isBuildingEntity = React.useMemo(
    () => entityLabel.trim().toLowerCase() === 'building',
    [entityLabel],
  );
  const isBlockEntity = React.useMemo(
    () => entityLabel.trim().toLowerCase() === 'block',
    [entityLabel],
  );
  const isPropertyEntity = React.useMemo(
    () => entityLabel.trim().toLowerCase() === 'property',
    [entityLabel],
  );
  const isResidentEntity = React.useMemo(
    () => entityLabel.trim().toLowerCase() === 'resident',
    [entityLabel],
  );
  const requiresComplexFilter = React.useMemo(
    () => isBuildingEntity || isBlockEntity || isPropertyEntity || isResidentEntity,
    [isBlockEntity, isBuildingEntity, isPropertyEntity, isResidentEntity],
  );
  const requiresBuildingFilter = React.useMemo(
    () => isBlockEntity || isPropertyEntity || isResidentEntity,
    [isBlockEntity, isPropertyEntity, isResidentEntity],
  );
  const requiresBlockFilter = React.useMemo(
    () => isPropertyEntity,
    [isPropertyEntity],
  );
  const requiresMtkFilter = React.useMemo(
    () => entityLabel.trim().toLowerCase() !== 'mtk',
    [entityLabel],
  );

  const effectiveSelectedMtkId = React.useMemo(() => {
    const hasSelected =
      selectedMtkId !== null &&
      mtkOptions.some(option => String(option.id) === String(selectedMtkId));

    if (hasSelected) {
      return selectedMtkId;
    }

    return mtkOptions[0]?.id ?? null;
  }, [mtkOptions, selectedMtkId]);

  currentMtkIdRef.current = effectiveSelectedMtkId;

  const effectiveSelectedComplexId = React.useMemo(() => {
    if (!requiresComplexFilter) {
      return null;
    }

    const hasSelected =
      selectedComplexId !== null &&
      complexOptions.some(option => String(option.id) === String(selectedComplexId));

    if (hasSelected) {
      return selectedComplexId;
    }

    return null;
  }, [complexOptions, requiresComplexFilter, selectedComplexId]);

  currentComplexIdRef.current = effectiveSelectedComplexId;

  const effectiveSelectedBuildingId = React.useMemo(() => {
    if (!requiresBuildingFilter) {
      return null;
    }

    const hasSelected =
      selectedBuildingId !== null &&
      buildingOptions.some(option => String(option.id) === String(selectedBuildingId));

    if (hasSelected) {
      return selectedBuildingId;
    }

    return null;
  }, [buildingOptions, requiresBuildingFilter, selectedBuildingId]);

  currentBuildingIdRef.current = effectiveSelectedBuildingId;

  const effectiveSelectedBlockId = React.useMemo(() => {
    if (!requiresBlockFilter) {
      return null;
    }

    const hasSelected =
      selectedBlockId !== null &&
      blockOptions.some(option => String(option.id) === String(selectedBlockId));

    if (hasSelected) {
      return selectedBlockId;
    }

    return null;
  }, [blockOptions, requiresBlockFilter, selectedBlockId]);

  const detailsRows = React.useMemo(() => toDetailRows(detailsItem, fields), [detailsItem, fields]);

  const selectedMtkName = React.useMemo(() => {
    const active = mtkOptions.find(
      option =>
        effectiveSelectedMtkId !== null &&
        String(option.id) === String(effectiveSelectedMtkId),
    );
    if (active) return active.name;
    return mtkOptions[0]?.name || undefined;
  }, [effectiveSelectedMtkId, mtkOptions]);

  const selectedComplexName = React.useMemo(() => {
    const active = complexOptions.find(
      option =>
        effectiveSelectedComplexId !== null &&
        String(option.id) === String(effectiveSelectedComplexId),
    );
    if (active) return active.name;
    return undefined;
  }, [complexOptions, effectiveSelectedComplexId]);

  const selectedBuildingName = React.useMemo(() => {
    const active = buildingOptions.find(
      option =>
        effectiveSelectedBuildingId !== null &&
        String(option.id) === String(effectiveSelectedBuildingId),
    );
    if (active) return active.name;
    return undefined;
  }, [buildingOptions, effectiveSelectedBuildingId]);

  const selectedBlockName = React.useMemo(() => {
    const active = blockOptions.find(
      option =>
        effectiveSelectedBlockId !== null &&
        String(option.id) === String(effectiveSelectedBlockId),
    );
    if (active) return active.name;
    return undefined;
  }, [blockOptions, effectiveSelectedBlockId]);

  React.useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );

  const loadMtkOptions = React.useCallback(async () => {
    try {
      const response = await mtkAPI.getLookupList({ per_page: 1000 });
      const source: unknown[] = Array.isArray(response) ? response : extractItems(response);

      const normalized = source
        .map(item => {
          const record = toRecord(item);
          const id = record.id;
          const name = typeof record.name === 'string' ? record.name.trim() : '';

          if ((typeof id === 'string' || typeof id === 'number') && name.length > 0) {
            return { id, name };
          }

          return null;
        })
        .filter((item): item is MtkOption => Boolean(item));

      if (!isMountedRef.current || normalized.length === 0) return;

      setMtkOptions(normalized);

      const hasSelected =
        selectedMtkId !== null &&
        normalized.some(option => String(option.id) === String(selectedMtkId));

      if (!hasSelected) {
        dispatch(setSelectedManagementMtkId(normalized[0].id));
      }
    } catch {}
  }, [dispatch, selectedMtkId]);

  React.useEffect(() => {
    void loadMtkOptions();
  }, [loadMtkOptions]);

  React.useEffect(() => {
    if (!requiresComplexFilter) {
      return;
    }

    const previous = lastMtkIdForComplexRef.current;
    const next = effectiveSelectedMtkId;
    const changed =
      (previous === null && next !== null) ||
      (previous !== null && next === null) ||
      (previous !== null && next !== null && String(previous) !== String(next));

    if (changed) {
      setComplexOptions([]);
      dispatch(setSelectedManagementComplexId(null));
      if (requiresBuildingFilter) {
        setBuildingOptions([]);
        dispatch(setSelectedManagementBuildingId(null));
      }
      if (requiresBlockFilter) {
        setBlockOptions([]);
        dispatch(setSelectedManagementBlockId(null));
      }
    }

    lastMtkIdForComplexRef.current = next;
  }, [
    dispatch,
    effectiveSelectedMtkId,
    requiresBlockFilter,
    requiresBuildingFilter,
    requiresComplexFilter,
  ]);

  const loadComplexOptions = React.useCallback(async () => {
    if (!requiresComplexFilter) {
      return;
    }

    if (effectiveSelectedMtkId === null) {
      setComplexOptions([]);
      dispatch(setSelectedManagementComplexId(null));
      if (requiresBuildingFilter) {
        setBuildingOptions([]);
        dispatch(setSelectedManagementBuildingId(null));
      }
      if (requiresBlockFilter) {
        setBlockOptions([]);
        dispatch(setSelectedManagementBlockId(null));
      }
      return;
    }

    try {
      const requestMtkId = effectiveSelectedMtkId;
      const response = await complexesAPI.search({
        page: 1,
        per_page: 1000,
        mtk_ids: [effectiveSelectedMtkId],
      });
      const source: unknown[] = Array.isArray(response) ? response : extractItems(response);

      const normalized = source
        .map(item => {
          const record = toRecord(item);
          const id = record.id;
          const name = typeof record.name === 'string' ? record.name.trim() : '';

          if ((typeof id === 'string' || typeof id === 'number') && name.length > 0) {
            return { id, name };
          }

          return null;
        })
        .filter((item): item is MtkOption => Boolean(item));

      if (!isMountedRef.current) return;
      if (currentMtkIdRef.current === null) return;
      if (String(currentMtkIdRef.current) !== String(requestMtkId)) {
        return;
      }

      setComplexOptions(normalized);

      const hasSelected =
        selectedComplexId !== null &&
        normalized.some(option => String(option.id) === String(selectedComplexId));

      if (normalized.length === 0) {
        dispatch(setSelectedManagementComplexId(null));
        if (requiresBuildingFilter) {
          setBuildingOptions([]);
          dispatch(setSelectedManagementBuildingId(null));
        }
        if (requiresBlockFilter) {
          setBlockOptions([]);
          dispatch(setSelectedManagementBlockId(null));
        }
        return;
      }

      if (!hasSelected && !manualResetComplex) {
        dispatch(setSelectedManagementComplexId(normalized[0].id));
      }
    } catch {
      if (!isMountedRef.current) return;
      setComplexOptions([]);
      dispatch(setSelectedManagementComplexId(null));
      if (requiresBuildingFilter) {
        setBuildingOptions([]);
        dispatch(setSelectedManagementBuildingId(null));
      }
      if (requiresBlockFilter) {
        setBlockOptions([]);
        dispatch(setSelectedManagementBlockId(null));
      }
    }
  }, [
    dispatch,
    effectiveSelectedMtkId,
    requiresBlockFilter,
    requiresBuildingFilter,
    requiresComplexFilter,
    manualResetComplex,
    selectedComplexId,
  ]);

  React.useEffect(() => {
    void loadComplexOptions();
  }, [loadComplexOptions]);

  React.useEffect(() => {
    if (!requiresBuildingFilter) {
      return;
    }

    const previous = lastComplexIdForBuildingRef.current;
    const next = effectiveSelectedComplexId;
    const changed =
      (previous === null && next !== null) ||
      (previous !== null && next === null) ||
      (previous !== null && next !== null && String(previous) !== String(next));

    if (changed) {
      setBuildingOptions([]);
      dispatch(setSelectedManagementBuildingId(null));
      if (requiresBlockFilter) {
        setBlockOptions([]);
        dispatch(setSelectedManagementBlockId(null));
      }
    }

    lastComplexIdForBuildingRef.current = next;
  }, [dispatch, effectiveSelectedComplexId, requiresBlockFilter, requiresBuildingFilter]);

  const loadBuildingOptions = React.useCallback(async () => {
    if (!requiresBuildingFilter) {
      return;
    }

    if (effectiveSelectedComplexId === null) {
      setBuildingOptions([]);
      dispatch(setSelectedManagementBuildingId(null));
      if (requiresBlockFilter) {
        setBlockOptions([]);
        dispatch(setSelectedManagementBlockId(null));
      }
      return;
    }

    try {
      const requestComplexId = effectiveSelectedComplexId;
      const response = await buildingsAPI.search({
        page: 1,
        per_page: 1000,
        complex_ids: [effectiveSelectedComplexId],
        ...(effectiveSelectedMtkId !== null ? { mtk_ids: [effectiveSelectedMtkId] } : {}),
      });
      const source: unknown[] = Array.isArray(response) ? response : extractItems(response);

      const normalized = source
        .map(item => {
          const record = toRecord(item);
          const id = record.id;
          const name = typeof record.name === 'string' ? record.name.trim() : '';

          if ((typeof id === 'string' || typeof id === 'number') && name.length > 0) {
            return { id, name };
          }

          return null;
        })
        .filter((item): item is MtkOption => Boolean(item));

      if (!isMountedRef.current) return;
      if (currentComplexIdRef.current === null) return;
      if (String(currentComplexIdRef.current) !== String(requestComplexId)) {
        return;
      }

      setBuildingOptions(normalized);

      const hasSelected =
        selectedBuildingId !== null &&
        normalized.some(option => String(option.id) === String(selectedBuildingId));

      if (normalized.length === 0) {
        dispatch(setSelectedManagementBuildingId(null));
        if (requiresBlockFilter) {
          setBlockOptions([]);
          dispatch(setSelectedManagementBlockId(null));
        }
        return;
      }

      if (!hasSelected && !manualResetBuilding) {
        dispatch(setSelectedManagementBuildingId(normalized[0].id));
      }
    } catch {
      if (!isMountedRef.current) return;
      setBuildingOptions([]);
      dispatch(setSelectedManagementBuildingId(null));
      if (requiresBlockFilter) {
        setBlockOptions([]);
        dispatch(setSelectedManagementBlockId(null));
      }
    }
  }, [
    dispatch,
    effectiveSelectedComplexId,
    effectiveSelectedMtkId,
    requiresBlockFilter,
    manualResetBuilding,
    requiresBuildingFilter,
    selectedBuildingId,
  ]);

  React.useEffect(() => {
    void loadBuildingOptions();
  }, [loadBuildingOptions]);

  React.useEffect(() => {
    if (!requiresBlockFilter) {
      return;
    }

    const previous = lastBuildingIdForBlockRef.current;
    const next = effectiveSelectedBuildingId;
    const changed =
      (previous === null && next !== null) ||
      (previous !== null && next === null) ||
      (previous !== null && next !== null && String(previous) !== String(next));

    if (changed) {
      setBlockOptions([]);
      dispatch(setSelectedManagementBlockId(null));
    }

    lastBuildingIdForBlockRef.current = next;
  }, [dispatch, effectiveSelectedBuildingId, requiresBlockFilter]);

  const loadBlockOptions = React.useCallback(async () => {
    if (!requiresBlockFilter) {
      return;
    }

    if (effectiveSelectedBuildingId === null) {
      setBlockOptions([]);
      dispatch(setSelectedManagementBlockId(null));
      return;
    }

    try {
      const requestBuildingId = effectiveSelectedBuildingId;
      const response = await blocksAPI.search({
        page: 1,
        per_page: 1000,
        building_ids: [effectiveSelectedBuildingId],
        ...(effectiveSelectedComplexId !== null ? { complex_ids: [effectiveSelectedComplexId] } : {}),
        ...(effectiveSelectedMtkId !== null ? { mtk_ids: [effectiveSelectedMtkId] } : {}),
      });
      const source: unknown[] = Array.isArray(response) ? response : extractItems(response);

      const normalized = source
        .map(item => {
          const record = toRecord(item);
          const id = record.id;
          const name = typeof record.name === 'string' ? record.name.trim() : '';

          if ((typeof id === 'string' || typeof id === 'number') && name.length > 0) {
            return { id, name };
          }

          return null;
        })
        .filter((item): item is MtkOption => Boolean(item));

      if (!isMountedRef.current) return;
      if (currentBuildingIdRef.current === null) return;
      if (String(currentBuildingIdRef.current) !== String(requestBuildingId)) {
        return;
      }

      setBlockOptions(normalized);

      const hasSelected =
        selectedBlockId !== null &&
        normalized.some(option => String(option.id) === String(selectedBlockId));

      if (normalized.length === 0) {
        dispatch(setSelectedManagementBlockId(null));
        return;
      }

      if (!hasSelected && !manualResetBlock) {
        dispatch(setSelectedManagementBlockId(normalized[0].id));
      }
    } catch {
      if (!isMountedRef.current) return;
      setBlockOptions([]);
      dispatch(setSelectedManagementBlockId(null));
    }
  }, [
    dispatch,
    effectiveSelectedBuildingId,
    effectiveSelectedComplexId,
    effectiveSelectedMtkId,
    manualResetBlock,
    requiresBlockFilter,
    selectedBlockId,
  ]);

  React.useEffect(() => {
    void loadBlockOptions();
  }, [loadBlockOptions]);

  const openCreateModal = React.useCallback(() => {
    const initialState: Record<string, string> = {};
    fields.forEach(field => {
      initialState[field.key] = field.defaultValue ?? '';
    });

    setEditingItem(null);
    setFormState(initialState);
    setPropertyIdInput('');
    setFormVisible(true);
  }, [fields]);

  const openEditModal = React.useCallback(
    (item: EntityItem) => {
      const nextState: Record<string, string> = {};
      fields.forEach(field => {
        nextState[field.key] = toInputValue(getValueByPath(item, field.key));
      });

      setEditingItem(item);
      setFormState(nextState);
      setPropertyIdInput('');
      setFormVisible(true);
    },
    [fields],
  );

  const closeFormModal = React.useCallback(() => {
    if (submitting) return;
    setFormVisible(false);
  }, [submitting]);

  const resetFormFields = React.useCallback(() => {
    if (submitting) return;

    const nextState: Record<string, string> = {};
    fields.forEach(field => {
      nextState[field.key] = field.defaultValue ?? '';
    });

    setFormState(nextState);
    setPropertyIdInput('');
  }, [fields, submitting]);

  const loadItems = React.useCallback(
    async ({
      useSearch,
      searchValue,
      page,
      append,
    }: {
      useSearch: boolean;
      searchValue: string;
      page: number;
      append: boolean;
    }) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const requiresStrictComplexFilter = requiresComplexFilter && !isResidentEntity;
        const requiresStrictBuildingFilter = requiresBuildingFilter && !isResidentEntity;
        const requiresStrictBlockFilter = requiresBlockFilter && !isResidentEntity;

        if (requiresMtkFilter && effectiveSelectedMtkId === null) {
          setItems([]);
          setTotalItems(0);
          setCurrentPage(1);
          setHasMorePages(false);
          return;
        }

        if (requiresStrictComplexFilter && effectiveSelectedComplexId === null) {
          setItems([]);
          setTotalItems(0);
          setCurrentPage(1);
          setHasMorePages(false);
          return;
        }

        if (requiresStrictBuildingFilter && effectiveSelectedBuildingId === null) {
          setItems([]);
          setTotalItems(0);
          setCurrentPage(1);
          setHasMorePages(false);
          return;
        }

        if (requiresStrictBlockFilter && effectiveSelectedBlockId === null) {
          setItems([]);
          setTotalItems(0);
          setCurrentPage(1);
          setHasMorePages(false);
          return;
        }

        const params: QueryParams = { page, per_page: ITEMS_PER_PAGE };

        if (isPropertyEntity && effectiveSelectedBlockId !== null) {
          params.block_ids = [effectiveSelectedBlockId];
          if (effectiveSelectedBuildingId !== null) {
            params.building_ids = [effectiveSelectedBuildingId];
          }
          if (effectiveSelectedComplexId !== null) {
            params.complex_ids = [effectiveSelectedComplexId];
          }
          if (effectiveSelectedMtkId !== null) {
            params.mtk_ids = [effectiveSelectedMtkId];
          }
        } else if (isResidentEntity) {
          if (effectiveSelectedMtkId !== null) {
            params.mtk_ids = [effectiveSelectedMtkId];
          }
          if (effectiveSelectedComplexId !== null) {
            params.complex_ids = [effectiveSelectedComplexId];
          }
          if (effectiveSelectedBuildingId !== null) {
            params.building_ids = [effectiveSelectedBuildingId];
          }
        } else if (isBlockEntity && effectiveSelectedBuildingId !== null) {
          params.building_ids = [effectiveSelectedBuildingId];
          if (effectiveSelectedComplexId !== null) {
            params.complex_ids = [effectiveSelectedComplexId];
          }
          if (effectiveSelectedMtkId !== null) {
            params.mtk_ids = [effectiveSelectedMtkId];
          }
        } else if (isBuildingEntity && effectiveSelectedComplexId !== null) {
          params.complex_ids = [effectiveSelectedComplexId];
          if (effectiveSelectedMtkId !== null) {
            params.mtk_ids = [effectiveSelectedMtkId];
          }
        } else if (requiresMtkFilter && effectiveSelectedMtkId !== null) {
          params.mtk_ids = [effectiveSelectedMtkId];
        }

        const trimmedSearch = searchValue.trim();
        if (useSearch && trimmedSearch.length > 0) {
          params[searchKey] = trimmedSearch;
        }

        const response = useSearch && api.search ? await api.search(params) : await api.getAll(params);
        const nextItems = extractItems(response);
        const pagination = extractPaginationMeta(response, {
          requestedPage: page,
          requestedPerPage: ITEMS_PER_PAGE,
          receivedCount: nextItems.length,
        });

        setItems(prevItems => (append ? [...prevItems, ...nextItems] : nextItems));
        setCurrentPage(pagination.page);
        setHasMorePages(pagination.hasMore);
        setTotalItems(pagination.total);
      } catch (loadError) {
        setError(toErrorMessage(loadError, `${entityLabel} məlumatları yüklənmədi`));
      } finally {
        if (append) {
          setLoadingMore(false);
          loadMoreLockRef.current = false;
        } else {
          setLoading(false);
        }
      }
    },
    [
      api,
      effectiveSelectedBlockId,
      effectiveSelectedBuildingId,
      effectiveSelectedComplexId,
      effectiveSelectedMtkId,
      entityLabel,
      isBlockEntity,
      isBuildingEntity,
      isPropertyEntity,
      isResidentEntity,
      requiresBlockFilter,
      requiresBuildingFilter,
      requiresComplexFilter,
      requiresMtkFilter,
      searchKey,
      ITEMS_PER_PAGE,
    ],
  );

  React.useEffect(() => {
    setAppliedSearch('');
    void loadItems({
      useSearch: false,
      searchValue: '',
      page: 1,
      append: false,
    });
  }, [loadItems]);

  const onSearchPress = React.useCallback(() => {
    const trimmedSearch = search.trim();
    setAppliedSearch(trimmedSearch);

    void loadItems({
      useSearch: trimmedSearch.length > 0,
      searchValue: trimmedSearch,
      page: 1,
      append: false,
    });
  }, [loadItems, search]);

  const onLoadMore = React.useCallback(() => {
    if (loading || loadingMore || !hasMorePages || loadMoreLockRef.current) {
      return;
    }

    loadMoreLockRef.current = true;

    void loadItems({
      useSearch: appliedSearch.length > 0,
      searchValue: appliedSearch,
      page: currentPage + 1,
      append: true,
    });
  }, [appliedSearch, currentPage, hasMorePages, loadItems, loading, loadingMore]);

  const onResetHierarchyFilters = React.useCallback(() => {
    setSearch('');
    setAppliedSearch('');

    if (!requiresComplexFilter) {
      return;
    }

    setManualResetComplex(true);
    setManualResetBuilding(true);
    setManualResetBlock(true);

    dispatch(setSelectedManagementComplexId(null));
    dispatch(setSelectedManagementBuildingId(null));
    dispatch(setSelectedManagementBlockId(null));

    setBuildingOptions([]);
    setBlockOptions([]);
  }, [dispatch, requiresComplexFilter]);

  const parsePayload = React.useCallback((): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};

    fields.forEach(field => {
      const rawValue = (formState[field.key] ?? '').trim();

      if (!rawValue) {
        return;
      }

      if (field.type === 'number') {
        const numericValue = Number(rawValue);
        if (!Number.isNaN(numericValue)) {
          setValueByPath(payload, field.key, numericValue);
        }
        return;
      }

      setValueByPath(payload, field.key, rawValue);
    });

    return payload;
  }, [fields, formState]);

  const validateRequired = React.useCallback((): string | null => {
    for (const field of fields) {
      if (!field.required) continue;

      const rawValue = formState[field.key] ?? '';
      if (rawValue.trim().length === 0) {
        return `${field.label} boş ola bilməz`;
      }
    }

    return null;
  }, [fields, formState]);

  const onSubmit = React.useCallback(async () => {
    try {
      const requiredError = validateRequired();
      if (requiredError) {
        Alert.alert('Xəta', requiredError);
        return;
      }

      const payload = parsePayload();
      const itemId = editingItem ? getEntityId(editingItem) : null;

      setSubmitting(true);
      setError(null);

      if (editingItem && itemId !== null && api.update) {
        await api.update(itemId, payload);
      } else if (!editingItem && api.add) {
        await api.add(payload);
      } else {
        Alert.alert('Məlumat', 'Bu əməliyyat bu modul üçün aktiv deyil');
        return;
      }

      setFormVisible(false);
      await loadItems({
        useSearch: appliedSearch.length > 0,
        searchValue: appliedSearch,
        page: 1,
        append: false,
      });
    } catch (submitError) {
      setError(toErrorMessage(submitError, 'Saxlama əməliyyatı alınmadı'));
    } finally {
      setSubmitting(false);
    }
  }, [api, appliedSearch, editingItem, loadItems, parsePayload, validateRequired]);

  const onDelete = React.useCallback(
    (item: EntityItem) => {
      const itemId = getEntityId(item);
      if (!api.delete || itemId === null) {
        Alert.alert('Məlumat', 'Bu qeyd silinə bilmədi');
        return;
      }

      Alert.alert('Silmə təsdiqi', `${entityLabel} silinsin?`, [
        { text: 'Xeyr', style: 'cancel' },
        {
          text: 'Bəli',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setSubmitting(true);
                setError(null);
                await api.delete?.(itemId);
                await loadItems({
                  useSearch: appliedSearch.length > 0,
                  searchValue: appliedSearch,
                  page: 1,
                  append: false,
                });
              } catch (deleteError) {
                setError(toErrorMessage(deleteError, 'Silmə əməliyyatı alınmadı'));
              } finally {
                setSubmitting(false);
              }
            })();
          },
        },
      ]);
    },
    [api, appliedSearch, entityLabel, loadItems],
  );

  const onView = React.useCallback(
    async (item: EntityItem) => {
      const itemId = getEntityId(item);

      try {
        setSubmitting(true);
        const response = api.getById && itemId !== null ? await api.getById(itemId) : item;

        const detailObject = extractItem(response);
        const mergedDetail = {
          ...item,
          ...detailObject,
        };
        setDetailsItem(mergedDetail);
        setDetailsVisible(true);
      } catch (viewError) {
        setError(toErrorMessage(viewError, 'Detallar yüklənmədi'));
      } finally {
        setSubmitting(false);
      }
    },
    [api],
  );

  const closeDetailsModal = React.useCallback(() => {
    setDetailsVisible(false);
    setDetailsItem(null);
  }, []);

  const onEditFromDetails = React.useCallback(() => {
    if (!detailsItem) return;

    closeDetailsModal();
    openEditModal(detailsItem);
  }, [closeDetailsModal, detailsItem, openEditModal]);

  const onDeleteFromDetails = React.useCallback(() => {
    if (!detailsItem) return;

    closeDetailsModal();
    onDelete(detailsItem);
  }, [closeDetailsModal, detailsItem, onDelete]);

  const withResidentPropertyAction = React.useCallback(
    async (mode: 'bind' | 'unbind') => {
      if (!editingItem) return;

      const residentId = getEntityId(editingItem);
      if (residentId === null) {
        Alert.alert('Xəta', 'Resident ID tapılmadı');
        return;
      }

      const propertyId = Number(propertyIdInput.trim());
      if (!Number.isFinite(propertyId) || propertyId <= 0) {
        Alert.alert('Xəta', 'Property ID düzgün daxil edilməlidir');
        return;
      }

      try {
        setSubmitting(true);
        if (mode === 'bind' && api.bindProperty) {
          await api.bindProperty(residentId, { property_id: propertyId });
        }

        if (mode === 'unbind' && api.unbindProperty) {
          await api.unbindProperty(residentId, { property_id: propertyId });
        }

        await loadItems({
          useSearch: appliedSearch.length > 0,
          searchValue: appliedSearch,
          page: 1,
          append: false,
        });
        Alert.alert('Uğurlu', mode === 'bind' ? 'Property bağlandı' : 'Property ayrıldı');
      } catch (bindingError) {
        setError(toErrorMessage(bindingError, 'Property əməliyyatı alınmadı'));
      } finally {
        setSubmitting(false);
      }
    },
    [api, appliedSearch, editingItem, loadItems, propertyIdInput],
  );

  const showComplexSelect = requiresComplexFilter;
  const showBuildingSelect = requiresBuildingFilter && effectiveSelectedComplexId !== null;
  const showBlockSelect = requiresBlockFilter && effectiveSelectedBuildingId !== null;

  return (
    <AppPageLayout
      title={title}
      isDark={isDark}
      settingsRouteKey="settings"
      profileRouteKey="profile"
      contentStyle={styles.layoutContent}
      mtkOptions={mtkOptions.map(option => option.name)}
      initialMtk={selectedMtkName}
      onMtkChange={mtkName => {
        const matched = mtkOptions.find(option => option.name === mtkName);
        const nextMtkId = matched?.id ?? null;
        const isSameSelection =
          (effectiveSelectedMtkId === null && nextMtkId === null)
          || (effectiveSelectedMtkId !== null
            && nextMtkId !== null
            && String(effectiveSelectedMtkId) === String(nextMtkId));

        if (isSameSelection) {
          void loadItems({
            useSearch: appliedSearch.length > 0,
            searchValue: appliedSearch,
            page: 1,
            append: false,
          });
          return;
        }

        setManualResetComplex(false);
        setManualResetBuilding(false);
        setManualResetBlock(false);
        dispatch(setSelectedManagementMtkId(nextMtkId));
        if (requiresComplexFilter) {
          setComplexOptions([]);
          dispatch(setSelectedManagementComplexId(null));
        }
        if (requiresBuildingFilter) {
          setBuildingOptions([]);
          dispatch(setSelectedManagementBuildingId(null));
        }
        if (requiresBlockFilter) {
          setBlockOptions([]);
          dispatch(setSelectedManagementBlockId(null));
        }
      }}
      onMtkDropdownOpen={() => {
        void loadMtkOptions();
      }}
      onReachEnd={onLoadMore}
      scrollable
    >
      <View style={[styles.screen, isDark ? styles.screenDark : styles.screenLight]}>
        <ManagementHeroSection
          isDark={isDark}
          entityLabel={entityLabel}
          totalItems={totalItems ?? items.length}
          selectedMtkName={selectedMtkName}
          selectedComplexName={selectedComplexName}
          complexOptions={showComplexSelect ? complexOptions.map(option => option.name) : undefined}
          selectedBuildingName={selectedBuildingName}
          buildingOptions={showBuildingSelect ? buildingOptions.map(option => option.name) : undefined}
          selectedBlockName={selectedBlockName}
          blockOptions={showBlockSelect ? blockOptions.map(option => option.name) : undefined}
          showFilterReset={isResidentEntity}
          onResetFilters={isResidentEntity ? onResetHierarchyFilters : undefined}
          search={search}
          searchPlaceholder={searchPlaceholder}
          error={error}
          onSearchChange={setSearch}
          onComplexSelect={
            requiresComplexFilter
              ? complexName => {
                  setManualResetComplex(false);
                  setManualResetBuilding(true);
                  setManualResetBlock(true);
                  const matched = complexOptions.find(option => option.name === complexName);
                  dispatch(setSelectedManagementComplexId(matched?.id ?? null));
                  if (requiresBuildingFilter) {
                    setBuildingOptions([]);
                    dispatch(setSelectedManagementBuildingId(null));
                  }
                  if (requiresBlockFilter) {
                    setBlockOptions([]);
                    dispatch(setSelectedManagementBlockId(null));
                  }
                }
              : undefined
          }
          onBuildingSelect={
            showBuildingSelect
              ? buildingName => {
                  setManualResetBuilding(false);
                  setManualResetBlock(true);
                  const matched = buildingOptions.find(option => option.name === buildingName);
                  dispatch(setSelectedManagementBuildingId(matched?.id ?? null));
                  if (requiresBlockFilter) {
                    setBlockOptions([]);
                    dispatch(setSelectedManagementBlockId(null));
                  }
                }
              : undefined
          }
          onBlockSelect={
            showBlockSelect
              ? blockName => {
                  setManualResetBlock(false);
                  const matched = blockOptions.find(option => option.name === blockName);
                  dispatch(setSelectedManagementBlockId(matched?.id ?? null));
                }
              : undefined
          }
          onSearchPress={onSearchPress}
          onRefreshPress={() => {
            void loadItems({
              useSearch: appliedSearch.length > 0,
              searchValue: appliedSearch,
              page: 1,
              append: false,
            });
          }}
          onCreatePress={openCreateModal}
        />

        <ManagementEntityList
          isDark={isDark}
          loading={loading}
          loadingMore={loadingMore}
          items={items}
          fields={fields}
          emptyMessage={emptyMessage}
          onView={item => {
            void onView(item);
          }}
        />
      </View>

      <ManagementFormModal
        visible={formVisible}
        isDark={isDark}
        entityLabel={entityLabel}
        fields={fields}
        editingItem={editingItem}
        formState={formState}
        propertyIdInput={propertyIdInput}
        submitting={submitting}
        enablePropertyBinding={enablePropertyBinding}
        enableFieldReset={enableFieldReset}
        canBindProperty={Boolean(api.bindProperty && api.unbindProperty)}
        onClose={closeFormModal}
        onSubmit={() => {
          void onSubmit();
        }}
        onResetFields={resetFormFields}
        onFieldChange={(fieldKey: string, value: string) => {
          setFormState(prev => ({ ...prev, [fieldKey]: value }));
        }}
        onPropertyIdChange={setPropertyIdInput}
        onBind={() => {
          void withResidentPropertyAction('bind');
        }}
        onUnbind={() => {
          void withResidentPropertyAction('unbind');
        }}
      />

      <ManagementDetailsModal
        visible={detailsVisible}
        isDark={isDark}
        entityLabel={entityLabel}
        detailsRows={detailsRows}
        onClose={closeDetailsModal}
        onEdit={onEditFromDetails}
        onDelete={onDeleteFromDetails}
      />

      {submitting ? (
        <View style={styles.submittingOverlay} pointerEvents="none">
          <View style={styles.submittingLoader}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        </View>
      ) : null}
    </AppPageLayout>
  );
}
